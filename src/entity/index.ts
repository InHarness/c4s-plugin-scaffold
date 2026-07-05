/**
 * Composes the `example-entity` type as an `EntityContribution` (host 1.0.0).
 *
 * The contribution carries the entity identity (`EntityModuleManifest`) plus the
 * four slots: `serializer` (L9, required), `systemPrompt` (required), and the
 * optional `backend` (L1 migrations + a single imperative `mount(ctx)` for L3/L4).
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
import { createExampleEntityRouter } from './backend/routes';
import { createExampleEntityToolsServer } from './backend/mcp-server';

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

    /**
     * Single imperative mount: bind the L4 router under `pathPrefix`, register the
     * L3 MCP tools server as a FACTORY (not a ready instance — no shared global
     * state; the host instantiates per context: `ac-mcp-factory`), and expose the
     * entity service to the host.
     */
    mount(ctx: MountContext): void {
      const service = new ExampleEntityService(ctx.db, ctx);

      ctx.app.use(EXAMPLE_ENTITY_PATH_PREFIX, createExampleEntityRouter(service, ctx));

      ctx.registerMcpServer(
        `${EXAMPLE_ENTITY_TYPE}-tools`,
        () => createExampleEntityToolsServer(service, ctx),
      );

      ctx.registerEntityService(EXAMPLE_ENTITY_TYPE, service);
    },
  },
};
