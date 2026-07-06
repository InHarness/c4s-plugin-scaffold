/**
 * L8 — single list ROW. PURE REACT; the host injects the resolved `entity` (rows
 * never self-fetch). The host calls it once per entity inside its own list views,
 * and the plugin's list screen reuses it (see `routes.tsx`).
 *
 * Rendered through the Host UI Kit `EntityListRow` (M34, experimental tier) rather
 * than hand-written markup — which is what `ac-list-screen-entitylistrow` asks for.
 * `EntityListRow` needs `tags` (slugs) + a `tagLookup` Map (slug → Tag) to draw tag
 * chips. Both are optional props here, sourced from the list DTO/screen — NOT built
 * locally — so a derived plugin with tagged entities gets real chips just by
 * populating them; the scaffold's data model carries no tags, so both default to
 * empty when the caller (host `renderRow` slot, or the plugin's own list screen)
 * doesn't supply them.
 */

import type { FC } from 'react';
import { EntityListRow } from '@c4s/plugin-runtime/ui';
import type { Tag } from '@c4s/plugin-runtime/ui';
import type { EntityRowProps } from '@c4s/plugin-runtime';
import { ExampleEntityIcon } from './icon';
import type { ExampleEntitySnapshot } from '../dto';

const EMPTY_TAG_LOOKUP = new Map<string, Tag>();

type ExampleEntityRowProps = EntityRowProps<ExampleEntitySnapshot> & {
  tags?: string[];
  tagLookup?: Map<string, Tag>;
};

export const ExampleEntityRow: FC<ExampleEntityRowProps> = ({ entity, onOpen, tags, tagLookup }) => {
  return (
    <EntityListRow
      // Same shared icon reference as the header/sidebar; accent-tinted to match
      // the host's builtin rows (colors always via `var(--c-*)` tokens).
      leading={<ExampleEntityIcon size={16} style={{ color: 'var(--c-accent)' }} />}
      onClick={onOpen ?? (() => {})}
      tags={tags ?? []}
      tagLookup={tagLookup ?? EMPTY_TAG_LOOKUP}
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
