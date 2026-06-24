/**
 * L2 — the entity domain service. Built in `backend.mount(ctx)` from `ctx.db` and
 * cross-cutting deps (tags/versions/references/entityStore). Standard CRUD +
 * versioning + entity-file persistence go here (the bodies are STUBS — fill them in).
 *
 * Slug rule: stable. `slugFrom` generates it ONLY on create; on update a name change
 * does NOT move the slug — rename only via an explicit `newSlug` (propagate XML
 * references through `ctx.referencesService`).
 */

import type { MountContext } from '../../host';
import { __ENTITY_TABLE__, __ENTITY_TYPE__, __entity_type__SlugFrom } from '../../identity';

/** Placeholder record shape. TODO: replace with your entity's fields. */
export interface __EntityName__Record {
  slug: string;
  title: string;
}

export interface __EntityName__ListQuery {
  tags?: string[];
  tagFilter?: 'and' | 'or';
  search?: string;
  limit?: number;
  offset?: number;
}

export class __EntityName__Service {
  constructor(
    private readonly db: MountContext['db'],
    private readonly ctx: MountContext,
  ) {}

  /** create — generates the slug via `slugFrom`, writes to db and persists the entity file. */
  create(input: Partial<__EntityName__Record>, _actor: 'user' | 'agent'): __EntityName__Record {
    const slug = input.slug?.trim() ? input.slug : __entity_type__SlugFrom(input);
    const record: __EntityName__Record = { slug, title: input.title ?? '' };
    // TODO: write to SQLite + persist the file (.claude4spec/entities/<type>/<slug>.json):
    //   this.db.prepare(`INSERT INTO ${__ENTITY_TABLE__} (slug, title) VALUES (?, ?)`)
    //     .run(record.slug, record.title);
    //   this.ctx.entityStore.write(__ENTITY_TYPE__, record.slug, record);
    return record;
  }

  /** getBySlug — slug is the entity's only identity. */
  getBySlug(_slug: string): __EntityName__Record | null {
    // TODO: return this.db.prepare(`SELECT * FROM ${__ENTITY_TABLE__} WHERE slug = ?`).get(_slug) ?? null;
    return null;
  }

  /**
   * update — partial. A `title` change does NOT move the slug. Rename only via
   * `newSlug`; we return `previousSlug` so mount/route can propagate references.
   */
  update(
    slug: string,
    patch: Partial<__EntityName__Record> & { newSlug?: string },
    _actor: 'user' | 'agent',
  ): { record: __EntityName__Record; previousSlug: string } {
    const previousSlug = slug;
    const nextSlug = patch.newSlug?.trim() ? patch.newSlug : slug;
    // TODO: UPDATE in db (+ optional slug rename), persist the file.
    return { record: { slug: nextSlug, title: patch.title ?? '' }, previousSlug };
  }

  /** remove — deletes the entity; return info about dangling references for the user/agent to decide. */
  remove(_slug: string, _actor: 'user' | 'agent'): { deleted: true } {
    // TODO: DELETE from db + remove the entity file.
    return { deleted: true };
  }

  /** list — filter by tags (and/or) and a full-text search. */
  list(_query: __EntityName__ListQuery): __EntityName__Record[] {
    // TODO: SELECT with filters.
    return [];
  }
}
