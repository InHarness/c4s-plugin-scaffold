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
import { ExampleEntityIcon } from './icon';
import type { ExampleEntitySnapshot } from '../dto';

export const ExampleEntityRow: FC<EntityRowProps<ExampleEntitySnapshot>> = ({ entity, onOpen }) => {
  // The scaffold's DTO carries no tags, so the chip strip stays empty; a derived
  // plugin with tagged entities populates `tags` + `tagLookup`.
  const tagLookup = useMemo(() => new Map<string, Tag>(), []);
  return (
    <EntityListRow
      // Same shared icon reference as the header/sidebar; accent-tinted to match
      // the host's builtin rows (colors always via `var(--c-*)` tokens).
      leading={<ExampleEntityIcon size={16} style={{ color: 'var(--c-accent)' }} />}
      onClick={onOpen ?? (() => {})}
      tags={[]}
      tagLookup={tagLookup}
      // Paper-scale slug badge — 10.5px `font-mono`, panel/muted tokens.
      trailing={
        <span
          className="font-mono text-[10.5px] px-1.5 py-0.5 rounded"
          style={{ background: 'var(--c-panel)', color: 'var(--c-muted)' }}
        >
          {entity.slug}
        </span>
      }
    >
      <div className="flex items-center gap-2">
        <span className="text-[14px]" style={{ color: 'var(--c-ink)', fontWeight: 500 }}>
          {entity.name ?? entity.slug}
        </span>
      </div>
      {entity.description ? (
        <div className="text-[12.5px] truncate mt-0.5" style={{ color: 'var(--c-muted)' }}>
          {entity.description}
        </div>
      ) : null}
    </EntityListRow>
  );
};
