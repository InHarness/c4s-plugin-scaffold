/**
 * L4 — the entity's Express router, written BY HAND (the host-side `createCrudRouter`
 * helper is deferred). Mounted in `mount(ctx)` via `ctx.app.use(pathPrefix, …)`; the
 * host prepends `/api/projects/:id`. CRUD + `POST /:slug/restore`.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import type { MountContext } from '../../host';
import { __ENTITY_TYPE__ } from '../../identity';
import type { __EntityName__Record, __EntityName__Service } from './services';

export function create__EntityName__Router(
  service: __EntityName__Service,
  ctx: MountContext,
): Router {
  const router = Router();
  const broadcast = (slug: string) =>
    ctx.ws.broadcast({ kind: 'entity:changed', entityType: __ENTITY_TYPE__, slug });

  // LIST
  router.get('/', (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query;
      const tags = typeof q.tags === 'string' ? q.tags.split(',').filter(Boolean) : undefined;
      const tagFilter = q.tagFilter === 'and' || q.tagFilter === 'or' ? q.tagFilter : undefined;
      res.json({
        items: service.list({
          tags,
          tagFilter,
          search: typeof q.search === 'string' ? q.search : undefined,
          limit: q.limit ? Number(q.limit) : undefined,
          offset: q.offset ? Number(q.offset) : undefined,
        }),
      });
    } catch (err) {
      next(err);
    }
  });

  // CREATE
  router.post('/', (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = service.create((req.body ?? {}) as Partial<__EntityName__Record>, 'user');
      broadcast(record.slug);
      res.status(201).json(record);
    } catch (err) {
      next(err);
    }
  });

  // READ
  router.get('/:slug', (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = service.getBySlug(req.params.slug);
      if (!record) {
        return res
          .status(404)
          .json({ error: { code: 'NOT_FOUND', message: '__entity_type__ not found' } });
      }
      res.json(record);
    } catch (err) {
      next(err);
    }
  });

  // UPDATE (rename only via body.newSlug)
  router.patch('/:slug', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { record, previousSlug } = service.update(
        req.params.slug,
        (req.body ?? {}) as Partial<__EntityName__Record> & { newSlug?: string },
        'user',
      );
      if (record.slug !== previousSlug) {
        // TODO: ctx.referencesService.propagateSlugChange(__ENTITY_TYPE__, previousSlug, record.slug)
        broadcast(previousSlug);
      }
      broadcast(record.slug);
      res.json(record);
    } catch (err) {
      next(err);
    }
  });

  // DELETE
  router.delete('/:slug', (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = service.remove(req.params.slug, 'user');
      broadcast(req.params.slug);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // RESTORE (from an L9 snapshot / release)
  router.post('/:slug/restore', (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: deserialize the snapshot and UPSERT through the service (idempotently).
      broadcast(req.params.slug);
      res.json({ restored: true, slug: req.params.slug });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
