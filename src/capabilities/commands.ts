/**
 * `contributes.commands` — stub for a declarative slash command (for entity-less
 * plugins or global commands). The loader normalizes the entry into an
 * `EditorExtensionRegistration.slashCommand` and routes it the same way as entity
 * commands. Declarative: you declare the trigger + popover; the framework executes it.
 *
 * (The entity command `/__entity_type__` lives separately in `entity/frontend/slash-command.ts`.)
 */

import type { PluginCommandContribution } from '../host';

export const commandStub: PluginCommandContribution = {
  name: '__plugin_name__-noop',
  trigger: '__entity_type__-cmd',
  label: '/__entity_type__-cmd',
  popoverKind: 'todo-popover', // TODO: a real client PopoverKind
  // availableIn: ['page'],
};
