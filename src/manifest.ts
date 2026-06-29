/**
 * `PluginManifest` — the plugin envelope (host 1.0.0 contract).
 *
 * The host loader does `await import(pkg)`, extracts the manifest (`export manifest`
 * or `default`), gates `hostApiVersion` / `engines`, then fans out per capability
 * kind. The package ONLY exports the manifest — the host drives registration.
 *
 *  - `onUnregister` is REQUIRED and lives HERE (on the manifest), not on the entity.
 *    It must be idempotent and must NOT throw (`ac-on-unregister-idempotent`).
 *  - `hostApiVersion` must satisfy `semver.satisfies(HOST_API_VERSION, range)`;
 *    a mismatch raises `PLUGIN_HOST_API_MISMATCH` and the plugin stays inactive
 *    (`ac-host-api-gate`).
 *  - `config.entities` filters ONLY `contributes.entities`; `writingStyles` /
 *    `settings` / `commands` are always registered (`ac-config-entities-filter`).
 */

import type { PluginManifest } from '@c4s/plugin-runtime';
import { exampleEntityEntity } from './entity';
import { writingStyleStub } from './capabilities/writing-styles';
import { settingsStub } from './capabilities/settings';
import { commandStub } from './capabilities/commands';

export const manifest: PluginManifest = {
  // KEEP in sync with package.json "name".
  name: 'c4s-plugin-scaffold',
  version: '0.0.1',
  // Host API range. Host 1.0.0 must satisfy this; `^2.0.0` would NOT
  // (status `incompatible` → PLUGIN_HOST_API_MISMATCH, plugin skipped).
  hostApiVersion: '^1.0.0',
  engines: { node: '>=20' },

  /**
   * REQUIRED teardown. Called on the OLD version before re-register during
   * hot-reload. Idempotent and never throws (a thrown error is only a warning and
   * never blocks the reload). The host already drops entities/MCP/routes on
   * unregister — clean up here only what YOU register yourself (global listeners,
   * a shared store slice). No-op for the empty scaffold.
   */
  onUnregister(): void {
    // TODO: detach your own global resources, if any. Must stay idempotent.
  },

  // Full envelope — all four capability kinds filled in.
  contributes: {
    entities: [exampleEntityEntity],
    writingStyles: [writingStyleStub],
    settings: settingsStub,
    commands: [commandStub],
  },
};

export default manifest;
