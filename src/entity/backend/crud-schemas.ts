import { z } from 'zod';
import type { ZodRawShape } from 'zod';

/**
 * Declared to `backend.crud` — the host's generic `entity-tools` MCP server
 * validates `create_entities` items against this. `slug` is never part of the
 * shape: it is `slugify(name)`, derived server-side (`ac-slug-from-name`).
 */
export const exampleEntityCreateSchema: ZodRawShape = {
  name: z.string(),
  description: z.string().optional(),
  data: z.record(z.unknown()).optional(),
};

/**
 * `newSlug` is NOT part of this shape — entity-tools carries it as a sibling
 * field on each `update_entities` item and merges it into `data` itself
 * before calling `service.update()` (see the host's `entity-tools.ts`).
 */
export const exampleEntityUpdateSchema: ZodRawShape = {
  name: z.string().optional(),
  description: z.string().optional(),
  data: z.record(z.unknown()).optional(),
};
