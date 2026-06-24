/**
 * The single import surface for the host runtime — `@c4s/plugin-runtime`.
 *
 * The rest of the plugin imports types and values FROM HERE (`../host` / `./host`),
 * so when the specifier or the surface shape changes you fix it in one place.
 *
 * NOTE: `@c4s/plugin-runtime` is NOT a separate npm package. The backend gets it
 * from the host process; the frontend gets it via an import-map shim
 * (`window.__c4s_shared`). Types are not published — see `src/c4s-runtime.d.ts`
 * (ambient fallback).
 * TODO: once the host publishes types/a package, delete `c4s-runtime.d.ts` and keep these re-exports.
 */

// ─── Contract types (backend + cross-cutting) ───
export type {
  PluginManifest,
  PluginEngines,
  EntityContribution,
  EntityModuleManifest,
  SqlMigration,
  MountContext,
  PluginMountFn,
  EntitySerializer,
  SerializeContext,
  RestoreContext,
  RestoreResult,
  EntityDiff,
  SnapshotData,
  SystemPromptContribution,
  PluginSettingField,
  PluginSettingsModule,
  PluginCommandContribution,
  WritingStyleContribution,
} from '@c4s/plugin-runtime';

// ─── Frontend types (L5/L8) ───
export type {
  FrontendModule,
  EditorBridge,
  EditorExtensionRegistration,
  SlashCommand,
  SidebarTabSlot,
  EntityChipProps,
  EntityCardProps,
  EntityRowProps,
  EntityDetailProps,
} from '@c4s/plugin-runtime';

// ─── Runtime values ───
export {
  HOST_API_VERSION,
  clientPluginHost,
  registerFrontendModule,
  queryClient,
  editorBridge,
  registerExtensionReferenceType,
} from '@c4s/plugin-runtime';
