/**
 * System prompt contribution (required — without it the entity type is invisible to
 * the agent). Tells the agent what this entity IS (`roleNoun`), how to count it
 * (`countStat.sqlQuery` against the snake_case index table), and which MCP tools it
 * has (`mcpToolsLine`).
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
  mcpToolsLine:
    'Tools under `example-entity-tools`: create_example_entity, get_example_entity, ' +
    'update_example_entity, delete_example_entity, list_example_entity.',
  // TODO: add a narrativeBlock describing your entity's domain rules for the agent.
};
