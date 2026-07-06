/**
 * L9 — serializer for `example-entity`. Two responsibilities:
 *
 *  1. DATA VIEWS for embedding the entity in content / the agent: `inlineMention`,
 *     `singleElement`, `elementListItem`, `taggedListItem`, `detail`.
 *  2. RELEASE ops: `snapshot()` (deterministic — stable field order, so the same
 *     state always yields an identical `ExampleEntitySnapshot`: `ac-snapshot-deterministic`),
 *     `restore()` (idempotent UPSERT), `diff()` (compare two snapshots).
 *
 * `T` is the snapshot shape — it is simultaneously the `.json` source-of-truth file,
 * the GET/POST response body, and the restore request body.
 */

import type {
  EntityDiff,
  EntitySerializer,
  RestoreContext,
  RestoreResult,
  SerializeContext,
  SnapshotData,
} from '@c4s/plugin-runtime';
import { EXAMPLE_ENTITY_TYPE } from '../identity';
import type { ExampleEntitySnapshot } from './dto';

/**
 * Emit the snapshot with a DETERMINISTIC field order. Optional fields are included
 * only when present, always in the same position — so two equal states serialize to
 * byte-identical JSON.
 */
function toSnapshot(entity: ExampleEntitySnapshot): ExampleEntitySnapshot {
  const out: ExampleEntitySnapshot = {
    slug: entity.slug,
    name: entity.name,
    // description / data slot in here, between name and the timestamps.
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  if (entity.description !== undefined) {
    // Re-key so `description` precedes the timestamps deterministically.
    return {
      slug: entity.slug,
      name: entity.name,
      description: entity.description,
      ...(entity.data !== undefined ? { data: entity.data } : {}),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
  if (entity.data !== undefined) {
    return {
      slug: entity.slug,
      name: entity.name,
      data: entity.data,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
  return out;
}

export const exampleEntitySerializer: EntitySerializer<ExampleEntitySnapshot> = {
  type: EXAMPLE_ENTITY_TYPE,
  version: '1.0.0',

  // ── Data views (pure projections of the entity) ──
  inlineMention: (e: ExampleEntitySnapshot, _ctx: SerializeContext) => ({
    kind: 'inline_mention',
    type: EXAMPLE_ENTITY_TYPE,
    slug: e.slug,
    label: e.name,
    href: `/example-entities/${e.slug}`,
  }),

  singleElement: (e: ExampleEntitySnapshot, _ctx: SerializeContext) => ({
    kind: 'single_element',
    type: EXAMPLE_ENTITY_TYPE,
    slug: e.slug,
    title: e.name,
    subtitle: e.description,
  }),

  // `tags` is intentionally empty here: tags are host-owned (no column on the
  // entity itself), and this serializer has no synchronous access to
  // `ctx.tagsService` to resolve them. A derived plugin with a tag-aware data
  // source would populate it for real.
  elementListItem: (e: ExampleEntitySnapshot, _ctx: SerializeContext) => ({
    kind: 'element_list_item',
    type: EXAMPLE_ENTITY_TYPE,
    slug: e.slug,
    title: e.name,
    tags: [],
  }),

  taggedListItem: (e: ExampleEntitySnapshot, _ctx: SerializeContext) => ({
    kind: 'tagged_list_item',
    type: EXAMPLE_ENTITY_TYPE,
    slug: e.slug,
    title: e.name,
    tags: [],
  }),

  detail: (e: ExampleEntitySnapshot, _ctx: SerializeContext) => ({
    kind: 'detail',
    type: EXAMPLE_ENTITY_TYPE,
    slug: e.slug,
    title: e.name,
    fields: [
      { label: 'Slug', value: e.slug },
      { label: 'Name', value: e.name },
      { label: 'Description', value: e.description ?? '' },
      { label: 'Updated', value: e.updatedAt },
    ],
  }),

  // ── Release ops ──
  snapshot: (e: ExampleEntitySnapshot, _ctx: SerializeContext): SnapshotData => toSnapshot(e),

  /**
   * Idempotent UPSERT from a snapshot. Persistence is delegated to the host's
   * release writer (guarded for hosts that don't provide one). Replaying the same
   * snapshot is a no-op at the storage layer.
   */
  restore: (data: SnapshotData, ctx: RestoreContext): RestoreResult => {
    const snapshot = data as ExampleEntitySnapshot;
    const writer = ctx.writer as { upsert?: (type: string, snap: unknown) => unknown } | undefined;
    writer?.upsert?.(EXAMPLE_ENTITY_TYPE, snapshot);
    return { op: 'updated', entity: snapshot };
  },

  /** Field-level diff between two snapshots (stable key set). */
  diff: (a: SnapshotData, b: SnapshotData, slug: string): EntityDiff => {
    const prev = (a ?? {}) as Partial<ExampleEntitySnapshot>;
    const next = (b ?? {}) as Partial<ExampleEntitySnapshot>;
    const keys: Array<keyof ExampleEntitySnapshot> = [
      'name',
      'description',
      'data',
      'createdAt',
      'updatedAt',
    ];
    const changes: Record<string, unknown> = {};
    for (const k of keys) {
      if (JSON.stringify(prev[k]) !== JSON.stringify(next[k])) {
        changes[k] = { from: prev[k], to: next[k] };
      }
    }
    const op: EntityDiff['op'] = a == null ? 'created' : b == null ? 'deleted' : Object.keys(changes).length ? 'modified' : 'noop';
    return { type: EXAMPLE_ENTITY_TYPE, slug, op, changes };
  },
};
