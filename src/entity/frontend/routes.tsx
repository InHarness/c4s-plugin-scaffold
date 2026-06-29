/**
 * M05 — the page routes this module owns (the `routes` slot / `RouteTreeFragment`).
 * The list SCREEN (`/example-entities`) and the detail SCREEN (`/example-entities/:slug`)
 * are a COMPOSITION, not render slots: the host calls the fragment once at mount and
 * adds the routes to its single router.
 *
 * The list screen composes the Host UI Kit — `EntityListHeader` (title + search),
 * `TagFilterBar` (tag filter), and rows via `EntityListRow` (through `ExampleEntityRow`),
 * NOT the `renderRow` slot directly (`ac-list-screen-entitylistrow`). Data comes from
 * the hooks only (`ac-render-presentational`).
 *
 * The `@tanstack/react-router` boundary is intentionally opaque in the Host API
 * (`RouteTreeFragment` works with `AnyRoute = unknown`), so the route factory and
 * navigation are loosely typed here.
 */

import type { FC, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { createRoute, useNavigate, useParams } from '@tanstack/react-router';
import { EntityListHeader, TagFilterBar } from '@c4s/plugin-runtime/ui';
import type { Tag } from '@c4s/plugin-runtime/ui';
import type { RouteTreeFragment } from '@c4s/plugin-runtime';
import { EXAMPLE_ENTITY_LABEL_PLURAL, EXAMPLE_ENTITY_PATH_PREFIX } from '../../identity';
import { useExampleEntityList } from './hooks';
import { ExampleEntityRow } from './render-row';
import { ExampleEntityDetail } from './detail-panel';
import type { ExampleEntitySnapshot } from '../dto';

const Pane: FC<{ children: ReactNode }> = ({ children }) => (
  <main style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'auto', background: 'var(--c-bg, #fff)' }}>
    {children}
  </main>
);

// Loose-typed view of the host router (the contract leaves routes opaque).
type Navigate = (opts: { to: string; params?: Record<string, string>; replace?: boolean }) => void;

function ExampleEntityListRoute(): JSX.Element {
  const navigate = useNavigate() as Navigate;
  const { data, isLoading } = useExampleEntityList();
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagMode, setTagMode] = useState<'and' | 'or'>('or');

  // The scaffold's list DTO carries no tags, so the tag universe is empty and the
  // TagFilterBar stays hidden; a derived plugin with tagged entities populates it.
  const tagUniverse = useMemo<Tag[]>(() => [], []);
  const toggleTag = useCallback(
    (slug: string) =>
      setSelectedTags((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug])),
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter(
      (it) => !q || it.name.toLowerCase().includes(q) || (it.description ?? '').toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <Pane>
      <EntityListHeader
        title={EXAMPLE_ENTITY_LABEL_PLURAL}
        count={filtered.length}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name…"
      />
      {tagUniverse.length ? (
        <TagFilterBar
          tags={tagUniverse}
          tagFilter={selectedTags}
          onTagToggle={toggleTag}
          tagMode={tagMode}
          onToggleMode={() => setTagMode((m) => (m === 'and' ? 'or' : 'and'))}
          onClear={() => setSelectedTags([])}
        />
      ) : null}
      {isLoading ? (
        <div style={{ padding: 16, color: 'var(--c-muted, #6b7280)' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 16, color: 'var(--c-muted, #6b7280)' }}>
          {data.length === 0 ? 'No example entities yet.' : 'No matching example entities.'}
        </div>
      ) : (
        <div role="list" style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map((item) => (
            <ExampleEntityRow
              key={item.slug}
              slug={item.slug}
              entity={
                {
                  slug: item.slug,
                  name: item.name,
                  description: item.description,
                  createdAt: '',
                  updatedAt: item.updatedAt,
                } as ExampleEntitySnapshot
              }
              onOpen={() => navigate({ to: `${EXAMPLE_ENTITY_PATH_PREFIX}/$slug`, params: { slug: item.slug } })}
            />
          ))}
        </div>
      )}
    </Pane>
  );
}

function ExampleEntityDetailRoute(): JSX.Element {
  const navigate = useNavigate() as Navigate;
  const params = useParams({ strict: false }) as { slug?: string };
  const slug = String(params.slug ?? '');
  return (
    <Pane>
      <ExampleEntityDetail
        slug={slug}
        onBack={() => navigate({ to: EXAMPLE_ENTITY_PATH_PREFIX })}
        onDeleted={() => navigate({ to: EXAMPLE_ENTITY_PATH_PREFIX })}
        onRenamed={(newSlug) =>
          navigate({ to: `${EXAMPLE_ENTITY_PATH_PREFIX}/$slug`, params: { slug: newSlug }, replace: true })
        }
      />
    </Pane>
  );
}

/** Build the list + detail routes under the host root route. */
export const exampleEntityRoutes: RouteTreeFragment = ({ rootRoute }) => {
  const make = createRoute as unknown as (opts: {
    getParentRoute: () => unknown;
    path: string;
    component: FC;
  }) => unknown;

  const listRoute = make({
    getParentRoute: () => rootRoute,
    path: EXAMPLE_ENTITY_PATH_PREFIX,
    component: ExampleEntityListRoute,
  });
  const detailRoute = make({
    getParentRoute: () => rootRoute,
    path: `${EXAMPLE_ENTITY_PATH_PREFIX}/$slug`,
    component: ExampleEntityDetailRoute,
  });
  return [listRoute, detailRoute];
};
