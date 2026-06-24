/**
 * L8 — list row (element/tagged list). PURE REACT.
 * Props (1.0.0 contract): `{ entity, active, onOpen }` — entity is always present.
 */

import * as React from 'react';
import type { EntityRowProps } from '../../host';

export const __EntityName__Row: React.FC<EntityRowProps> = ({ entity, active, onOpen }) => {
  const data = entity as { slug?: string; title?: string };
  return (
    <button type="button" onClick={onOpen} aria-current={active ? 'true' : undefined}>
      {data.title ?? data.slug /* TODO: label field */}
    </button>
  );
};
