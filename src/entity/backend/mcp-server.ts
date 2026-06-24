/**
 * L3 — the entity's MCP server. Mounted by the host as `${type}-tools` (the factory
 * runs once per agent turn → a fresh instance). Five CRUD tools; bodies delegate to
 * the service (TODO). Contract from `@inharness-ai/agent-adapters`: `createMcpServer`,
 * `mcpTool` (schema = a zod object), the handler returns
 * `{ content: [{ type:'text', text: JSON.stringify(...) }], isError? }`.
 */

import { createMcpServer, mcpTool, type McpServerInstance } from '@inharness-ai/agent-adapters';
import { z } from 'zod';
import type { MountContext } from '../../host';
import { __ENTITY_TYPE__ } from '../../identity';
import type { __EntityName__Service } from './services';

export function create__EntityName__ToolsServer(
  service: __EntityName__Service,
  ctx: MountContext,
): McpServerInstance {
  const ok = (payload: unknown) => ({
    content: [{ type: 'text' as const, text: JSON.stringify(payload) }],
  });
  const fail = (err: unknown) => ({
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      },
    ],
    isError: true,
  });

  // Notify the UI about an entity change (chips in chat/editor re-fetch).
  const broadcast = (slug: string) =>
    ctx.ws.broadcast({ kind: 'entity:changed', entityType: __ENTITY_TYPE__, slug });

  const create___entity_type__ = mcpTool(
    'create___entity_type__',
    'Create a new __entity_type__. Generates a slug. TODO: describe the domain.',
    {
      // TODO: replace with your entity's fields.
      title: z.string().describe('Item label'),
      slug: z.string().optional(),
    },
    async (args) => {
      try {
        const record = service.create(
          { title: args.title as string, slug: args.slug as string | undefined },
          'agent',
        );
        broadcast(record.slug);
        return ok({ slug: record.slug, type: __ENTITY_TYPE__ });
      } catch (err) {
        return fail(err);
      }
    },
  );

  const get___entity_type__ = mcpTool(
    'get___entity_type__',
    'Get a __entity_type__ by slug.',
    { slug: z.string() },
    async (args) => {
      const record = service.getBySlug(String(args.slug));
      if (!record) return fail(new Error(`__entity_type__ '${String(args.slug)}' not found`));
      return ok(record);
    },
  );

  const update___entity_type__ = mcpTool(
    'update___entity_type__',
    'Update a __entity_type__ (partial). Changing the label never moves the slug; rename via newSlug.',
    {
      slug: z.string(),
      data: z.object({ title: z.string().optional() }).describe('Fields to change'),
      newSlug: z.string().optional().describe('Explicit slug rename'),
    },
    async (args) => {
      try {
        const data = (args.data ?? {}) as { title?: string };
        const { record, previousSlug } = service.update(
          String(args.slug),
          { title: data.title, newSlug: args.newSlug as string | undefined },
          'agent',
        );
        if (record.slug !== previousSlug) {
          // TODO: await ctx.referencesService.propagateSlugChange(__ENTITY_TYPE__, previousSlug, record.slug);
          broadcast(previousSlug);
        }
        broadcast(record.slug);
        return ok({ slug: record.slug, updated: true });
      } catch (err) {
        return fail(err);
      }
    },
  );

  const delete___entity_type__ = mcpTool(
    'delete___entity_type__',
    'Delete a __entity_type__ by slug.',
    { slug: z.string() },
    async (args) => {
      try {
        const slug = String(args.slug);
        const result = service.remove(slug, 'agent');
        broadcast(slug);
        return ok(result);
      } catch (err) {
        return fail(err);
      }
    },
  );

  const list___entity_type__ = mcpTool(
    'list___entity_type__',
    'List __entity_type__ items (optional filters: tags/tagFilter/search).',
    {
      tags: z.array(z.string()).optional(),
      tagFilter: z.enum(['and', 'or']).optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    },
    async (args) => {
      try {
        const list = service.list({
          tags: args.tags as string[] | undefined,
          tagFilter: args.tagFilter as 'and' | 'or' | undefined,
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        });
        return ok({ items: list, total: list.length });
      } catch (err) {
        return fail(err);
      }
    },
  );

  return createMcpServer({
    name: `${__ENTITY_TYPE__}-tools`,
    tools: [
      create___entity_type__,
      get___entity_type__,
      update___entity_type__,
      delete___entity_type__,
      list___entity_type__,
    ],
  });
}
