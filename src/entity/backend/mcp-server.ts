/**
 * L3 — MCP tools server for `example-entity`, exposed to the agent as
 * `example-entity-tools`. Registered as a FACTORY in `entity/index.ts`
 * (`ctx.registerMcpServer('example-entity-tools', () => createExampleEntityToolsServer(...))`)
 * so the host can instantiate a fresh server per context — no shared global state
 * (`ac-mcp-factory`).
 *
 * Five tools mirror the CRUD service. Tool names are prefixed with the type:
 * `create_example_entity`, `get_example_entity`, … (snake_case, agent-friendly).
 */

import { createMcpServer, mcpTool } from '@inharness-ai/agent-adapters';
import type { McpServerInstance } from '@inharness-ai/agent-adapters';
import { z } from 'zod';
import type { MountContext } from '@c4s/plugin-runtime';
import type { ExampleEntityService } from './services';

function ok(payload: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
}
function fail(message: string) {
  return { content: [{ type: 'text', text: JSON.stringify({ error: message }) }], isError: true };
}

export function createExampleEntityToolsServer(
  service: ExampleEntityService,
  _ctx: MountContext,
): McpServerInstance {
  const tools = [
    mcpTool(
      'create_example_entity',
      'Create an example-entity. The slug is derived from the name (slugify); it is not accepted as input.',
      { name: z.string(), description: z.string().optional(), data: z.record(z.unknown()).optional() },
      async (args) =>
        ok(
          service.create({
            name: String(args.name),
            description: args.description as string | undefined,
            data: args.data as Record<string, unknown> | undefined,
          }, 'agent'),
        ),
    ),

    mcpTool(
      'get_example_entity',
      'Fetch a single example-entity snapshot by slug.',
      { slug: z.string() },
      async (args) => {
        const snapshot = service.getBySlug(String(args.slug));
        return snapshot ? ok(snapshot) : fail(`example-entity not found: ${String(args.slug)}`);
      },
    ),

    mcpTool(
      'update_example_entity',
      'Patch an example-entity. A name change does not move the slug; pass newSlug to rename.',
      {
        slug: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        data: z.record(z.unknown()).optional(),
        newSlug: z.string().optional(),
      },
      async (args) => {
        const result = service.update(
          String(args.slug),
          {
            name: args.name as string | undefined,
            description: args.description as string | undefined,
            data: args.data as Record<string, unknown> | undefined,
            newSlug: args.newSlug as string | undefined,
          },
          'agent',
        );
        return result ? ok(result.snapshot) : fail(`example-entity not found: ${String(args.slug)}`);
      },
    ),

    mcpTool(
      'delete_example_entity',
      'Hard-delete an example-entity. References are not cascaded — dangling refs are reported.',
      { slug: z.string() },
      async (args) => {
        const result = service.remove(String(args.slug), 'agent');
        return result.deleted ? ok(result) : fail(`example-entity not found: ${String(args.slug)}`);
      },
    ),

    mcpTool(
      'list_example_entity',
      'List example-entities (lightweight items, no data), optionally filtered by tags.',
      {
        tags: z.array(z.string()).optional(),
        filter: z.enum(['and', 'or']).optional(),
      },
      async (args) =>
        ok(
          await service.list({
            tags: (args.tags as string[] | undefined) ?? [],
            filter: (args.filter as 'and' | 'or' | undefined) ?? 'or',
          }),
        ),
    ),
  ];

  return createMcpServer({ name: 'example-entity-tools', tools });
}
