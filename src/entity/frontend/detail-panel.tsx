/**
 * M05 / L8 — detail panel. Fills the REQUIRED `detailPanel` slot (ViewKind `detail`) —
 * the ONLY ViewKind that is a screen. Props (1.1.0 contract): `{ slug; onDeleted?;
 * onRenamed? }`. The host injects ONLY `slug`; the panel loads the entity with
 * `useGetBySlug`, holds a local DRAFT, calls the plugin's OWN mutations, and renders
 * the three data states — `data === undefined` → skeleton (`LoadingState`),
 * `data === null` → not found (`EmptyState`), otherwise the editable form.
 *
 * `onDeleted?`/`onRenamed?` are OPTIONAL panel→host notifications, called ONLY when
 * the panel performs its own inline delete/rename so the host can refresh the
 * list/breadcrumb. `onRenamed?(newSlug)` fires ONLY when a save actually moved the
 * slug (`name` edit → new `slugify`); a save that leaves the slug untouched does not.
 *
 * Save model is PLUGIN-owned (host is mute on saving): live autosave, debounced
 * 500ms after the last edit — no Save button anywhere. A `currentSlugRef` tracks
 * the entity's live slug across successive renames so a rapid edit-after-rename
 * still PATCHes the right URL before the host remounts the panel via `key={slug}`.
 *
 * Top bar is `DetailPanelShell`'s own breadcrumb + actions slots, factored into the
 * local `ExampleEntityDetailShell`: `breadcrumb` carries two crumbs (list label →
 * current slug); the list crumb's `onClick` is `onBackToList`, supplied by
 * `routes.tsx`'s route wrapper (the one layer that actually holds `useNavigate` —
 * the `detailPanel` slot itself gets no such capability from the host). `actions`
 * holds a `SegmentedControlTabs` Details/History toggle in place of what used to be
 * Save.
 *
 * Details and History are TWO SIBLING ROUTES (`$slug` and `$slug/history`), not an
 * in-panel tab: the shell's `onSwitchView` is real router navigation (built in
 * `routes.tsx` from `navigateToEntity`/`navigateToEntityHistory`), not local state —
 * so History is deep-linkable and Back doesn't land on a stale view. `ExampleEntityDetail`
 * (Details) and `ExampleEntityHistory` (History) each mount their own route component;
 * `ExampleEntityDetailShell` is the shared frame between them.
 *
 * Destructive delete is PLUGIN-owned via a local confirm `Dialog` (not the host's
 * `EntityDetailToolbar`, which is dropped here — its single title+delete row can't
 * produce "large title, then a separate slug/date/delete row").
 *
 * History reads through the published `useVersions`/`useVersionDetail`/
 * `useRestoreVersion` (`@c4s/plugin-runtime`) + `VersionHistory` (ui kit) — the
 * write side that FEEDS this data lives in `../backend/services.ts`. `ExampleEntityHistory`
 * does not itself fetch the entity (the breadcrumb only ever needs `slug`, already the
 * route param) — so a deep-link to history for a nonexistent slug won't show the
 * "Not found" `EmptyState` that the Details route shows; accepted gap for v1.
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
 * Framed with the Host UI Kit (`@c4s/plugin-runtime/ui`): `DetailPanelShell` (frame
 * + breadcrumb/actions), `SegmentedControlTabs` (Details/History), `Dialog` (delete
 * confirm), `VersionHistory` (History pane), `TagPicker` (Tags, `variant="collapsed"`
 * — matches every built-in entity, `ac`/`design-system`/`endpoint`), and
 * `ActionButton`. Description/Tags use the same "section label
 * + full-width content" pattern as the host's own entity pages (`ac`,
 * `design-system`, `endpoint`) — confirmed neither uses `FieldGrid`/`FieldRow` for
 * long-text/list fields — so this file doesn't either; Description is a plain
 * auto-growing `<textarea>` (not `RichTextField`, which shows an unwanted toolbar
 * with no published way to hide it).
 */

import type { CSSProperties, FC, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  useAssignTags,
  useEntityTags,
  useReferences,
  useRemoveEntityTag,
  useRestoreVersion,
  useTags,
  useVersionDetail,
  useVersions,
} from '@c4s/plugin-runtime';
import {
  ActionButton,
  Dialog,
  DetailPanelShell,
  EmptyState,
  LoadingState,
  ReferencesList,
  type ReferencesListItem,
  SegmentedControlTabs,
  TagPicker,
  VersionHistory,
  type VersionHistoryItem,
} from '@c4s/plugin-runtime/ui';
import { EXAMPLE_ENTITY_LABEL_PLURAL, EXAMPLE_ENTITY_TYPE, slugify } from '../../identity';
import type { ExampleEntitySnapshot } from '../dto';
import { useDeleteExampleEntity, useGetBySlug, useUpdateExampleEntity } from './hooks';

