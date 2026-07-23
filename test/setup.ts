/**
 * Global vitest setup, applied to BOTH projects (`node` and `frontend`).
 *
 * jsdom-only wiring is guarded on `typeof window`, so the node project never pays
 * for it:
 *  - React Testing Library cleanup between tests.
 *  - `window.__C4S_PROJECT__`, the host's project-scope handle the frontend hooks
 *    read to prefix every fetch as `/api/projects/<id>/…` (see
 *    `src/entity/frontend/hooks.ts` `apiBase()`). Tests that care about the value
 *    set it themselves; this only guarantees the global EXISTS so an unrelated
 *    render does not explode.
 */
import { afterEach } from 'vitest';

declare global {
  // eslint-disable-next-line no-var
  var __C4S_PROJECT__: { id: string } | undefined;
}

if (typeof window !== 'undefined') {
  const { cleanup } = await import('@testing-library/react');
  afterEach(() => cleanup());

  if (!window.__C4S_PROJECT__) {
    window.__C4S_PROJECT__ = { id: 'test-project' };
  }
}

export {};
