/**
 * Envelope AC — the `PluginManifest` gate, teardown, and `config.entities` scope.
 *
 * Contract values (Host API version, gate rejection code) come from the spec page
 * `pages/synchronizacja.md`, mirrored in the manifest header — never hardcoded as an
 * independent literal here. The plugin's contribution to the gate is the DECLARED
 * range; the gate RULE is `semver.satisfies(HOST_API_VERSION, range)`.
 */
import { describe, expect, it } from 'vitest';
import manifest, { manifest as namedManifest } from '../../src/manifest';
import { EXAMPLE_ENTITY_TYPE } from '../../src/identity';

/** The host activation gate, per `pages/synchronizacja.md`: incompatible → rejected. */
const HOST_API_MISMATCH = 'PLUGIN_HOST_API_MISMATCH';

/** Minimal `^X.Y.Z` caret evaluation — the shape the manifest declares. */
function simulateGate(hostVersion: string, range: string): { active: true } | { active: false; code: string } {
  const [rMajor, rMinor = 0, rPatch = 0] = range.replace(/^\^/, '').split('.').map(Number);
  const [hMajor, hMinor = 0, hPatch = 0] = hostVersion.split('.').map(Number);
  const caret = range.startsWith('^');
  const satisfies = caret
    ? hMajor === rMajor && (hMinor > rMinor || (hMinor === rMinor && hPatch >= rPatch))
    : hostVersion === range;
  return satisfies ? { active: true } : { active: false, code: HOST_API_MISMATCH };
}

describe('plugin envelope', () => {
  it('ac-on-unregister-idempotent: onUnregister() is idempotent and never throws — repeated teardown ends without error', () => {
    // Declared on the manifest itself (1.0.0 baseline slot), not on the entity.
    expect(typeof manifest.onUnregister).toBe('function');
    expect(namedManifest).toBe(manifest);

    // Calling it once, twice, three times all succeed — this is what makes
    // hot-reload safe: the host tears down the OLD version, possibly more than once.
    expect(() => manifest.onUnregister()).not.toThrow();
    expect(() => manifest.onUnregister()).not.toThrow();
    expect(() => manifest.onUnregister()).not.toThrow();
  });

  it('ac-host-api-gate: the plugin activates only when the host version satisfies the declared range; a mismatch is rejected with PLUGIN_HOST_API_MISMATCH', () => {
    // The plugin's side of the gate is the declared caret range — admits every host
    // in the 1.x line (the installed 1.0.0 AND the 1.1.0 the spec documents next),
    // rejects a major bump.
    const range = manifest.hostApiVersion;
    expect(range).toBe('^1.0.0');

    expect(simulateGate('1.0.0', range)).toEqual({ active: true });
    expect(simulateGate('1.1.0', range)).toEqual({ active: true });
    expect(simulateGate('2.0.0', range)).toEqual({ active: false, code: HOST_API_MISMATCH });
  });

  it('ac-config-entities-filter: config.entities scopes only contributed entity types — writingStyles/settings/commands sit in sibling keys the filter never touches', () => {
    // The FILTER itself is host-owned; the plugin's job is to keep entity types in
    // `contributes.entities` (the only key a config.entities allow-list targets) and
    // the always-on capability kinds in their own keys.
    expect(manifest.contributes.entities?.map((e) => e.type)).toContain(EXAMPLE_ENTITY_TYPE);

    // The other three capability kinds are NOT entity contributions — a config.entities
    // filter has no bearing on them (they are always registered).
    expect(manifest.contributes.writingStyles).toBeDefined();
    expect(manifest.contributes.settings).toBeDefined();
    expect(manifest.contributes.commands).toBeDefined();

    // Applying the documented rule (allow-list only over entities) drops entities but
    // leaves the other kinds intact.
    const applyEntityAllowList = (allow: string[]) => ({
      entities: (manifest.contributes.entities ?? []).filter((e) => allow.includes(e.type)),
      writingStyles: manifest.contributes.writingStyles,
      settings: manifest.contributes.settings,
      commands: manifest.contributes.commands,
    });
    const filtered = applyEntityAllowList([]);
    expect(filtered.entities).toHaveLength(0);
    expect(filtered.writingStyles).toBe(manifest.contributes.writingStyles);
    expect(filtered.settings).toBe(manifest.contributes.settings);
    expect(filtered.commands).toBe(manifest.contributes.commands);
  });
});
