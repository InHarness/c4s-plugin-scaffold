/**
 * Test double for the VALUE side of `@c4s/plugin-runtime`.
 *
 * At runtime the host serves that specifier through its import-map shim, so it does
 * not exist on disk and cannot be resolved by Node/Vite in a test. The
 * `resolve.alias` in `vitest.config.ts` points the specifier here instead.
 *
 * Only the PUBLISHED value surface the scaffold actually imports is stubbed:
 *  - `editorBridge` / `registerFrontendModule` — navigation + registration side.
 *  - the host data hooks the detail panel + list screen consume (`useTags`,
 *    `useEntityTags`, `useReferences`, `useVersions`, `useVersionDiff` and the
 *    `useAssignTags` / `useRemoveEntityTag` / `useRestoreVersion` mutations).
 * They return inert, query-shaped defaults so a full render never explodes; a test
 * that needs specific data seeds it through `hostRuntimeState`.
 *
 * `HOST_API_VERSION` mirrors the host constant. The installed runtime reports
 * `1.0.0`; `pages/synchronizacja.md` documents `1.1.0` as the next contract — both
 * are satisfied by the manifest range `^1.0.0`, which is what the gate actually
 * asserts. Tests read the version from HERE / the manifest range (the contract
 * rule), never a hardcoded literal in an assertion.
 */

export const HOST_API_VERSION = '1.0.0';

export interface RegisteredFrontendModule {
  type: string;
  [key: string]: unknown;
}

/** Everything the stub recorded. Reset it with `resetHostRuntime()`. */
export const hostRuntimeState: {
  frontendModules: RegisteredFrontendModule[];
  openedEntities: Array<{ type: string; slug: string }>;
  openedSections: Array<{ pagePath: string; anchor: string }>;
} = {
  frontendModules: [],
  openedEntities: [],
  openedSections: [],
};

export function resetHostRuntime(): void {
  hostRuntimeState.frontendModules = [];
  hostRuntimeState.openedEntities = [];
  hostRuntimeState.openedSections = [];
}

export function registerFrontendModule(module: RegisteredFrontendModule): void {
  hostRuntimeState.frontendModules.push(module);
}

export const editorBridge = {
  openEntity: (type: string, slug: string) => {
    hostRuntimeState.openedEntities.push({ type, slug });
  },
  openSection: (pagePath: string, anchor: string) => {
    hostRuntimeState.openedSections.push({ pagePath, anchor });
  },
};

// ── Host data hooks (inert, query/mutation-shaped) ──

interface QueryLike<T> {
  data: T;
  isLoading: boolean;
}
interface MutationLike {
  mutate: (...args: unknown[]) => void;
  mutateAsync: (...args: unknown[]) => Promise<unknown>;
  isPending: boolean;
  error: unknown;
  reset: () => void;
}

const query = <T>(data: T): QueryLike<T> => ({ data, isLoading: false });
const mutation = (): MutationLike => ({
  mutate: () => undefined,
  mutateAsync: async () => undefined,
  isPending: false,
  error: null,
  reset: () => undefined,
});

export function useTags(): QueryLike<Array<{ slug: string; name: string; color?: string; counts: Record<string, number> }>> {
  return query([]);
}
export function useEntityTags(_type: string, _slug: string): QueryLike<string[]> {
  return query([]);
}
export function useReferences(_type: string, _slug: string): QueryLike<Array<{ pagePath: string; line: number }>> {
  return query([]);
}
export function useVersions(_type: string, _slug: string): QueryLike<Array<Record<string, unknown>>> {
  return query([]);
}
export function useVersionDiff(
  _type: string,
  _slug: string,
  _a: number | null,
  _b: number | null,
): QueryLike<{ raw?: Record<string, unknown> } | undefined> {
  return query(undefined);
}
export function useAssignTags(): MutationLike {
  return mutation();
}
export function useRemoveEntityTag(): MutationLike {
  return mutation();
}
export function useRestoreVersion(): MutationLike {
  return mutation();
}
