/**
 * Domain service for `example-entity` — the working CRUD over the derived SQLite
 * index (`ctx.db`, better-sqlite3). A derived plugin wires the `.json` file store
 * (`ctx.entityStore`) as the real source of truth; here the index doubles as the
 * store so the scaffold is immediately runnable.
 *
 * Identity rules:
 *  - `slug` is the stable PK = `slugify(name)` on create (`ac-slug-from-name`).
 *  - a name change does NOT move the slug; rename is explicit-only via `newSlug`
 *    and repoints page references + FKs (`ac-rename-via-newslug`).
 *  - `remove` is a hard delete with NO cascade — soft FKs to the deleted entity
 *    are reported as dangling, not removed (`ac-delete-no-cascade`).
 *  - `restore` is an idempotent UPSERT from a snapshot (`ac-restore-idempotent-upsert`).
 */

import type { MountContext } from '@c4s/plugin-runtime';
import { EXAMPLE_ENTITY_TABLE, EXAMPLE_ENTITY_TYPE, slugify } from '../../identity';
import type {
  CreateExampleEntityRequest,
  ExampleEntityListItem,
  ExampleEntitySnapshot,
  UpdateExampleEntityRequest,
} from '../dto';

type Actor = 'user' | 'agent';

/** No existing serializer-version constant for this scaffold's DTO — pick one. */
const SERIALIZER_VERSION = '1.0.0';

/** A row of the `example_entity` index (snake_case columns). */
interface ExampleEntityRow {
  slug: string;
  name: string;
  description: string | null;
  data: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExampleEntityListQuery {
  tags?: string[];
  filter?: 'and' | 'or';
}

function nowIso(): string {
  return new Date().toISOString();
}

function rowToSnapshot(row: ExampleEntityRow): ExampleEntitySnapshot {
  // Stable field order is enforced by the serializer's snapshot(); here we keep
  // the natural shape and let undefined-optionals fall away.
  const snapshot: ExampleEntitySnapshot = {
    slug: row.slug,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.description != null) snapshot.description = row.description;
  if (row.data != null) {
    try {
      snapshot.data = JSON.parse(row.data) as Record<string, unknown>;
    } catch {
      // Corrupt JSON in the index — skip rather than throw on read.
    }
  }
  return snapshot;
}

export class ExampleEntityService {
  constructor(
    private readonly db: MountContext['db'],
    private readonly ctx: MountContext,
  ) {}

  private rowToListItem(
    row: Pick<ExampleEntityRow, 'slug' | 'name' | 'description' | 'updated_at'>,
  ): ExampleEntityListItem {
    const item: ExampleEntityListItem = {
      slug: row.slug,
      name: row.name,
      updatedAt: row.updated_at,
      tags: this.ctx.tagsService?.getEntityTagSlugs?.(EXAMPLE_ENTITY_TYPE, row.slug) ?? [],
    };
    if (row.description != null) item.description = row.description;
    return item;
  }

  /** Create: `slug = slugify(name)`; `slug` is never accepted from the caller. */
  create(input: CreateExampleEntityRequest, actor: Actor = 'user'): ExampleEntitySnapshot {
    const slug = slugify(input.name);
    const ts = nowIso();
    this.db
      .prepare(
        `INSERT INTO ${EXAMPLE_ENTITY_TABLE}
           (slug, name, description, data, created_at, updated_at)
         VALUES (@slug, @name, @description, @data, @created_at, @updated_at)`,
      )
      .run({
        slug,
        name: input.name,
        description: input.description ?? null,
        data: input.data != null ? JSON.stringify(input.data) : null,
        created_at: ts,
        updated_at: ts,
      });
    this.broadcast(slug);
    try {
      this.ctx.versionService?.captureEntitySnapshot?.(
        EXAMPLE_ENTITY_TYPE,
        slug,
        'create',
        actor,
        'Created',
        SERIALIZER_VERSION,
      );
    } catch (err) {
      console.error(`[example-entity] captureEntitySnapshot failed for ${slug} (op=create):`, err);
      throw err;
    }
    return this.getBySlug(slug)!;
  }

  getBySlug(slug: string): ExampleEntitySnapshot | null {
    const row = this.db
      .prepare(`SELECT * FROM ${EXAMPLE_ENTITY_TABLE} WHERE slug = ?`)
      .get(slug) as ExampleEntityRow | undefined;
    return row ? rowToSnapshot(row) : null;
  }

