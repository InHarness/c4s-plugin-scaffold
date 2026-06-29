/**
 * L8 — inline mention chip. This is the ONLY render slot that takes `entity: T | null`
 * and renders the "broken" reference state (a dangling reference whose target was
 * deleted) — `ac-renderchip-broken-state`. Purely presentational: the host injects
 * the resolved entity; the chip never fetches (`ac-render-presentational`).
 */

import type { FC } from 'react';
import { editorBridge } from '@c4s/plugin-runtime';
import type { EntityChipProps } from '@c4s/plugin-runtime';
import { EXAMPLE_ENTITY_TYPE } from '../../identity';
import type { ExampleEntitySnapshot } from '../dto';

export const ExampleEntityChip: FC<EntityChipProps<ExampleEntitySnapshot>> = ({
  slug,
  entity,
  onOpen,
}) => {
  const open = () => (onOpen ? onOpen() : editorBridge.openEntity(EXAMPLE_ENTITY_TYPE, slug));

  // Broken reference — the only slot that handles `entity === null`.
  if (!entity) {
    return (
      <span
        className="c4s-chip c4s-chip--broken"
        style={{ color: 'var(--c-danger, #c0392b)' }}
        title={`Broken reference: ${slug}`}
      >
        ⚠ {slug}
      </span>
    );
  }

  return (
    <span
      className="c4s-chip"
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => (e.key === 'Enter' ? open() : undefined)}
      style={{ cursor: 'pointer', color: 'var(--c-accent, #2d6cdf)' }}
    >
      {entity.name}
    </span>
  );
};
