/**
 * Frontend ENTRY — loaded by the host as native ESM (via the `window.__c4s_shared`
 * import-map shim). Evaluating this module REGISTERS the entity's frontend module
 * as a side effect (`registerFrontendModule`).
 *
 * KEY (1.0.0 contract): render components receive the
 * already-resolved entity in props (`{ slug, entity, onOpen }`); they do NOT
 * self-fetch. The module provides `useGetBySlug` and `listByTags` instead.
 */

import * as React from 'react';
import { registerFrontendModule } from './host';
import type { FrontendModule } from './host';
import {
  __ENTITY_TYPE__,
  __ENTITY_TABLE__,
  __PATH_PREFIX__,
  __ENTITY_LABEL__,
  __ENTITY_LABEL_PLURAL__,
  __DISPLAY_ORDER__,
  __entity_type__SlugFrom,
} from './identity';
import { __EntityName__Chip } from './entity/frontend/render-chip';
import { __EntityName__Card } from './entity/frontend/render-card';
import { __EntityName__Row } from './entity/frontend/render-row';
import { __EntityName__Detail } from './entity/frontend/detail-panel';
import { use__EntityName__BySlug, list__EntityName__ByTags } from './entity/frontend/hooks';
import { __entity_type__SlashCommand } from './entity/frontend/slash-command';

/** Placeholder sidebar icon (no lucide-react dependency). TODO: replace. */
const __EntityName__Icon: React.FC<{ className?: string; size?: number | string }> = ({
  className,
  size = 16,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    aria-hidden="true"
  >
    <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
  </svg>
);

export const __EntityName__FrontendModule: FrontendModule = {
  // ─── Identity (must match the backend) ───
  type: __ENTITY_TYPE__,
  table: __ENTITY_TABLE__,
  label: __ENTITY_LABEL__,
  labelPlural: __ENTITY_LABEL_PLURAL__,
  displayOrder: __DISPLAY_ORDER__,
  pathPrefix: __PATH_PREFIX__,
  slugFrom: __entity_type__SlugFrom,

  // ─── L8 render slots (entity injected by the host) ───
  renderChip: __EntityName__Chip,
  renderCard: __EntityName__Card,
  renderRow: __EntityName__Row,
  detailPanel: __EntityName__Detail,

  // ─── Data resolution (the host calls these slots) ───
  useGetBySlug: use__EntityName__BySlug,
  listByTags: list__EntityName__ByTags,

  // ─── L5 — sidebar tab (optional; keep or remove) ───
  sidebarTab: {
    icon: __EntityName__Icon,
    label: __ENTITY_LABEL_PLURAL__,
    order: __DISPLAY_ORDER__,
  },

  // ─── L8 — editor extensions (slash command). The host pins them onto its Tiptap. ───
  editorExtensions: [__entity_type__SlashCommand],
};

// Register as a side effect when the frontend module is evaluated.
registerFrontendModule(__EntityName__FrontendModule);

export default __EntityName__FrontendModule;