/** Entity detail's two sibling views — mirrors the host's own Details/History split. */
type EntityView = 'details' | 'history';

/** Real router navigation between the Details/History sibling routes — see `routes.tsx`. */
type SwitchView = (view: EntityView, opts?: { replace?: boolean }) => void;

// Local 1.1.0 props contract: the host injects only `slug`; the callbacks are
// optional panel→host notifications. `onBackToList`/`onSwitchView` are NOT part of
// the host contract — they're plugin-internal wiring: `routes.tsx`'s route wrapper
// already holds `useNavigate` and passes them down so the breadcrumb's list crumb
// and the Details/History tabs can actually navigate, instead of being dead labels.
type EntityDetailProps = {
  slug: string;
  onDeleted?: () => void;
  onRenamed?: (newSlug: string) => void;
  onBackToList?: () => void;
  onSwitchView?: SwitchView;
};

type Draft = { name: string; description: string };

const AUTOSAVE_DELAY_MS = 500;

const ERROR_STYLE: CSSProperties = { color: 'var(--c-red, #dc2626)', fontSize: 12.5, margin: 0 };

const MUTED_STYLE: CSSProperties = { color: 'var(--c-subtle, #6b7280)', fontSize: 12.5 };

// Matches the host's own entity detail pages (e.g. `design-system`): a centered,
// width-constrained column — not full-bleed — so this page reads consistently
// with the rest of the app.
const HEADER_WRAP_STYLE: CSSProperties = {
  margin: '0 auto',
  maxWidth: 960,
  padding: '48px 56px 0',
};

const TITLE_TEXTAREA_STYLE: CSSProperties = {
  display: 'block',
  width: '100%',
  border: 'none',
  outline: 'none',
  resize: 'none',
  overflow: 'hidden',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: 26,
  fontWeight: 600,
  color: 'var(--c-ink, #111827)',
};

// The row directly under the title: slug + updated-date + saving/edited indicator,
// with Delete pushed to the far right by the `flex: 1` spacer. No separator here —
// the host's own entity pages don't draw one between this row and the title.
const META_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 11,
  color: 'var(--c-subtle, #6b7280)',
  marginTop: 8,
  marginBottom: 16,
};

// Plain, unformatted body text — deliberately NOT the published `RichTextField`
// (always shows a bold/italic/heading/list/table/code toolbar with no supported
// way to hide it) so Description matches the host's own toolbar-less `DocEditor`
// look, not a rich-text editor.
const DESCRIPTION_TEXTAREA_STYLE: CSSProperties = {
  display: 'block',
  width: '100%',
  border: 'none',
  outline: 'none',
  resize: 'none',
  overflow: 'hidden',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: 13.5,
  lineHeight: 1.5,
  color: 'var(--c-ink, #111827)',
};

const DELETE_BUTTON_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: 'var(--c-red, #dc2626)',
  fontSize: 11,
  padding: '2px 6px',
  borderRadius: 4,
};

// Matches the host's own `SectionLabel` exactly (identical in `ac` and
// `design-system`'s detail pages) — no bold, `10.5px`, not `11px`.
const SECTION_HEADING_STYLE: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 10.5,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--c-subtle, #6b7280)',
  margin: '0 0 8px',
};

// Same `960`/`56px` column as `HEADER_WRAP_STYLE` (and the `maxWidth={960}` passed
// to `FieldGrid` below) — content OUTSIDE `FieldGrid` (errors, references, history)
// needs the same horizontal inset to stay aligned; `DetailPanelShell`'s body itself
// has no padding at all.
const CONTENT_WRAP_STYLE: CSSProperties = {
  margin: '0 auto',
  maxWidth: 960,
  padding: '0 56px 56px',
};

const VERSION_DATA_STYLE: CSSProperties = {
  marginTop: 16,
  fontSize: 11,
  whiteSpace: 'pre-wrap',
  color: 'var(--c-subtle, #6b7280)',
};

