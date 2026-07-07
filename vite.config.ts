import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

/**
 * Vite library mode.
 *
 * Two entries: `src/index.ts` (backend, consumed by the host loader) and
 * `src/frontend.tsx` (frontend, loaded as native ESM via the host's import-map
 * shim). All runtime peers are EXTERNAL at this stage — the plugin does NOT
 * bundle its own copy of React/Tiptap/TanStack (two copies break hooks and
 * shared state; the frontend receives them from `window.__c4s_shared` through
 * the host import map).
 *
 * Backend runtime deps (`express`, `zod`) are a DIFFERENT case, handled by a
 * SEPARATE post-build step (`scripts/bundle-backend-deps.mjs`, run by `npm
 * run build`), not by Rollup here: the host's overlay loader
 * (`overlay-loader.ts`) loads a project-local plugin with a raw `import()`
 * and never runs `npm install` against the mounted directory — there is no
 * backend equivalent of the import-map shim, so any backend dep left
 * external simply fails to resolve at runtime (`PLUGIN_IMPORT_FAILED`).
 * They're deliberately NOT bundled by Rollup/Vite directly: express's CJS
 * dependency tree hits real interop bugs under Rollup's default commonjs
 * handling (bare, unprefixed `require('util')`/`require('fs')` get
 * mis-externalized as browser polyfills, and some transitive deps produce
 * broken `require$$0`-style helpers) — esbuild's `platform: 'node'` bundling
 * handles this class of CJS package far more robustly, so that's what
 * actually inlines them, as a second pass over Vite's own output.
 */

// Peers provided by the host — must stay `external` (kept out of dist) at
// THIS (Vite/Rollup) stage. `express`/`zod` are handled by the esbuild
// post-build step instead (see above) — listing them here too would be
// harmless but redundant, since they're not imported by the frontend entry.
const EXTERNAL = [
  '@c4s/plugin-runtime',
  // Host UI Kit subpath — a distinct module id to Rollup, so it must be listed
  // separately from '@c4s/plugin-runtime' to keep the host UI out of dist.
  '@c4s/plugin-runtime/ui',
  '@inharness-ai/agent-adapters',
  'react',
  'react-dom',
  'react-dom/client',
  'react/jsx-runtime',
  '@tiptap/core',
  '@tanstack/react-query',
  // Library-peer: the host provides the single router instance via
  // host.mountFrontend(router, …); two copies would split the route tree.
  '@tanstack/react-router',
  'express',
  // better-sqlite3 stays external: a native module, unused by the default
  // entity (see services.ts), and not bundleable the way pure-JS deps are —
  // the host has no backend peer-bridge for it today (see DOCKER.md).
  'better-sqlite3',
  'zod',
];

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        frontend: 'src/frontend.tsx',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      // Externalize peers + all @tiptap/* subpaths and node builtins.
      external: (id) =>
        EXTERNAL.includes(id) ||
        id.startsWith('@tiptap/') ||
        id.startsWith('node:'),
    },
    // Do not minify — the manifest must keep its default + named `manifest` export.
    minify: false,
    sourcemap: true,
    target: 'es2022',
  },
  plugins: [
    dts({
      include: ['src'],
      // Emit dist/index.d.ts and dist/frontend.d.ts for both entries.
      insertTypesEntry: true,
    }),
  ],
});
