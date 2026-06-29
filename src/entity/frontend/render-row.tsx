/**
 * L8 — single list ROW. PURE REACT; the host injects the resolved `entity` (rows
 * never self-fetch). The host calls it once per entity inside its own list views,
 * and the plugin's list screen reuses it (see `routes.tsx`).
 *
 * Rendered through the Host UI Kit `EntityListRow` (M34, experimental tier) rather
 * than hand-written markup — which is what `ac-list-screen-entitylistrow` asks for.
 * `EntityListRow` needs a `tagLookup` Map (slug → Tag) to draw tag chips; the
 * scaffold's data model carries no tags, so the lookup is empty (a derived plugin
 * with tagged entities populates it).
 */

import type { FC } from 'react';
import { useMemo } from 'react';
import { EntityListRow } from '@c4s/plugin-runtime/ui';
import type { Tag } from '@c4s/plugin-runtime/ui';
import type { EntityRowProps } from '@c4s/plugin-runtime';
import type { ExampleEntitySnapshot } from '../dto';

const mutedStyle = { color: 'var(--c-muted, #6b7280)' };

export const ExampleEntityRow: FC<EntityRowProps<ExampleEntitySnapshot>> = ({ entity, onOpen }) => {
  const tagLookup = useMemo(() => new Map<string, Tag>(), []);
  return (
    <EntityListRow
      leading={<span aria-hidden="true">▦</span>}
      onClick={onOpen ?? (() => {})}
      tags={[]}
      tagLookup={tagLookup}
    >
      <span>{entity.name ?? entity.slug}</span>
      {entity.description ? <span style={mutedStyle}> — {entity.description}</span> : null}
    </EntityListRow>
  );
};
