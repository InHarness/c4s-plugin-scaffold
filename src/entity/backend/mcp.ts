/**
 * Optional, NON-CRUD custom MCP server (`backend.mcpServer`). Reach this ONLY when the
 * type needs a tool CRUD can't express (aggregate, import, computed rollup) — CRUD tools
 * are the host's generic `entity-tools`, never a per-type server. Commented out: this
 * placeholder has no such tool (see `entity/index.ts`'s "No backend.mcpServer" note).
 *
 * `createMcpServer` / `mcpTool` are VALUES re-exported by `@c4s/plugin-runtime` (the C4S
 * facade over the host's vendor MCP SDK) — import them from there, NEVER from the vendor
 * package `@inharness-ai/agent-adapters` directly (`ac-mcp-custom-tools-import`).
 */

// import { createMcpServer, mcpTool } from '@c4s/plugin-runtime';
// import type { McpServerInstance, MountContext } from '@c4s/plugin-runtime';
// import { z } from 'zod';
// import type { ExampleEntityCrudAdapter } from './crud-adapter';
//
// const exampleEntityToolsCustom = (
//   service: ExampleEntityCrudAdapter,
//   ctx: MountContext,
// ): McpServerInstance =>
//   createMcpServer({
//     name: 'example-entity-tools-custom',
//     tools: [
//       mcpTool(
//         'example_entity_stats',
//         'Returns an aggregate over example-entity (e.g. record count by status).',
//         { groupBy: z.enum(['status']) },
//         async ({ groupBy }) => service.rich.aggregate({ groupBy }),
//       ),
//     ],
//   });
//
// // Wire into EntityBackend (entity/index.ts):
// //   backend: { crud: { /* … */ }, mcpServer: exampleEntityToolsCustom }
//
// (`service.rich.aggregate` is illustrative — `ExampleEntityService` has no such method;
// add one on the rich service when your type actually needs a non-CRUD tool like this.)
