/**
 * Host-owned version history + tags AC. The plugin's job is to FEED the host's
 * generic machinery (capture a deterministic snapshot per mutation, keyed by type),
 * expose a snapshot() so the type qualifies for history, and read tags through the
 * host — never to build its own history view/store or a tags column.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { ExampleEntityService } from '../../src/entity/backend/services';
import { exampleEntitySerializer } from '../../src/entity/serializer';
import { exampleEntityEntity } from '../../src/entity';
import { EXAMPLE_ENTITY_TABLE, EXAMPLE_ENTITY_TYPE } from '../../src/identity';
import { applyExampleEntityMigrations, createTestMountContext } from '../helpers/mount-context';

const readSrc = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8');

describe('version history + tags (host-owned)', () => {
  it('ac-snapshot-persisted-per-mutation: every mutation (create/update/delete) captures a snapshot to history on the write path', () => {
    const h = createTestMountContext({ migrate: true });
    try {
      const service = new ExampleEntityService(h.ctx.db, h.ctx);
      service.create({ name: 'Alpha' });
      service.update('alpha', { name: 'Alpha Two' });
      service.remove('alpha');
      expect(h.captures.map((c) => c.op)).toEqual(['create', 'update', 'delete']);
    } finally {
      h.close();
    }
  });

  it('ac-zmiany-encji-wnoszonej-przez-plugin-sa-p: each capture is keyed by the entity TYPE, so the host resolves the table generically for any active type', () => {
    const h = createTestMountContext({ migrate: true });
    try {
      const service = new ExampleEntityService(h.ctx.db, h.ctx);
      service.create({ name: 'Alpha' });
      service.update('alpha', { description: 'x' });
      expect(h.captures.length).toBeGreaterThan(0);
      expect(h.captures.every((c) => c.type === EXAMPLE_ENTITY_TYPE)).toBe(true);
    } finally {
      h.close();
    }
  });

  it('ac-snapshot-required-for-history: the type declares snapshot(), which is the runtime prerequisite for having version history at all', () => {
    expect(typeof exampleEntitySerializer.snapshot).toBe('function');
    expect(typeof exampleEntityEntity.serializer.snapshot).toBe('function');
  });

  it('ac-version-history-uniform: the serializer is keyed by type so the generic /versions endpoint resolves it uniformly — the plugin registers no type-specific versions route', () => {
    expect(exampleEntitySerializer.type).toBe(EXAMPLE_ENTITY_TYPE);
    // The host owns GET /api/entities/:type/:slug/versions — the plugin router does not.
    expect(readSrc('src/entity/backend/routes.ts')).not.toMatch(/versions/);
  });

  it('ac-historia-wersji-encji-jest-hostowa-ctx: the detail panel consumes the host version tab (useVersions/useRestoreVersion + VersionHistory) rather than a plugin-owned history view or restore', () => {
    const panel = readSrc('src/entity/frontend/detail-panel.tsx');
    expect(panel).toMatch(/useVersions/);
    expect(panel).toMatch(/useRestoreVersion/);
    expect(panel).toMatch(/VersionHistory/);
  });

  it('ac-tagi-encji-sa-wlasnoscia-hosta-odczyt-p: tags are read through ctx.tagsService.getEntityTagSlugs, and the index table carries no tags column of its own', () => {
    const h = createTestMountContext({ migrate: true });
    try {
      const service = new ExampleEntityService(h.ctx.db, h.ctx);
      service.create({ name: 'Alpha' });
      // Host-owned tags: seed them on the host service, and the list projection reflects them.
      h.setTags(EXAMPLE_ENTITY_TYPE, 'alpha', ['billing', 'draft']);
      expect(service.list()[0].tags).toEqual(['billing', 'draft']);
    } finally {
      h.close();
    }

    // The plugin keeps NO tags column — tags live entirely host-side.
    const db = new Database(':memory:');
    try {
      applyExampleEntityMigrations(db);
      const cols = (db.prepare(`PRAGMA table_info(${EXAMPLE_ENTITY_TABLE})`).all() as Array<{ name: string }>).map(
        (c) => c.name,
      );
      expect(cols).not.toContain('tags');
    } finally {
      db.close();
    }
  });
});
