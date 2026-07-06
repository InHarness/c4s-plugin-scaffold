/**
 * M05 — the page routes this module owns (the `routes` slot / `RouteTreeFragment`).
 * The list SCREEN (`/example-entities`) and the detail SCREEN (`/example-entities/:slug`)
 * are a COMPOSITION, not render slots: the host calls the fragment once at mount and
 * adds the routes to its single router.
 *
 * The list screen composes the Host UI Kit — `EntityListLayout` (wrapper) with
 * `EntityListHeader` (type `icon` + title + search) in its header — the `icon` is
 * the SAME reference as `sidebarTab.icon`
 * (`ac-entitylistheader-renderuje-ikone-typu-en`) — `TagFilterBar` (tag filter),
 * and rows via `EntityListRow` (through `ExampleEntityRow`), NOT the `renderRow`
 * slot directly (`ac-list-screen-entitylistrow`). Loading and empty states render
 * through the kit's `LoadingState` / `EmptyState` — never custom markup
 * (`ac-ekran-listy-renderuje-stan-pustki-brak`). Data comes from the hooks only
 * (`ac-render-presentational`).
 *
 * The header's `actions` slot carries a CREATE button composed from `ActionButton`
 * (the host ships none) that opens the create modal (`ExampleEntityCreateDialog`,
 * ui-view `example-entity-create-dialog`) — its open state is held locally here.
 *
 * `search`/`tags`/`filter` are synced to the URL's query params (the ui-view's
 * documented contract), not local-only state — read via `useSearch({strict:
 * false})` and written via `navigate({search: ...})`, the same loose-typing
 * escape hatch already used for `slug` below.
 *
 * The `@tanstack/react-router` boundary is intentionally opaque in the Host API
 * (`RouteTreeFragment` works with `AnyRoute = unknown`), so the route factory and
 * navigation are loosely typed here.
 */

import type { FC, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { createRoute, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { ActionButton, EmptyState, EntityListHeader, EntityListLayout, LoadingState, TagFilterBar } from '@c4s/plugin-runtime/ui';
import type { Tag } from '@c4s/plugin-runtime/ui';
import type { RouteTreeFragment } from '@c4s/plugin-runtime';
import { useTags } from '@c4s/plugin-runtime';
import { EXAMPLE_ENTITY_LABEL_PLURAL, EXAMPLE_ENTITY_PATH_PREFIX, EXAMPLE_ENTITY_TYPE } from '../../identity';
import { useExampleEntityList } from './hooks';
import { navigateToEntity } from './navigation';
import type { Navigate } from './navigation';
import { ExampleEntityIcon } from './icon';
import { ExampleEntityRow } from './render-row';
import { ExampleEntityCreateDialog } from './create-dialog';
import { ExampleEntityDetail } from './detail-panel';
import type { ExampleEntitySnapshot } from '../dto';

const Pane: FC<{ children: ReactNode }> = ({ children }) => (
  <main style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'auto', background: 'var(--c-bg, #fff)' }}>
    {children}
  </main>
);

/** The list screen's `search`/`tags`/`filter` query-param contract (all optional). */
type ListSearch = { search?: string; tags?: string; filter?: 'and' | 'or' };