/**
 * Tags — host-owned, no plugin column. Read via `useEntityTags` (returns tag
 * SLUGS); write via `useAssignTags` (set-całości, takes tag NAMES, auto-creates
 * missing ones) and `useRemoveEntityTag` (removes exactly one, host-side).
 * Rendered through the published `TagPicker` (click-to-toggle chips + create
 * input) — same data layer as before, just the presentation swapped in for the
 * host's own click-to-toggle UX instead of a manual type-a-name-and-click-Add
 * flow. `TagPicker` is a pure controlled component (`allTags`/`selected` in,
 * `onToggle`/`onCreate` out) — data-source-agnostic, so it drops in cleanly on
 * these hooks even though the host's OWN entities wire it to a bespoke
 * per-entity field instead.
 */
/** `MutationLike.error`/`mutate` are host-declared as `unknown`/single-arg — narrow defensively. */
function mutationErrorMessage(error: unknown): string | null {
  if (!error) return null;
  return error instanceof Error ? error.message : 'Tag update failed';
}

const TagsField: FC<{ slug: string }> = ({ slug }) => {
  const catalog = useTags();
  const entityTags = useEntityTags(EXAMPLE_ENTITY_TYPE, slug);
  const assign = useAssignTags();
  const removeTag = useRemoveEntityTag();

  if (entityTags.data === undefined) return <span style={MUTED_STYLE}>Loading tags…</span>;

  const nameBySlug = new Map((catalog.data ?? []).map((t) => [t.slug, t] as const));
  const currentNames = entityTags.data.map((s) => nameBySlug.get(s)?.name ?? s);

  const handleToggle = (tagSlug: string) => {
    if (entityTags.data!.includes(tagSlug)) {
      removeTag.mutate({ type: EXAMPLE_ENTITY_TYPE, slug, tagSlug });
      return;
    }
    const name = nameBySlug.get(tagSlug)?.name ?? tagSlug;
    assign.mutate({ type: EXAMPLE_ENTITY_TYPE, slug, tags: [...currentNames, name] });
  };

  const handleCreate = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || assign.isPending) return;
    const isDuplicate = currentNames.some((n) => n.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) return;
    assign.mutate({ type: EXAMPLE_ENTITY_TYPE, slug, tags: [...currentNames, trimmed] });
  };

  const errorMessage = mutationErrorMessage(assign.error) ?? mutationErrorMessage(removeTag.error);

  return (
    <>
      <TagPicker
        allTags={(catalog.data ?? []).map((t) => ({ slug: t.slug, name: t.name, color: t.color ?? undefined }))}
        selected={entityTags.data}
        onToggle={handleToggle}
        onCreate={handleCreate}
        variant="collapsed"
      />
      {errorMessage ? (
        <p role="alert" style={ERROR_STYLE}>
          {errorMessage}
        </p>
      ) : null}
    </>
  );
};

/**
 * Find references — back-links via the host's generic `useReferences` (bound to
 * `GET /api/references?type=&slug=`), rendered through the kit's own `ReferencesList`
 * (icon + hover row + native loading/empty states) rather than a hand-rolled list.
 * `onOpen` is omitted: `ReferenceHit` carries no anchor, and `editorBridge.openSection`
 * needs one, so entries aren't wired to navigate (unlike the host's own internal
 * reference panels, which use a host-private callback).
 */
