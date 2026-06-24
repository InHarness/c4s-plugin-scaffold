/**
 * `PluginManifest` — the plugin envelope (host 1.0.0 contract).
 *
 * The host loader does `await import(pkg)`, extracts the manifest (`export manifest`
 * or `default`), gates `hostApiVersion` / `engines`, then fans out per capability
 * kind. The package ONLY exports the manifest — the host calls `registerPlugin`.
 *
 * Notes (confirmed against the real host code, `HOST_API_VERSION = '1.0.0'`):
 *  - `onUnregister` is REQUIRED and lives HERE (on the manifest), not on the entity.
 *  - `hostApiVersion` must satisfy `semver.satisfies('1.0.0', range)` ⇒ `^1.0.0`.
 */

import type { PluginManifest } from './host';
import { __EntityName__Entity } from './plugin';
import { writingStyleStub } from './capabilities/writing-styles';
import { settingsStub } from './capabilities/settings';
import { commandStub } from './capabilities/commands';

export const manifest: PluginManifest = {
  // = __plugin_name__ — KEEP in sync with package.json "name".
  name: 'c4s-plugin-scaffold',
  version: '0.0.0',
  // Host API range. Any non-1 major (e.g. `^2.0.0`) does NOT satisfy host 1.0.0
  // (status `incompatible`, `PLUGIN_HOST_API_MISMATCH` — the plugin is skipped).
  hostApiVersion: '^1.0.0',
  engines: { node: '>=20' },

  /**
   * REQUIRED teardown (a required slot from the 1.0.0 baseline). Called on the OLD
   * version before re-register during hot-reload. Must be idempotent and must NOT
   * throw (a thrown error is a
   * warning and never blocks the reload). The host already drops entities/MCP/routes
   * on `unregisterPlugin`; clean up here only what you register yourself (e.g. a
   * zustand slice, global listeners).
   */
  onUnregister(): void {
    // TODO: detach your own global resources, if you create any. No-op for now.
  },

  // Full envelope — all four capability kinds filled in.
  contributes: {
    entities: [__EntityName__Entity],
    writingStyles: [writingStyleStub],
    settings: settingsStub,
    commands: [commandStub],
  },
};

export default manifest;
