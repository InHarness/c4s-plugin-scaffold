/**
 * `contributes.settings` (M26). ALWAYS registered — not filtered by `config.entities`
 * (`ac-config-entities-filter`). Values are stored by the host under
 * `config.plugins["c4s-plugin-scaffold"][key]`.
 */

import type { PluginSettingsModule } from '@c4s/plugin-runtime';

export const settingsStub: PluginSettingsModule = [
  {
    key: 'enabled',
    label: 'Enable feature X',
    control: 'toggle',
    kind: 'hot-reload',
    default: true,
    help: 'Example hot-reload setting. Replace with your own plugin options.',
  },
];
