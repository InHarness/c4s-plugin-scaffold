/**
 * L4 router AC — the six `/example-entities` routes, exercised over real HTTP
 * (a real express app on an ephemeral port + `fetch`), backed by a real in-memory
 * SQLite service. Each test targets one endpoint's observable contract.
 */
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import { ExampleEntityService } from '../../src/entity/backend/services';
import { createExampleEntityRouter } from '../../src/entity/backend/routes';
import { createTestMountContext, type TestMountContext } from '../helpers/mount-context';

interface Booted {
  base: string;
  service: ExampleEntityService;
  harness: TestMountContext;
  server: Server;
}

const booted: Booted[] = [];

async function boot(): Promise<Booted> {
  const harness = createTestMountContext({ migrate: true });
  const service = new ExampleEntityService(harness.ctx.db, harness.ctx);
  const app = express();
  app.use(express.json());
  // The host mounts the router under `/api/projects/:id/example-entities`; the
  // plugin declares paths RELATIVE to its pathPrefix, so any prefix works here.
  app.use('/example-entities', createExampleEntityRouter(service, harness.ctx));
  const server = await new Promise<Server>((res) => {
    const s = app.listen(0, () => res(s));
  });
  const { port } = server.address() as AddressInfo;
  const b: Booted = { base: `http://127.0.0.1:${port}/example-entities`, service, harness, server };
  booted.push(b);
  return b;
}

afterEach(async () => {
  for (const b of booted.splice(0)) {
    await new Promise<void>((res) => b.server.close(() => res()));
    b.harness.close();
  }
});

const json = (body: unknown) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

describe('example-entity routes', () => {
  it('ac-slug-from-name: POST derives slug = slugify(name); a slug in the body is ignored', async () => {
    const { base } = await boot();
    const res = await fetch(base, json({ name: 'Example Entity', slug: 'hacked-slug' }));
    expect(res.status).toBe(201);
    const snapshot = (await res.json()) as { slug: string; name: string };
    expect(snapshot.slug).toBe('example-entity'); // slugify('Example Entity'), NOT 'hacked-slug'
    expect(snapshot.name).toBe('Example Entity');
  });

  it('ac-list-returns-listitem: GET / returns lightweight ExampleEntityListItem rows without the heavy `data` field', async () => {
    const { base } = await boot();
    await fetch(base, json({ name: 'Alpha', data: { big: 'payload' } }));
    const res = await fetch(base);
    expect(res.status).toBe(200);
    const items = (await res.json()) as Array<Record<string, unknown>>;
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveProperty('slug');
    expect(items[0]).toHaveProperty('name');
    expect(items[0]).toHaveProperty('updatedAt');
    expect(items[0]).not.toHaveProperty('data'); // projection, not the full snapshot
  });

  it('ac-get-slug-404: GET /:slug returns 404 for an unknown slug', async () => {
    const { base } = await boot();
    const res = await fetch(`${base}/does-not-exist`);
    expect(res.status).toBe(404);
  });

  it('ac-rename-via-newslug: a name edit keeps the slug; the slug moves only through an explicit newSlug', async () => {
    const { base } = await boot();
    await fetch(base, json({ name: 'Alpha' })); // slug: 'alpha'

    // Name change alone does NOT move the slug.
    const renameName = await fetch(`${base}/alpha`, { ...json({ name: 'Alpha Two' }), method: 'PATCH' });
    expect(renameName.status).toBe(200);
    expect(((await renameName.json()) as { slug: string }).slug).toBe('alpha');

    // Explicit newSlug moves it (slugified); the old slug is gone.
    const moved = await fetch(`${base}/alpha`, { ...json({ newSlug: 'Gamma Delta' }), method: 'PATCH' });
    expect(((await moved.json()) as { slug: string }).slug).toBe('gamma-delta');
    expect((await fetch(`${base}/alpha`)).status).toBe(404);
    expect((await fetch(`${base}/gamma-delta`)).status).toBe(200);
  });

  it('ac-delete-no-cascade: DELETE hard-deletes the entity (204) but does not cascade — soft-FK referrers survive', async () => {
    const { base, harness } = await boot();
    // A host-owned soft FK pointing at the entity we are about to delete.
    harness.setReferrers([{ pagePath: 'pages/x.md', line: 3 }]);
    await fetch(base, json({ name: 'Target' })); // slug: 'target'

    const del = await fetch(`${base}/target`, { method: 'DELETE' });
    expect(del.status).toBe(204);
    expect((await fetch(`${base}/target`)).status).toBe(404); // entity gone

    // The referrers were reported as dangling, NOT cascaded away (host-owned).
    expect(harness.ctx.referencesService.findReferrers('example-entity', 'target')).toHaveLength(1);
  });

  it('ac-restore-idempotent-upsert: POST /:slug/restore is an idempotent UPSERT — replaying the same snapshot does not duplicate rows', async () => {
    const { base } = await boot();
    const snapshot = {
      name: 'Restored',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const first = await fetch(`${base}/restored/restore`, json(snapshot));
    expect(first.status).toBe(200);
    const afterFirst = (await (await fetch(base)).json()) as unknown[];
    expect(afterFirst).toHaveLength(1);

    // Replay the identical snapshot — still one row, same stored state.
    const second = await fetch(`${base}/restored/restore`, json(snapshot));
    expect(second.status).toBe(200);
    const afterSecond = (await (await fetch(base)).json()) as unknown[];
    expect(afterSecond).toHaveLength(1);
    expect(afterSecond).toEqual(afterFirst);
  });
});
