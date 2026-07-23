import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * `@c4s/plugin-runtime` and its `/ui` subpath do not exist on disk — at runtime
 * the host serves them through its import-map shim, which is exactly why
 * `vite.config.ts` keeps both `external`. Under test there is no host, so both
 * specifiers are aliased to the doubles in `test/helpers/`. This mirrors the
 * host contract; it does NOT bundle anything into `dist/`.
 */
const HOST_ALIASES = {
  '@c4s/plugin-runtime/ui': fileURLToPath(new URL('./test/helpers/host-ui.tsx', import.meta.url)),
  '@c4s/plugin-runtime': fileURLToPath(new URL('./test/helpers/host-runtime.ts', import.meta.url)),
};

/**
 * `npm test` (= `vitest run`) is the single verification command for the scaffold.
 * It is the codebase-level proof of the specification's acceptance criteria — one
 * test per active AC (`list_entities(type='ac', filters={status:'active'})`).
 *
 * Two projects, because the plugin has two halves with two runtimes:
 *
 *  - `node`     — everything except `test/frontend/**`. Backend + envelope: manifest,
 *                 identity, DTOs, migrations, express router, serializer, entity
 *                 slots. Runs against a real in-memory SQLite (`better-sqlite3`).
 *  - `frontend` — `test/frontend/**` only, under `jsdom`, because the render slots
 *                 and screens are React components rendered with
 *                 `@testing-library/react`.
 *
 * `projects` (Vitest 3) rather than the deprecated `environmentMatchGlobs`.
 */
export default defineConfig({
  resolve: { alias: HOST_ALIASES },
  test: {
    projects: [
      {
        resolve: { alias: HOST_ALIASES },
        test: {
          name: 'node',
          environment: 'node',
          include: ['test/**/*.test.{ts,tsx}'],
          exclude: ['test/frontend/**', '**/node_modules/**', '**/dist/**'],
          setupFiles: ['./test/setup.ts'],
        },
      },
      {
        resolve: { alias: HOST_ALIASES },
        test: {
          name: 'frontend',
          environment: 'jsdom',
          include: ['test/frontend/**/*.test.{ts,tsx}'],
          exclude: ['**/node_modules/**', '**/dist/**'],
          setupFiles: ['./test/setup.ts'],
        },
      },
    ],
  },
});
