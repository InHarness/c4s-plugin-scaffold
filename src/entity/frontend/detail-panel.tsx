/**
 * M05 / L8 — detail panel. Fills the REQUIRED `detailPanel` slot (ViewKind `detail`).
 * Props (1.1.0 contract): `{ slug; onDeleted?; onRenamed? }`. The host injects ONLY
 * `slug`; the panel loads the entity with `useGetBySlug` and renders the loading and
 * "not found" states (`ac-detailpanel-usegetbyslug`). `onDeleted?`/`onRenamed?` are
 * OPTIONAL panel→host notifications — call them ONLY when the panel performs its own
 * inline delete/rename, so the host can refresh the list/breadcrumb.
 *
 * There is NO `onBack`: back is owned by the host `DetailPanelShell` breadcrumb, not a
 * panel prop. Cross-entity/section navigation goes through the host `editorBridge`
 * singleton (`editorBridge.openEntity/openSection`, same as `render-card`/`render-chip`),
 * never through injected `onOpenEntity`/`onOpenPage` props.
 *
 * NOTE: the 1.1.0 shape is declared locally — the installed `@c4s/plugin-runtime`
 * still ships the 1.0.0 `EntityDetailProps` (required `onBack`); see the patch
 * `v0-0-4-to-v0-0-5-pages-host-types-not-shipped.md`.
 *
 * Framed with the Host UI Kit (`@c4s/plugin-runtime/ui`): `DetailPanelShell` (frame +
 * breadcrumb — NO `title` prop; the header is the last breadcrumb segment) and
 * `FieldGrid`/`FieldRow` (`FieldRow` takes its value as `children`).
 */

import type { FC } from 'react';
import { DetailPanelShell, FieldGrid, FieldRow } from '@c4s/plugin-runtime/ui';
import { useGetBySlug } from './hooks';

// Local 1.1.0 props contract: the host injects only `slug`; the callbacks are
// optional panel→host notifications.
type EntityDetailProps = {
  slug: string;
  onDeleted?: () => void;
  onRenamed?: (newSlug: string) => void;
};

export const ExampleEntityDetail: FC<EntityDetailProps> = ({ slug }) => {
  const { data: entity, isLoading } = useGetBySlug(slug);

  if (isLoading) return <div className="c4s-detail__loading">Loading…</div>;
  if (!entity) {
    return (
      <div className="c4s-detail__not-found" role="alert" style={{ color: 'var(--c-muted, #6b7280)' }}>
        Not found: <code>{slug}</code>
      </div>
    );
  }

  return (
    <DetailPanelShell
      // Single current-entity crumb, no back hop: back is host-owned
      // (`DetailPanelShell`), the panel does not build an `onBack` breadcrumb.
      breadcrumb={[{ label: entity.name ?? slug }]}
    >
      <FieldGrid>
        <FieldRow label="Slug">
          <code>{entity.slug}</code>
        </FieldRow>
        <FieldRow label="Name">{entity.name}</FieldRow>
        {entity.description ? <FieldRow label="Description">{entity.description}</FieldRow> : null}
        <FieldRow label="Updated">{entity.updatedAt}</FieldRow>
      </FieldGrid>
      {/* TODO: an inline edit/delete form would call the OPTIONAL notifications
          `onRenamed?`/`onDeleted?` after its own mutation; the destructive delete
          CONFIRM stays host-owned. Cross-entity/section nav uses the host
          `editorBridge` singleton (`openEntity`/`openSection`), not props. */}
    </DetailPanelShell>
  );
};
