/**
 * `contributes.commands` (declarative slash). ALWAYS registered — not filtered by
 * `config.entities` (`ac-config-entities-filter`). A plugin-level command, distinct
 * from the entity's editor slash command (`src/entity/frontend/slash-command.ts`).
 */

import type { PluginCommandContribution } from '@c4s/plugin-runtime';

export const commandStub: PluginCommandContribution = {
  name: 'c4s-plugin-scaffold-noop',
  trigger: 'example-entity-cmd',
  label: '/example-entity-cmd',
  popoverKind: 'todo-popover',
};
