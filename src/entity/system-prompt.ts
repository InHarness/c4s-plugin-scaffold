/**
 * System prompt contribution (required — without it the entity type is invisible to
 * the agent). Tells the agent what this entity IS (`roleNoun`) and how to count it
 * (`countStat.sqlQuery` against the snake_case index table). `mcpToolsLine` is
 * OPTIONAL and describes ONLY non-CRUD tools from a custom `backend.mcpServer`
 * (`ac-mcp-custom-tools-import`) — CRUD tools (host's generic `entity-tools`) are
 * described by the host itself, never duplicated here. This placeholder has no
 * custom `mcpServer` (see `./backend/mcp.ts`), so `mcpToolsLine` is omitted.
 */

import type { SystemPromptContribution } from '@c4s/plugin-runtime';
import { EXAMPLE_ENTITY_TABLE, EXAMPLE_ENTITY_TYPE } from '../identity';

export const exampleEntitySystemPrompt: SystemPromptContribution = {
  roleNoun: 'example entities',
  countStat: {
    placeholder: 'exampleEntityCount',
    sqlQuery: `SELECT count(*) FROM ${EXAMPLE_ENTITY_TABLE}`,
    label: EXAMPLE_ENTITY_TYPE,
  },
  // Paired example, if `./backend/mcp.ts`'s commented custom `mcpServer` were
  // uncommented — a matched pair is: the tool PLUS its line here.
  //
  // mcpToolsLine:
  //   'For example-entity aggregates use example_entity_stats (non-CRUD); ' +
  //   "plain CRUD goes through the host's entity-tools.",
  // TODO: add a narrativeBlock describing your entity's domain rules for the agent.
};
