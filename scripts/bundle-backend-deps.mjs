#!/usr/bin/env node
// Second bundling pass over Vite's own dist/index.js output, run by `npm run
// build` right after `vite build` (see package.json). Inlines backend
// runtime deps that Vite/Rollup leaves as bare `import ... from 'express'` /
// `'zod'` (see vite.config.ts's EXTERNAL list) so dist/index.js is fully
// self-contained — the host's overlay loader never runs `npm install`
// against a mounted project-local plugin, so an unbundled backend dep fails
// to resolve at runtime (`PLUGIN_IMPORT_FAILED`).
//
// Uses esbuild directly (not Vite/Rollup) because express's CJS dependency
// tree hits real interop bugs under Rollup's default commonjs handling
// (bare, unprefixed `require('util')`/`require('fs')` get mis-externalized
// as browser polyfills; some transitive deps produce broken `require$$0`
// helpers). esbuild's `platform: 'node'` bundling handles this class of
// package correctly — it's the standard tool for bundling a Node backend.
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

const ENTRY = 'dist/index.js';

// Everything vite.config.ts's EXTERNAL list keeps external MINUS
// `express`/`zod` (those two get inlined here) — the frontend-only peers
// (react/tiptap/tanstack/@c4s/plugin-runtime/ui) never actually appear in
// dist/index.js, but listing them is harmless and keeps this list an
// obvious mirror of vite.config.ts's own EXTERNAL, so the two don't drift.
const KEEP_EXTERNAL = [
  '@c4s/plugin-runtime',
  '@c4s/plugin-runtime/ui',
  '@inharness-ai/agent-adapters',
  'react',
  'react-dom',
  'react-dom/client',
  'react/jsx-runtime',
  '@tanstack/react-query',
  '@tanstack/react-router',
  'better-sqlite3',
];

const result = await build({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node', // handles Node builtins (bare or `node:`-prefixed) as external automatically
  format: 'esm',
  target: 'es2022',
  write: false,
  external: [...KEEP_EXTERNAL, ...KEEP_EXTERNAL.map((id) => `${id}/*`)],
  // Some of express's CJS dependency tree keeps a literal runtime
  // `require(...)` call in esbuild's ESM output instead of being fully
  // inlined (e.g. a conditionally-required Node builtin) — real ESM has no
  // global `require`, so this shims one in via `createRequire`. Standard
  // esbuild recipe for "Dynamic require of X is not supported".
  banner: { js: "import { createRequire as __c4sCreateRequire } from 'node:module';\nconst require = __c4sCreateRequire(import.meta.url);" },
  // The manifest must keep its default + named `manifest` export — matches
  // vite.config.ts's own `minify: false` for the same reason.
  minify: false,
  sourcemap: false,
  logLevel: 'warning',
});

const [out] = result.outputFiles;
writeFileSync(ENTRY, out.text);

// Sanity check: the two deps this pass exists for must actually be gone as
// bare imports — fail loudly rather than silently shipping a broken dist/.
const written = readFileSync(ENTRY, 'utf8');
for (const dep of ['express', 'zod']) {
  const re = new RegExp(`from\\s*["']${dep}["']`);
  if (re.test(written)) {
    console.error(`bundle-backend-deps: '${dep}' is still a bare import in ${ENTRY} — bundling failed`);
    process.exit(1);
  }
}
console.log(`bundle-backend-deps: inlined express/zod into ${ENTRY}`);