  /**
   * Partial update. A `name` change leaves the slug untouched; rename happens ONLY
   * when `newSlug` is supplied (and repoints references/FKs). Returns `null` when
   * the slug does not exist so the router can answer 404.
   */
  update(
    slug: string,
    patch: UpdateExampleEntityRequest,
    actor: Actor = 'user',
  ): { snapshot: ExampleEntitySnapshot; previousSlug: string } | null {
    const existing = this.db
      .prepare(`SELECT * FROM ${EXAMPLE_ENTITY_TABLE} WHERE slug = ?`)
      .get(slug) as ExampleEntityRow | undefined;
    if (!existing) return null;

    const ts = nowIso();
    const next: ExampleEntityRow = {
      ...existing,
      name: patch.name ?? existing.name,
      description:
        patch.description !== undefined ? patch.description ?? null : existing.description,
      data: patch.data !== undefined ? JSON.stringify(patch.data) : existing.data,
      updated_at: ts,
    };

    const renaming = typeof patch.newSlug === 'string' && patch.newSlug.trim().length > 0;
    const targetSlug = renaming ? slugify(patch.newSlug as string) : slug;

    this.db
      .prepare(
        `UPDATE ${EXAMPLE_ENTITY_TABLE}
            SET slug = @targetSlug, name = @name, description = @description,
                data = @data, updated_at = @updated_at
          WHERE slug = @slug`,
      )
      .run({
        targetSlug,
        name: next.name,
        description: next.description,
        data: next.data,
        updated_at: next.updated_at,
        slug,
      });

    if (renaming && targetSlug !== slug) {
      // Repoint page references + soft FKs to the new slug (host-owned). Guarded:
      // the scaffold tolerates a host without this service method.
      this.ctx.referencesService?.repoint?.(EXAMPLE_ENTITY_TYPE, slug, targetSlug);
      this.broadcast(slug);
    }
    this.broadcast(targetSlug);

    // Captures under `targetSlug` (post-rename), matching the host's own entity services.
    try {
      this.ctx.versionService?.captureEntitySnapshot?.(
        EXAMPLE_ENTITY_TYPE,
        targetSlug,
        'update',
        actor,
        'Updated',
        SERIALIZER_VERSION,
      );
    } catch (err) {
      console.error(
        `[example-entity] captureEntitySnapshot failed for ${targetSlug} (op=update):`,
        err,
      );
      throw err;
    }

    return { snapshot: this.getBySlug(targetSlug)!, previousSlug: slug };
  }

  /**
   * Hard delete (index row + the host removes the `.json`). NO cascade: references
   * to the gone entity become DANGLING and are reported, not deleted.
   */
  remove(slug: string, actor: Actor = 'user'): { deleted: boolean; danglingRefs: unknown[] } {
    const danglingRefs: unknown[] =
      this.ctx.referencesService?.findReferrers?.(EXAMPLE_ENTITY_TYPE, slug) ?? [];
    // Capture BEFORE the row is gone — `captureEntitySnapshot` reads the entity's
    // current data, which only exists up to this point.
    try {
      this.ctx.versionService?.captureEntitySnapshot?.(
        EXAMPLE_ENTITY_TYPE,
        slug,
        'delete',
        actor,
        'Deleted',
        SERIALIZER_VERSION,
      );
    } catch (err) {
      console.error(`[example-entity] captureEntitySnapshot failed for ${slug} (op=delete):`, err);
      throw err;
    }
    const info = this.db
      .prepare(`DELETE FROM ${EXAMPLE_ENTITY_TABLE} WHERE slug = ?`)
      .run(slug) as { changes: number };
    const deleted = info.changes > 0;
    if (deleted) this.broadcast(slug);
    return { deleted, danglingRefs };
  }

  /**
   * Lightweight list (no heavy `data`), newest first, optionally filtered by
   * tags. Filtering happens in-memory against each row's own tag slugs
   * (`rowToListItem` already resolves them via `tagsService.getEntityTagSlugs`,
   * a real, synchronous host method) — kept synchronous so the same method
   * backs both the HTTP router and `ExampleEntityCrudAdapter.list()`, which
   * the host's generic `entity-tools` MCP server calls without `await`.
   */
  list(query: ExampleEntityListQuery = {}): ExampleEntityListItem[] {
    const tags = query.tags ?? [];
    const filter: 'and' | 'or' = query.filter ?? 'or';

    const rows = this.db
      .prepare(
        `SELECT slug, name, description, updated_at
           FROM ${EXAMPLE_ENTITY_TABLE}
          ORDER BY updated_at DESC`,
      )
      .all() as Array<Pick<ExampleEntityRow, 'slug' | 'name' | 'description' | 'updated_at'>>;

    const items = rows.map((r) => this.rowToListItem(r));
    if (!tags.length) return items;
    return items.filter((item) => {
      const itemTags = new Set(item.tags ?? []);
      return filter === 'and' ? tags.every((t) => itemTags.has(t)) : tags.some((t) => itemTags.has(t));
    });
  }

  /**
   * Idempotent UPSERT from a full snapshot. Repeating with the same snapshot leaves
   * the stored state unchanged. Used at boot, file-watch and release restoration.
   */
  restore(snapshot: ExampleEntitySnapshot): { op: 'created' | 'updated' | 'noop' } {
    const before = this.db
      .prepare(`SELECT * FROM ${EXAMPLE_ENTITY_TABLE} WHERE slug = ?`)
      .get(snapshot.slug) as ExampleEntityRow | undefined;

    const incoming = {
      slug: snapshot.slug,
      name: snapshot.name,
      description: snapshot.description ?? null,
      data: snapshot.data != null ? JSON.stringify(snapshot.data) : null,
      created_at: snapshot.createdAt,
      updated_at: snapshot.updatedAt,
    };

    if (
      before &&
      before.name === incoming.name &&
      before.description === incoming.description &&
      before.data === incoming.data &&
      before.created_at === incoming.created_at &&
      before.updated_at === incoming.updated_at
    ) {
      return { op: 'noop' };
    }

    this.db
      .prepare(
        `INSERT INTO ${EXAMPLE_ENTITY_TABLE}
           (slug, name, description, data, created_at, updated_at)
         VALUES (@slug, @name, @description, @data, @created_at, @updated_at)
         ON CONFLICT(slug) DO UPDATE SET
           name = excluded.name,
           description = excluded.description,
           data = excluded.data,
           created_at = excluded.created_at,
           updated_at = excluded.updated_at`,
      )
      .run(incoming);
    this.broadcast(snapshot.slug);
    return { op: before ? 'updated' : 'created' };
  }

  private broadcast(slug: string): void {
    this.ctx.ws?.broadcast?.({ kind: 'entity:changed', entityType: EXAMPLE_ENTITY_TYPE, slug });
  }
}
