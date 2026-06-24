/**
 * M05 — `SystemPromptContribution`. REQUIRED: without it the agent behaves as if the
 * entity type did not exist (no `__entity_type__-tools` in the prompt, no entity count).
 */

import type { SystemPromptContribution } from '../host';
import { __ENTITY_TABLE__ } from '../identity';

export const __entity_type__SystemPrompt: SystemPromptContribution = {
  roleNoun: '__ENTITY_TITLE__s', // plural
  countStat: {
    placeholder: '__entity_type__Count',
    sqlQuery: `SELECT COUNT(*) AS count FROM ${__ENTITY_TABLE__}`,
    label: '__entity_type__',
  },
  mcpToolsLine:
    '__entity_type__-tools: create___entity_type__, get___entity_type__, update___entity_type__, delete___entity_type__, list___entity_type__',
  narrativeBlock: 'TODO: a short, domain-specific description of the entity for the agent (what it is, how to use it).',
};
