/**
 * L2 service — write-path snapshot failure is signalled, never swallowed.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExampleEntityService } from '../../src/entity/backend/services';
import { createTestMountContext } from '../helpers/mount-context';

afterEach(() => vi.restoreAllMocks());

describe('example-entity service — write path', () => {
  it('ac-snapshot-failure-signaled: a snapshot failure during a mutation surfaces (throws + logs), it is never silently swallowed', () => {
    const h = createTestMountContext({ migrate: true });
    try {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const service = new ExampleEntityService(h.ctx.db, h.ctx);

      // Force the host's per-mutation snapshot capture to blow up.
      const boom = new Error('capture blew up');
      h.failCaptureWith(boom);

      // The failure propagates out of `create` (not swallowed) …
      expect(() => service.create({ name: 'Example Entity' })).toThrow('capture blew up');
      // … and is logged on the way out.
      expect(errorSpy).toHaveBeenCalled();
    } finally {
      h.close();
    }
  });
});
