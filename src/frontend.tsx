/**
 * Frontend ENTRY — evaluating this module registers the frontend module as a side
 * effect (`registerFrontendModule`). The host loads it as native ESM via the
 * import-map shim; React/Tiptap/TanStack are externalized (provided by the host).
 *
 * The render slots receive a resolved entity in props (no self-fetch); screens use
 * the data hooks. Identity here MUST match the backend contribution.
 */

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
// ONE shared icon reference for both the sidebar tab and the list header.
import { ExampleEntityIcon } from './entity/frontend/icon';

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
  // Cast: the panel declares the 1.1.0 props locally (`{ slug; onDeleted?; onRenamed? }`);
  // the installed slot type is still the 1.0.0 `EntityDetailProps` (required `onBack`).
  detailPanel: ExampleEntityDetail as FrontendModule['detailPanel'],

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
