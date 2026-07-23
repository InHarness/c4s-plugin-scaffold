/**
 * Backend test harness: a real in-memory SQLite handle plus a faithful stand-in for
 * the host's `MountContext`, shaped to exactly the host services the scaffold's code
 * actually calls (all optional-chained in `src`, so the smallest honest shape works):
 *
 *  - `db`               — a real `better-sqlite3` `:memory:` database, so migrations
 *                         and queries run for real rather than mocked.
 *  - `ws.broadcast`     — recorder.
 *  - `tagsService.getEntityTagSlugs` — host-owned tag READ (`src/entity/backend/services.ts`).
 *  - `versionService.captureEntitySnapshot` — the per-mutation snapshot capture; a
 *                         recorder that a test can also force to throw, to prove a
 *                         snapshot failure is signalled, never swallowed.
 *  - `referencesService.{findReferrers,repoint}` — dangling-ref reporting + rename repoint.
 *  - `writer.upsert`    — the release-restore writer the serializer delegates to
 *                         (`RestoreContext.writer`).
 *
 * Typed loosely on purpose: the published `MountContext` almost-everything-`any`,
 * and these tests run through vitest's esbuild transform (no type-check), so a
 * structural stand-in is all the code under test needs.
 */
import Database from 'better-sqlite3';
import { exampleEntityMigrations } from '../../src/entity/backend/migrations';

export interface CapturedVersion {
  type: string;
  slug: string;
  op: string;
  actor: string;
  summary: string;
  version: string;
}

export interface TestMountContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any;
  db: Database.Database;
  broadcasts: unknown[];
  captures: CapturedVersion[];
  repoints: Array<{ type: string; from: string; to: string }>;
  upserts: Array<{ type: string; snapshot: unknown }>;
  /** Seed the tag slugs the host would return for an entity. */
  setTags(type: string, slug: string, tags: string[]): void;
  /** Seed the referrers `findReferrers` reports (drives the dangling-refs path). */
  setReferrers(list: unknown[]): void;
  /** Force `captureEntitySnapshot` to throw, to exercise the write-path failure signal. */
  failCaptureWith(error: Error): void;
  close(): void;
}

/** Run the plugin's forward-only migrations against a db (the host does this at boot). */
export function applyExampleEntityMigrations(db: Database.Database): void {
  for (const migration of exampleEntityMigrations) {
    db.exec(migration.up);
  }
}

/** Build an isolated MountContext backed by a fresh in-memory database. */
export function createTestMountContext(options: { migrate?: boolean } = {}): TestMountContext {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  if (options.migrate) applyExampleEntityMigrations(db);

  const broadcasts: unknown[] = [];
  const captures: CapturedVersion[] = [];
  const repoints: Array<{ type: string; from: string; to: string }> = [];
  const upserts: Array<{ type: string; snapshot: unknown }> = [];
  const tagsByKey = new Map<string, string[]>();
  const key = (type: string, slug: string) => `${type}::${slug}`;
  let referrers: unknown[] = [];
  let captureError: Error | null = null;

  const ctx = {
    db,
    host: {},
    cwd: process.cwd(),
    ws: {
      broadcast(msg: unknown) {
        broadcasts.push(msg);
      },
    },
    tagsService: {
      getEntityTagSlugs: (type: string, slug: string) => tagsByKey.get(key(type, slug)) ?? [],
    },
    versionService: {
      captureEntitySnapshot: (
        type: string,
        slug: string,
        op: string,
        actor: string,
        summary: string,
        version: string,
      ) => {
        if (captureError) throw captureError;
        captures.push({ type, slug, op, actor, summary, version });
      },
    },
    referencesService: {
      findReferrers: (_type: string, _slug: string) => referrers,
      repoint: (type: string, from: string, to: string) => {
        repoints.push({ type, from, to });
        return 1;
      },
    },
    // RestoreContext.writer — where the serializer's restore() delegates persistence.
    writer: {
      upsert: (type: string, snapshot: unknown) => {
        upserts.push({ type, snapshot });
      },
    },
  };

  return {
    ctx,
    db,
    broadcasts,
    captures,
    repoints,
    upserts,
    setTags(type, slug, tags) {
      tagsByKey.set(key(type, slug), tags);
    },
    setReferrers(list) {
      referrers = list;
    },
    failCaptureWith(error) {
      captureError = error;
    },
    close() {
      db.close();
    },
  };
}
