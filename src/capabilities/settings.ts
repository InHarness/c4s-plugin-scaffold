/**
 * `contributes.settings` — stub (M26). Values land under
 * `config.plugins["__plugin_name__"][key]`. Note: settings/commands are active when the
 * plugin is loaded+trusted, REGARDLESS of the `config.entities` whitelist (the settings
 * panel survives deactivation of the entity types).
 *
 * `kind`: 'hot-reload' (from the next turn) | 'executive' (rebuild ProjectContext).
 */

import type { PluginSettingsModule } from '../host';

export const settingsStub: PluginSettingsModule = [
  {
    key: 'enabled',
    label: 'Enable feature X',
    control: 'toggle',
    kind: 'hot-reload',
    default: true,
    help: 'TODO: field description. Example toggle — replace with your plugin settings.',
  },
];