function ExampleEntityListRoute(): JSX.Element {
  const navigate = useNavigate() as Navigate;
  const { data, isLoading } = useExampleEntityList();

  // `search`/`tags`/`filter` are synced to the URL, not local-only state — same
  // `strict: false` loose-typing escape hatch already used for `slug` in the
  // detail route, since the `@tanstack/react-router` boundary is intentionally
  // opaque here (see the file header comment).
  const routeSearch = useSearch({ strict: false }) as ListSearch;
  const search = routeSearch.search ?? '';
  const selectedTags = useMemo(
    () => (routeSearch.tags ? routeSearch.tags.split(',').filter(Boolean) : []),
    [routeSearch.tags],
  );
  const tagMode: 'and' | 'or' = routeSearch.filter === 'and' ? 'and' : 'or';

  const updateSearch = useCallback(
    (patch: Partial<ListSearch>) =>
      navigate({ search: (prev: ListSearch) => ({ ...prev, ...patch }), replace: true } as never),
    [navigate],
  );
  const setSearch = useCallback((next: string) => updateSearch({ search: next || undefined }), [updateSearch]);
  const toggleTag = useCallback(
    (slug: string) => {
      const next = selectedTags.includes(slug) ? selectedTags.filter((s) => s !== slug) : [...selectedTags, slug];
      updateSearch({ tags: next.length ? next.join(',') : undefined });
    },
    [selectedTags, updateSearch],
  );
  const clearTags = useCallback(() => updateSearch({ tags: undefined }), [updateSearch]);
  const toggleMode = useCallback(() => {
    const next: 'and' | 'or' = tagMode === 'and' ? 'or' : 'and';
    // Keep the URL clean at the default (`or`) rather than always writing `filter`.
    updateSearch({ filter: next === 'or' ? undefined : next });
  }, [tagMode, updateSearch]);

  // CREATE-modal open state lives locally; a successful create invalidates the
  // list query inside the mutation hook, so no success callback is wired here.
  // `closeCreate` is stabilized so the modal's focus-management effect (keyed on
  // `onClose`) does not re-run — and steal focus — on every keystroke.
  const [createOpen, setCreateOpen] = useState(false);
  const closeCreate = useCallback(() => setCreateOpen(false), []);

  // Tag universe comes from the host's tag catalog narrowed to tags actually
  // used on `example-entity` items (`counts[EXAMPLE_ENTITY_TYPE] > 0`) — the
  // bar stays hidden (below) when THIS list's entities carry no tags, not
  // merely when the project has none at all. `useTags()`'s `TagListItem` (from
  // `@c4s/plugin-runtime`) lacks `createdAt`/`updatedAt` present on `Tag` (from
  // `@c4s/plugin-runtime/ui`) even though they're meant to be the same shape —
  // a host type-surface drift; `TagFilterBar`/`EntityListRow` never read either
  // field, so the assertion is safe (see the filed patch for the upstream gap).
  const tagCatalog = useTags();
  const tagUniverse = useMemo<Tag[]>(
    () => ((tagCatalog.data ?? []) as Tag[]).filter((t) => (t.counts[EXAMPLE_ENTITY_TYPE] ?? 0) > 0),
    [tagCatalog.data],
  );
  // Rows' chip lookup is derived from the same universe, not built ad hoc per row.
  const tagLookup = useMemo(() => new Map(tagUniverse.map((t) => [t.slug, t] as const)), [tagUniverse]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((it) => {
      const matchesSearch =
        !q || it.name.toLowerCase().includes(q) || (it.description ?? '').toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (selectedTags.length === 0) return true;
      const itemTags = it.tags ?? [];
      return tagMode === 'and'
        ? selectedTags.every((t) => itemTags.includes(t))
        : selectedTags.some((t) => itemTags.includes(t));
    });
  }, [data, search, selectedTags, tagMode]);

  return (
    <Pane>
      <EntityListLayout
        header={
          <>
            <EntityListHeader
              // Same reference as `sidebarTab.icon` — the type icon in the list
              // header (`ac-entitylistheader-renderuje-ikone-typu-en`).
              icon={ExampleEntityIcon}
              title={EXAMPLE_ENTITY_LABEL_PLURAL}
              count={filtered.length}
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by name…"
              // Host ships no CREATE button — compose it from `ActionButton`.
              actions={<ActionButton label="Create" variant="primary" onClick={() => setCreateOpen(true)} />}
            />
            {/* A sibling row below the header, not the header's `filters` slot —
                `TagFilterBar` is a full self-bordered strip (host's own list
                pages stack it the same way), not a compact inline control. */}
            {tagUniverse.length > 0 && (
              <TagFilterBar
                tags={tagUniverse}
                tagFilter={selectedTags}
                onTagToggle={toggleTag}
                tagMode={tagMode}
                onToggleMode={toggleMode}
                onClear={clearTags}
              />
            )}
          </>
        }
      >
        {isLoading ? (
          <LoadingState lines={6} />
        ) : filtered.length === 0 ? (
          data.length === 0 ? (
            <EmptyState title="No example entities yet." hint="Create your first one to get started." />
          ) : (
            <EmptyState title="No matching example entities." hint="Try clearing the search or tag filter." />
          )
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
                tags={item.tags ?? []}
                tagLookup={tagLookup}
                onOpen={() => navigateToEntity(navigate, EXAMPLE_ENTITY_TYPE, item.slug)}
              />
            ))}
          </div>
        )}
      </EntityListLayout>
      {/* Controlled create modal — `position: fixed`, so it overlays regardless of nesting. */}
      <ExampleEntityCreateDialog open={createOpen} onClose={closeCreate} />
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
        // `key={slug}` resets the panel's draft when navigating between entities.
        key={slug}
        slug={slug}
        // No `onBack`: back is host-owned (`DetailPanelShell` breadcrumb). The
        // wrapper stands in for the host's list/breadcrumb refresh, wiring the
        // OPTIONAL `onDeleted?`/`onRenamed?` notifications to router navigation.
        onDeleted={() => navigate({ to: EXAMPLE_ENTITY_PATH_PREFIX })}
        onRenamed={(newSlug) => navigateToEntity(navigate, EXAMPLE_ENTITY_TYPE, newSlug, { replace: true })}
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
