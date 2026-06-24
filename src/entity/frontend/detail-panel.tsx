/**
 * L8/L5 — entity detail panel (sidebar). Props (1.0.0 contract):
 * `{ slug, onDeleted, onRenamed, onBack }`. Here (unlike chip/card/row) you only get
 * `slug` + navigation callbacks — fetch the data with the `use__EntityName__BySlug` hook.
 */

import * as React from 'react';
import type { EntityDetailProps } from '../../host';
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
    <section>
      <button type="button" onClick={onBack}>
        ← Back
      </button>
      <h2>{record.title ?? slug /* TODO: label field */}</h2>
      {/* TODO: edit the entity's fields; on slug change call onRenamed(newSlug), on delete call onDeleted() */}
      <p style={{ opacity: 0.6 }}>TODO: edit form. (available callbacks: onDeleted, onRenamed)</p>
      {/* Reference the callbacks so they count as "used" in the stub: */}
      <span hidden>{String(Boolean(onDeleted) && Boolean(onRenamed))}</span>
    </section>
  );
};
