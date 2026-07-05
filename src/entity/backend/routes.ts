/**
 * L4 — Express router for `example-entity`, mounted under `pathPrefix`
 * (`/example-entities`; the host prepends `/api/projects/:id`). Six routes:
 *
 *   GET    /            → list  (ExampleEntityListItem[], no `data`)  200
 *   POST   /            → create (slug = slugify(name))               201
 *   GET    /:slug       → detail (full snapshot)                      200 / 404
 *   PATCH  /:slug       → update (rename only via newSlug)            200 / 404
 *   DELETE /:slug       → remove (hard delete, no FK cascade)         204
 *   POST   /:slug/restore → idempotent UPSERT from a snapshot         200
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import type { MountContext } from '@c4s/plugin-runtime';
import type {
  CreateExampleEntityRequest,
  ExampleEntitySnapshot,
  UpdateExampleEntityRequest,
} from '../dto';
import { ExampleEntityService } from './services';

function notFound(res: Response): Response {
  return res.status(404).json({ error: { code: 'NOT_FOUND' } });
}

/** Parse a `?tags=a,b,c` CSV query into a trimmed, non-empty string[]. */
function parseTags(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseFilter(raw: unknown): 'and' | 'or' {
  return raw === 'and' ? 'and' : 'or';
}

export function createExampleEntityRouter(
  service: ExampleEntityService,
  _ctx: MountContext,
): Router {
  const router = Router();

  // GET / — lightweight list, optional tag filter.
  router.get('/', async (req: Request, res: Response) => {
    const items = await service.list({
      tags: parseTags(req.query.tags),
      filter: parseFilter(req.query.filter),
    });
    res.status(200).json(items);
  });

  // POST / — create; 201 with the full snapshot.
  router.post('/', (req: Request, res: Response) => {
    const body = (req.body ?? {}) as CreateExampleEntityRequest;
    const snapshot = service.create(body, 'user');
    res.status(201).json(snapshot);
  });

  // GET /:slug — detail; 404 when the slug is unknown.
  router.get('/:slug', (req: Request, res: Response) => {
    const snapshot = service.getBySlug(String(req.params.slug));
    if (!snapshot) return notFound(res);
    res.status(200).json(snapshot);
  });

  // PATCH /:slug — partial update; rename only via newSlug.
  router.patch('/:slug', (req: Request, res: Response) => {
    const body = (req.body ?? {}) as UpdateExampleEntityRequest;
    const result = service.update(String(req.params.slug), body, 'user');
    if (!result) return notFound(res);
    res.status(200).json(result.snapshot);
  });

  // DELETE /:slug — hard delete, 204, no cascade (dangling refs only reported).
  router.delete('/:slug', (req: Request, res: Response) => {
    const { deleted } = service.remove(String(req.params.slug), 'user');
    if (!deleted) return notFound(res);
    res.status(204).send();
  });

  // POST /:slug/restore — idempotent UPSERT from a snapshot.
  router.post('/:slug/restore', (req: Request, res: Response) => {
    const snapshot = { ...(req.body as ExampleEntitySnapshot), slug: String(req.params.slug) };
    service.restore(snapshot);
    res.status(200).json(service.getBySlug(snapshot.slug));
  });

  return router;
}
