/**
 * Composition of one (empty) entity as an `EntityContribution` — host 1.0.0 contract.
 *
 * NOTE (difference vs older docs): the backend has NO declarative
 * `mcpServer` / `services(di,db)` / `routes{prefix,router}` slots. There is a single
 * imperative `backend.mount(ctx)` that: builds the service, mounts the router
 * (`ctx.app.use`), registers the MCP server (`ctx.registerMcpServer`) and the
 * service (`ctx.registerEntityService`). Render components (renderChip/Card/Row/
 * detailPanel) are NOT here — they live in `src/frontend.tsx` (a separate frontend
 * entry) so React is not pulled into the backend.
 */

import type { EntityContribution, MountContext } from './host';
import {
  __ENTITY_TYPE__,
  __ENTITY_TABLE__,
  __PATH_PREFIX__,
  __ENTITY_LABEL__,
  __ENTITY_LABEL_PLURAL__,
  __DISPLAY_ORDER__,
  __entity_type__SlugFrom,
} from './identity';
import { __entity_type__Migrations } from './entity/backend/migrations';
import { __entity_type__Serializer } from './entity/serializer';
import { __entity_type__SystemPrompt } from './entity/system-prompt';
import { __EntityName__Service } from './entity/backend/services';
import { create__EntityName__Router } from './entity/backend/routes';
import { create__EntityName__ToolsServer } from './entity/backend/mcp-server';

export const __EntityName__Entity: EntityContribution = {
  // ─── Identity (EntityModuleManifest) ───
  type: __ENTITY_TYPE__,
  table: __ENTITY_TABLE__,
  label: __ENTITY_LABEL__,
  labelPlural: __ENTITY_LABEL_PLURAL__,
  displayOrder: __DISPLAY_ORDER__,
  pathPrefix: __PATH_PREFIX__,
  slugFrom: __entity_type__SlugFrom,

  // ─── Cross-cutting ───
  serializer: __entity_type__Serializer, // L9
  systemPrompt: __entity_type__SystemPrompt, // M05

  // ─── Backend (L1–L4) ───
  backend: {
    migrations: __entity_type__Migrations, // L1
    mount(ctx: MountContext) {
      // L2 — build the service from host dependencies (db + cross-cutting in ctx).
      const service = new __EntityName__Service(ctx.db, ctx);
      // L4 — mount the router under pathPrefix (the host prepends /api/projects/:id).
      ctx.app.use(__PATH_PREFIX__, create__EntityName__Router(service, ctx));
      // L3 — register the MCP server FACTORY as `${type}-tools` (fresh instance per turn).
      ctx.registerMcpServer(`${__ENTITY_TYPE__}-tools`, () =>
        create__EntityName__ToolsServer(service, ctx),
      );
      // M17 — expose the service to cross-cutting consumers (release restore).
      ctx.registerEntityService(__ENTITY_TYPE__, service);
    },
  },
};
