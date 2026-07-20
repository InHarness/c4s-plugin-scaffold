/**
 * Composes the `example-entity` type as an `EntityContribution` (host 1.0.0).
 *
 * The contribution carries the entity identity (`EntityModuleManifest`) plus the
 * four slots: `serializer` (L9, required), `systemPrompt` (required), and the
 * optional `backend` — declared via the M13 declarative surface
 * (`service`/`crud`/`routes`), not the `mount` escape hatch: `service` is
 * instantiated once per `ProjectContext`, and that SAME instance backs DI
 * (`ctx.registerEntityService`), the host's generic `entity-tools` MCP server
 * (via `crud`), and the `routes` factory below — the host synthesizes the
 * mount itself, including binding `routes.router` under `pathPrefix`. No
 * `backend.mcpServer`: CRUD is all this type has, and CRUD tools belong to
 * `entity-tools`, never a per-type server. See `./backend/mcp.ts` for a
 * commented example of the custom-`mcpServer` slot, for when a type needs a
 * non-CRUD tool.
 * The frontend is a separate entry (`src/frontend.tsx`) registered as a side
 * effect, so it is NOT referenced here (backend and frontend must not pull in each
 * other's deps).
 */

import type { EntityContribution, MountContext } from '@c4s/plugin-runtime';
import {
  EXAMPLE_ENTITY_TYPE,
  EXAMPLE_ENTITY_TABLE,
  EXAMPLE_ENTITY_LABEL,
  EXAMPLE_ENTITY_LABEL_PLURAL,
  EXAMPLE_ENTITY_DISPLAY_ORDER,
  EXAMPLE_ENTITY_PATH_PREFIX,
  exampleEntitySlugFrom,
} from '../identity';
import { exampleEntitySerializer } from './serializer';
import { exampleEntitySystemPrompt } from './system-prompt';
import { exampleEntityMigrations } from './backend/migrations';
import { ExampleEntityService } from './backend/services';
import { ExampleEntityCrudAdapter } from './backend/crud-adapter';
import { exampleEntityCreateSchema, exampleEntityUpdateSchema } from './backend/crud-schemas';
import { createExampleEntityRouter } from './backend/routes';

export const exampleEntityEntity: EntityContribution = {
  // ── Identity (EntityModuleManifest) ──
  type: EXAMPLE_ENTITY_TYPE,
  table: EXAMPLE_ENTITY_TABLE,
  label: EXAMPLE_ENTITY_LABEL,
  labelPlural: EXAMPLE_ENTITY_LABEL_PLURAL,
  displayOrder: EXAMPLE_ENTITY_DISPLAY_ORDER,
  pathPrefix: EXAMPLE_ENTITY_PATH_PREFIX,
  slugFrom: exampleEntitySlugFrom,

  // ── Slots ──
  serializer: exampleEntitySerializer, // L9 (required)
  systemPrompt: exampleEntitySystemPrompt, // required

  backend: {
    // L1 — forward-only idempotent migrations build the derived SQLite index.
    migrations: exampleEntityMigrations,

    // L2 — instantiated once per ProjectContext; wraps the rich ExampleEntityService.
    service: (ctx: MountContext) =>
      new ExampleEntityCrudAdapter(new ExampleEntityService(ctx.db, ctx)),

    // Declarative contribution to the host's generic entity-tools CRUD server.
    crud: {
      createSchema: exampleEntityCreateSchema,
      updateSchema: exampleEntityUpdateSchema,
      descriptions: {
        entity: 'A generic example entity — rename to your own domain type when adapting the scaffold.',
      },
    },

    // L4 — same service instance as `crud`; unwrap `.rich` for the concrete type.
    routes: {
      router: (crud: ExampleEntityCrudAdapter, ctx: MountContext) =>
        createExampleEntityRouter(crud.rich, ctx),
    },

    // Custom, non-CRUD MCP server — commented out (see `./backend/mcp.ts`); this
    // placeholder needs no tool beyond CRUD.
    // mcpServer: exampleEntityToolsCustom,
  },
};
