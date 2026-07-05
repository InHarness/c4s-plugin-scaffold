/**
 * L8 — single-element card (the `single_element` embed). Purely presentational; the
 * host injects a resolved, non-null `entity`. Unlike the chip, the card does not own
 * a broken state — a card is only rendered for a resolvable element.
 */

import type { FC } from 'react';
import { editorBridge } from '@c4s/plugin-runtime';
import type { EntityCardProps } from '@c4s/plugin-runtime';
import { EXAMPLE_ENTITY_TYPE } from '../../identity';
import type { ExampleEntitySnapshot } from '../dto';

export const ExampleEntityCard: FC<EntityCardProps<ExampleEntitySnapshot>> = ({
  slug,
  entity,
  onOpen,
}) => {
  const open = () => (onOpen ? onOpen() : editorBridge.openEntity(EXAMPLE_ENTITY_TYPE, slug));

  if (!entity) {
    // Defensive: a card should always get an entity, but degrade gracefully.
    return <div className="c4s-card c4s-card--broken">⚠ {slug}</div>;
  }

  return (
    <div
      className="c4s-card"
      onClick={open}
      style={{
        cursor: 'pointer',
        border: '1px solid var(--c-border, #e2e2e2)',
        borderRadius: 8,
        padding: '0.75rem 1rem',
      }}
    >
      <div className="c4s-card__title" style={{ fontWeight: 600 }}>
        {entity.name}
      </div>
      {entity.description ? (
        <div className="c4s-card__desc" style={{ color: 'var(--c-muted, #6b7280)' }}>
          {entity.description}
        </div>
      ) : null}
    </div>
  );
};
