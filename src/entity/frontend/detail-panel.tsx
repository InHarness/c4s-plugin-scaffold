/**
 * L8/L5 — entity detail panel (sidebar). Props (1.0.0 contract):
 * `{ slug, onDeleted, onRenamed, onBack }`. Here (unlike chip/card/row) you only get
 * `slug` + navigation callbacks — fetch the data with the `use__EntityName__BySlug` hook.
 *
 * The view is framed with the Host UI Kit (`stable` core): `DetailPanelShell` for the
 * frame + breadcrumb, `FieldGrid`/`FieldRow` for the entity's fields. The kit is
 * pure-presentational — the plugin still owns the fetch (the hook below). These
 * components count into `hostApiVersion`; a prop mismatch is gated at build time.
 */

import * as React from 'react';
import type { EntityDetailProps } from '../../host';
import { DetailPanelShell, FieldGrid, FieldRow } from '../../host';
import { use__EntityName__BySlug } from './hooks';

export const __EntityName__Detail: React.FC<EntityDetailProps> = ({
  slug,
  onDeleted,
  onRenamed,
  onBack,
}) => {
  const { data, isLoading } = use__EntityName__BySlug(slug);
  const record = data as { title?: string } | null | undefined;

  if (isLoading) return <div>Loading…</div>;
  if (!record) return <div role="alert">Not found: {slug}</div>;

  return (
    <DetailPanelShell
      breadcrumb={[
        { label: '__ENTITY_TITLE__', onClick: onBack },
        { label: record.title ?? slug /* TODO: label field */ },
      ]}
    >
      <FieldGrid>
        <FieldRow label="Slug">{slug}</FieldRow>
        {/* TODO: pola swojej encji — <FieldRow label="...">{value}</FieldRow> */}
      </FieldGrid>
      {/* TODO: edit the entity's fields; on slug change call onRenamed(newSlug), on delete call onDeleted() */}
      <p style={{ opacity: 0.6 }}>TODO: edit form. (available callbacks: onDeleted, onRenamed)</p>
      {/* Reference the callbacks so they count as "used" in the stub: */}
      <span hidden>{String(Boolean(onDeleted) && Boolean(onRenamed))}</span>
    </DetailPanelShell>
  );
};
