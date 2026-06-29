/**
 * M05 / L8 — detail panel. Fills the REQUIRED `detailPanel` slot (ViewKind `detail`).
 * Props (1.0.0 contract): `{ slug, onDeleted, onRenamed, onBack }` — only the slug +
 * navigation callbacks; the data is fetched with `useGetBySlug`. Renders the loading
 * and "not found" states (`ac-detailpanel-usegetbyslug`).
 *
 * Framed with the Host UI Kit (`@c4s/plugin-runtime/ui`): `DetailPanelShell` (frame +
 * breadcrumb — NO `title` prop; the header is the last breadcrumb segment) and
 * `FieldGrid`/`FieldRow` (`FieldRow` takes its value as `children`).
 */

import type { FC } from 'react';
import { DetailPanelShell, FieldGrid, FieldRow } from '@c4s/plugin-runtime/ui';
import type { EntityDetailProps } from '@c4s/plugin-runtime';
import { EXAMPLE_ENTITY_LABEL_PLURAL } from '../../identity';
import { useGetBySlug } from './hooks';

export const ExampleEntityDetail: FC<EntityDetailProps> = ({ slug, onBack }) => {
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
      breadcrumb={[{ label: EXAMPLE_ENTITY_LABEL_PLURAL, onClick: onBack }, { label: entity.name ?? slug }]}
    >
      <FieldGrid>
        <FieldRow label="Slug">
          <code>{entity.slug}</code>
        </FieldRow>
        <FieldRow label="Name">{entity.name}</FieldRow>
        {entity.description ? <FieldRow label="Description">{entity.description}</FieldRow> : null}
        <FieldRow label="Updated">{entity.updatedAt}</FieldRow>
      </FieldGrid>
      {/* TODO: an edit form would call the host's mutation flow (onRenamed/onDeleted). */}
    </DetailPanelShell>
  );
};
