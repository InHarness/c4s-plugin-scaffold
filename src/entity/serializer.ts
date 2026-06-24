/**
 * L9 — `EntitySerializer`. `snapshot()` defines the on-disk entity file format
 * (`.claude4spec/entities/__entity_type__/<slug>.json`, committed — the source of
 * truth). It must be DETERMINISTIC: no DB ids, no timestamps, arrays sorted stably.
 * The views (inlineMention/singleElement/…) feed the XML serialization (chips/cards).
 */

import type {
  EntitySerializer,
  EntityDiff,
  RestoreContext,
  RestoreResult,
  SnapshotData,
} from '../host';
import { __ENTITY_TYPE__ } from '../identity';

/** Placeholder snapshot. TODO: replace with your entity's fields (sort arrays!). */
interface __EntityName__Snapshot {
  slug: string;
  title: string;
}

// The host passes a RawEntity: { slug, data: {...}, tags: [...] }.
function toSnapshot(entity: any): __EntityName__Snapshot {
  return {
    slug: String(entity?.slug ?? ''),
    title: String(entity?.data?.title ?? entity?.title ?? ''),
  };
}

export const __entity_type__Serializer: EntitySerializer = {
  type: __ENTITY_TYPE__,
  version: '1.0.0',

  // ─── L9 views (XML) ───
  inlineMention: (entity: any) => ({
    type: __ENTITY_TYPE__,
    slug: entity?.slug,
    label: entity?.data?.title ?? entity?.slug,
    href: `/__entity_type__/${entity?.slug}`,
  }),
  singleElement: (entity: any) => toSnapshot(entity),
  elementListItem: (entity: any) => toSnapshot(entity),
  taggedListItem: (entity: any) => toSnapshot(entity),
  detail: (entity: any) => toSnapshot(entity),

  // ─── M17 snapshot/restore/diff ───
  snapshot: (entity: any) => toSnapshot(entity),

  restore: (data: SnapshotData, _ctx: RestoreContext): RestoreResult => {
    const snap = data as __EntityName__Snapshot;
    // TODO: idempotent UPSERT through the normal write-API:
    //   const r = _ctx.writer.upsert__EntityName__(snap.slug, { title: snap.title }, _ctx.actor);
    //   return { op: r.op, entity: r.entity };
    return { op: 'noop', entity: snap };
  },

  diff: (a: SnapshotData, b: SnapshotData, slug: string): EntityDiff => {
    if (a == null && b == null) return { type: __ENTITY_TYPE__, slug, op: 'noop' };
    if (a == null) return { type: __ENTITY_TYPE__, slug, op: 'created' };
    if (b == null) return { type: __ENTITY_TYPE__, slug, op: 'deleted' };
    const sa = a as __EntityName__Snapshot;
    const sb = b as __EntityName__Snapshot;
    const changes: Record<string, unknown> = {};
    if (sa.title !== sb.title) changes.title = { from: sa.title, to: sb.title };
    return Object.keys(changes).length
      ? { type: __ENTITY_TYPE__, slug, op: 'modified', changes }
      : { type: __ENTITY_TYPE__, slug, op: 'noop' };
  },
};
