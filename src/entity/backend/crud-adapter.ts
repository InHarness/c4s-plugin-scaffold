/**
 * M13 — thin adapter satisfying the host's generic `EntityCrudService`
 * contract so CRUD tools for `example-entity` are served by the host's own
 * `entity-tools` MCP server (never a per-plugin one — `backend.mcpServer` is
 * reserved for non-standard tools this type doesn't have; plain CRUD isn't
 * one, so this scaffold declares no `mcpServer` at all).
 *
 * Delegates every call to `rich` (`ExampleEntityService`), which keeps its
 * full existing method surface (`getBySlug`/`update`/`remove`/`restore`/...)
 * for the HTTP router. Folding those methods directly into `EntityCrudService`
 * shape wasn't possible without breaking them — e.g. `update` returns
 * `{ snapshot, previousSlug } | null`, not the `{ slug, warnings? }` shape
 * entity-tools expects — so this adapter reshapes names/return values instead
 * of the rich service itself needing to change.
 *
 * Registered as the SINGLE `backend.service` instance (`entity/index.ts`):
 * the host passes this exact object to `ctx.registerEntityService`,
 * entity-tools' CRUD registry, and the `routes` factory, which unwraps
 * `.rich` to get back the concrete `ExampleEntityService`.
 */

import type { EntityCrudService } from '@c4s/plugin-runtime';
import type { CreateExampleEntityRequest, UpdateExampleEntityRequest } from '../dto';
import type { ExampleEntityService } from './services';

export class ExampleEntityCrudAdapter implements EntityCrudService {
  constructor(readonly rich: ExampleEntityService) {}

  create(data: unknown) {
    return this.rich.create(data as CreateExampleEntityRequest, 'agent');
  }

  get(slug: string) {
    return this.rich.getBySlug(slug);
  }

  update(slug: string, data: unknown) {
    const result = this.rich.update(slug, data as UpdateExampleEntityRequest, 'agent');
    if (!result) throw new Error(`example-entity not found: ${slug}`);
    return result.snapshot;
  }

  delete(slug: string): void {
    const result = this.rich.remove(slug, 'agent');
    if (!result.deleted) throw new Error(`example-entity not found: ${slug}`);
  }

  list(opts: { tags?: string[]; tagFilter?: 'and' | 'or'; limit: number; offset: number }) {
    const items = this.rich.list({ tags: opts.tags, filter: opts.tagFilter });
    return { items: items.slice(opts.offset, opts.offset + opts.limit), total: items.length };
  }
}
