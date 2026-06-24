/**
 * L8 — list row (element/tagged list). PURE REACT.
 * Props (1.0.0 contract): `{ entity, active, onOpen }` — entity is always present.
 *
 * This is a SINGLE-ROW renderer: the host calls it once per entity inside its own
 * list views (ElementListView / TaggedListView). The list-level header/search/count
 * (`EntityListHeader` from the Host UI Kit) is owned by the host's sidebar list pages
 * and is NOT available to this per-row slot — `FrontendModule` exposes no list-container
 * hook. Keep this component to one row; the kit only frames the detail panel here.
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
