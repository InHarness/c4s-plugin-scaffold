/**
 * Frontend ENTRY — evaluating this module registers the frontend module as a side
 * effect (`registerFrontendModule`). The host loads it as native ESM via the
 * import-map shim; React/Tiptap/TanStack are externalized (provided by the host).
 *
 * The render slots receive a resolved entity in props (no self-fetch); screens use
 * the data hooks. Identity here MUST match the backend contribution.
 */

import type { FC } from 'react';
import { registerFrontendModule } from '@c4s/plugin-runtime';
import type { FrontendModule } from '@c4s/plugin-runtime';
import {
  EXAMPLE_ENTITY_TYPE,
  EXAMPLE_ENTITY_TABLE,
  EXAMPLE_ENTITY_LABEL,
  EXAMPLE_ENTITY_LABEL_PLURAL,
  EXAMPLE_ENTITY_DISPLAY_ORDER,
  EXAMPLE_ENTITY_PATH_PREFIX,
  exampleEntitySlugFrom,
} from './identity';
import { ExampleEntityChip } from './entity/frontend/render-chip';
import { ExampleEntityCard } from './entity/frontend/render-card';
import { ExampleEntityRow } from './entity/frontend/render-row';
import { ExampleEntityDetail } from './entity/frontend/detail-panel';
import { exampleEntityRoutes } from './entity/frontend/routes';
import { useGetBySlug, listByTags } from './entity/frontend/hooks';
import { exampleEntitySlashCommand } from './entity/frontend/slash-command';

/** Tiny inline icon (no `lucide-react` dependency) for the sidebar tab. */
const ExampleEntityIcon: FC<{ className?: string; size?: number | string }> = ({
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
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" />
    <path d="M5 8h6M5 5.5h6M5 10.5h3" />
  </svg>
);

export const ExampleEntityFrontendModule: FrontendModule = {
  // ── Identity (must match the backend EntityContribution) ──
  type: EXAMPLE_ENTITY_TYPE,
  table: EXAMPLE_ENTITY_TABLE,
  label: EXAMPLE_ENTITY_LABEL,
  labelPlural: EXAMPLE_ENTITY_LABEL_PLURAL,
  displayOrder: EXAMPLE_ENTITY_DISPLAY_ORDER,
  pathPrefix: EXAMPLE_ENTITY_PATH_PREFIX,
  slugFrom: exampleEntitySlugFrom,

  // ── Render slots (presentational; data via props/hooks only) ──
  // Cast: the slot types use `EntityChipProps<unknown>`; our components are typed to
  // the concrete snapshot for nicer internals.
  renderChip: ExampleEntityChip as FrontendModule['renderChip'],
  renderCard: ExampleEntityCard as FrontendModule['renderCard'],
  renderRow: ExampleEntityRow as FrontendModule['renderRow'],
  detailPanel: ExampleEntityDetail,

  // ── Data resolution ──
  useGetBySlug,
  listByTags,

  // ── List-screen entry (sidebar tab) + editor extension ──
  sidebarTab: {
    icon: ExampleEntityIcon,
    label: EXAMPLE_ENTITY_LABEL_PLURAL,
    order: EXAMPLE_ENTITY_DISPLAY_ORDER,
  },
  editorExtensions: [exampleEntitySlashCommand],

  // ── Page routes (list + detail), mounted into the host's single router ──
  routes: exampleEntityRoutes,
};

registerFrontendModule(ExampleEntityFrontendModule);

export default ExampleEntityFrontendModule;