const ReferencesSection: FC<{ slug: string }> = ({ slug }) => {
  const references = useReferences(EXAMPLE_ENTITY_TYPE, slug);
  const items: ReferencesListItem[] = (references.data ?? []).map((ref) => ({
    pagePath: ref.pagePath,
    label: `${ref.pagePath}:${ref.line}`,
  }));

  return <ReferencesList references={items} loading={references.isLoading} />;
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * History pane — read-only list of `VersionListItem`s adapted to the kit's
 * `VersionHistoryItem` shape, plus an optional raw-data preview of the selected
 * version (`useVersionDetail`) and a restore action. Feeds entirely off the
 * published version hooks; whether it ever shows rows depends on the backend
 * actually recording versions (`../backend/services.ts`) — see that file's
 * comments for the current host-side limitation.
 */
const HistoryPane: FC<{
  slug: string;
  selectedVersion: number | null;
  onSelectVersion: (version: number | null) => void;
  onRestored: () => void;
}> = ({ slug, selectedVersion, onSelectVersion, onRestored }) => {
  const versions = useVersions(EXAMPLE_ENTITY_TYPE, slug);
  const versionDetail = useVersionDetail(EXAMPLE_ENTITY_TYPE, slug, selectedVersion);
  const restoreVersion = useRestoreVersion();

  const items: VersionHistoryItem[] = (versions.data ?? []).map((v) => ({
    id: String(v.version),
    label: v.changeSummary || `v${v.version} · ${v.op ?? 'update'}`,
    createdAt: formatTimestamp(v.createdAt),
    author: v.changedBy,
  }));

  const handleRestore = (id: string) => {
    restoreVersion
      .mutateAsync({ type: EXAMPLE_ENTITY_TYPE, slug, version: Number(id) })
      .then(() => onRestored())
      .catch(() => undefined); // surfaced via `restoreVersion.error` below
  };

  return (
    <div style={CONTENT_WRAP_STYLE}>
      <VersionHistory
        versions={items}
        activeVersion={selectedVersion != null ? String(selectedVersion) : undefined}
        onSelect={(id) => onSelectVersion(Number(id))}
        onRestore={handleRestore}
      />
      {mutationErrorMessage(restoreVersion.error) ? (
        <p role="alert" style={ERROR_STYLE}>
          {mutationErrorMessage(restoreVersion.error)}
        </p>
      ) : null}
      {selectedVersion != null && versionDetail.data ? (
        <pre style={VERSION_DATA_STYLE}>{JSON.stringify(versionDetail.data.data, null, 2)}</pre>
      ) : null}
    </div>
  );
};

/**
 * Shared frame between the Details and History routes — `DetailPanelShell` +
 * the `SegmentedControlTabs` toggle. `onSwitchView` is real router navigation
 * (built in `routes.tsx`), so clicking the already-active tab is a guarded no-op
 * rather than a redundant navigation.
 */
const ExampleEntityDetailShell: FC<{
  slug: string;
  activeView: EntityView;
  onBackToList?: () => void;
  onSwitchView?: SwitchView;
  children: ReactNode;
}> = ({ slug, activeView, onBackToList, onSwitchView, children }) => (
  <DetailPanelShell
    breadcrumb={[
      { label: EXAMPLE_ENTITY_LABEL_PLURAL, onClick: onBackToList },
      { label: slug },
    ]}
    actions={
      <SegmentedControlTabs
        tabs={[
          { id: 'details', label: 'Details' },
          { id: 'history', label: 'History' },
        ]}
        active={activeView}
        onChange={(id) => {
          const next: EntityView = id === 'history' ? 'history' : 'details';
          if (next === activeView) return;
          onSwitchView?.(next);
        }}
      />
    }
  >
    {children}
  </DetailPanelShell>
);

export const ExampleEntityDetail: FC<EntityDetailProps> = ({
  slug,
  onDeleted,
  onRenamed,
  onBackToList,
  onSwitchView,
}) => {
  const { data: entity } = useGetBySlug(slug);

  // Three states — `undefined` = not yet resolved, `null` = resolved-but-absent.
  if (entity === undefined) return <LoadingState lines={6} />;
  if (entity === null) {
    return <EmptyState title="Not found" hint={<code>{slug}</code>} />;
  }
  // The inner form seeds its draft/baseline once from `entity` via `useState`; the
  // route's `key={slug}` guarantees a fresh mount (and fresh draft) per entity.
  return (
    <ExampleEntityDetailForm
      entity={entity}
      onDeleted={onDeleted}
      onRenamed={onRenamed}
      onBackToList={onBackToList}
      onSwitchView={onSwitchView}
    />
  );
};

/**
 * History route's own component — no `useGetBySlug` fetch (the breadcrumb only
 * ever needs `slug`, already the route param), so a deep-link to history for a
 * nonexistent slug won't show the Details route's "Not found" `EmptyState` —
 * accepted gap for v1 (see file header).
 */
export const ExampleEntityHistory: FC<{
  slug: string;
  onBackToList?: () => void;
  onSwitchView?: SwitchView;
}> = ({ slug, onBackToList, onSwitchView }) => {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  return (
    <ExampleEntityDetailShell
      slug={slug}
      activeView="history"
      onBackToList={onBackToList}
      onSwitchView={onSwitchView}
    >
      <HistoryPane
        slug={slug}
        selectedVersion={selectedVersion}
        onSelectVersion={setSelectedVersion}
        onRestored={() => onSwitchView?.('details', { replace: true })}
      />
    </ExampleEntityDetailShell>
  );
};

const ExampleEntityDetailForm: FC<{
  entity: ExampleEntitySnapshot;
  onDeleted?: () => void;
  onRenamed?: (newSlug: string) => void;
  onBackToList?: () => void;
  onSwitchView?: SwitchView;
}> = ({ entity, onDeleted, onRenamed, onBackToList, onSwitchView }) => {
  const update = useUpdateExampleEntity();
  const del = useDeleteExampleEntity();

  // Draft vs baseline — `dirty` drives only the "edited"/"saving…" indicator now
  // (autosave is unconditional on a debounce tick, not gated behind a Save click).
  const [draft, setDraft] = useState<Draft>({ name: entity.name, description: entity.description ?? '' });
  const [baseline, setBaseline] = useState<Draft>({ name: entity.name, description: entity.description ?? '' });
  const dirty = draft.name !== baseline.name || draft.description !== baseline.description;

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const debounceRef = useRef<number | null>(null);
  // The slug to PATCH against — tracks a rename mid-edit, since `entity.slug` is a
  // stale prop until the host remounts the panel with the new `key`.
  const currentSlugRef = useRef(entity.slug);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  // Auto-grow the title textarea as its content wraps to more lines.
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [draft.name]);

  // Same auto-grow for the plain Description textarea.
  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [draft.description]);

  const scheduleSave = (next: Draft) => {
    // Skip while a name is blank (would `slugify` to an empty/garbage slug) or a
    // mutation is already in flight.
    if (!next.name.trim() || update.isPending || del.isPending) return;
    const nextSlug = slugify(next.name);
    const body = {
      name: next.name,
      description: next.description.trim() || undefined,
      // A `name` edit alone does NOT move the slug server-side — request the rename
      // explicitly, and ONLY when the derived slug actually differs.
      ...(nextSlug !== currentSlugRef.current ? { newSlug: nextSlug } : {}),
    };
    update.mutate(
      { slug: currentSlugRef.current, body },
      {
        onSuccess: (snapshot) => {
          currentSlugRef.current = snapshot.slug;
          setBaseline({ name: snapshot.name, description: snapshot.description ?? '' });
          // Notify the host ONLY on a real slug change (edge-case AC).
          if (snapshot.slug !== entity.slug) onRenamed?.(snapshot.slug);
        },
      },
    );
  };

  const patch = (partial: Partial<Draft>) => {
    setDraft((d) => {
      const next = { ...d, ...partial };
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => scheduleSave(next), AUTOSAVE_DELAY_MS);
      return next;
    });
  };

  const handleDelete = () => {
    if (del.isPending) return;
    del.mutate(
      { slug: currentSlugRef.current },
      {
        onSuccess: () => {
          setDeleteConfirmOpen(false);
          onDeleted?.();
        },
      },
    );
  };

  return (
    <ExampleEntityDetailShell
      slug={entity.slug}
      activeView="details"
      onBackToList={onBackToList}
      onSwitchView={onSwitchView}
    >
      <div style={HEADER_WRAP_STYLE}>
        <textarea
          ref={titleRef}
          value={draft.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Name"
          rows={1}
          style={TITLE_TEXTAREA_STYLE}
        />
        <div style={META_ROW_STYLE}>
          <code>{entity.slug}</code>
          <span>updated {formatTimestamp(entity.updatedAt)}</span>
          {update.isPending ? <span>saving…</span> : dirty ? <span>edited</span> : null}
          <span style={{ flex: 1 }} />
          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={del.isPending}
            style={DELETE_BUTTON_STYLE}
            title="Delete"
          >
            Delete
          </button>
        </div>
      </div>
      <div style={CONTENT_WRAP_STYLE}>
        <div style={{ marginTop: 12 }}>
          <h3 style={SECTION_HEADING_STYLE}>Tags</h3>
          <TagsField slug={entity.slug} />
        </div>
        <div style={{ marginTop: 32 }}>
          <h3 style={SECTION_HEADING_STYLE}>Description</h3>
          <textarea
            ref={descriptionRef}
            value={draft.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="Optional description"
            rows={1}
            style={DESCRIPTION_TEXTAREA_STYLE}
          />
        </div>
        {update.error ? (
          <p role="alert" style={ERROR_STYLE}>
            {update.error.message}
          </p>
        ) : null}
        {del.error ? (
          <p role="alert" style={ERROR_STYLE}>
            {del.error.message}
          </p>
        ) : null}
        <div style={{ marginTop: 32 }}>
          <h3 style={SECTION_HEADING_STYLE}>Find references</h3>
          <ReferencesSection slug={entity.slug} />
        </div>
      </div>
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete entity?"
        footer={
          <>
            <ActionButton label="Cancel" variant="secondary" onClick={() => setDeleteConfirmOpen(false)} />
            <ActionButton
              label={del.isPending ? 'Deleting…' : 'Delete'}
              variant="primary"
              onClick={handleDelete}
              disabled={del.isPending}
            />
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Delete <strong>{draft.name || entity.slug}</strong>? This can’t be undone.
        </p>
      </Dialog>
    </ExampleEntityDetailShell>
  );
};
