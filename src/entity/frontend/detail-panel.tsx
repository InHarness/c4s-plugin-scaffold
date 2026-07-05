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
 * Save model is PLUGIN-owned (host is mute on saving): here the manual "Save"
 * pattern — a draft plus one `useUpdateExampleEntity` mutation, gated on `dirty`
 * (draft vs baseline). (Debounced-autosave is the equally-valid alternative.)
 *
 * Destructive confirm: normally host-owned via the `EntityDetailToolbar` bar — but
 * that host component is NOT shipped yet (see the `entity-detail-toolbar-not-shipped`
 * patch), so this panel renders its OWN inline "Delete" and owns the confirm itself,
 * then calls `onDeleted?` on success.
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
 * breadcrumb — NO `title` prop; the header is the last breadcrumb segment; actions go
 * in `actions`), `FieldGrid`/`FieldRow` (value as `children`), `InlineEditField`
 * (name/description editing), `ActionButton`, and `Dialog` (delete confirm).
 */

import type { CSSProperties, FC } from 'react';
import { useState } from 'react';
import { useAssignTags, useEntityTags, useRemoveEntityTag, useTags } from '@c4s/plugin-runtime';
import {
  ActionButton,
  Badge,
  DetailPanelShell,
  Dialog,
  EmptyState,
  FieldGrid,
  FieldRow,
  InlineEditField,
  LoadingState,
} from '@c4s/plugin-runtime/ui';
import { EXAMPLE_ENTITY_TYPE, slugify } from '../../identity';
import type { ExampleEntitySnapshot } from '../dto';
import { useDeleteExampleEntity, useGetBySlug, useUpdateExampleEntity } from './hooks';

// Local 1.1.0 props contract: the host injects only `slug`; the callbacks are
// optional panel→host notifications.
type EntityDetailProps = {
  slug: string;
  onDeleted?: () => void;
  onRenamed?: (newSlug: string) => void;
};

const ERROR_STYLE: CSSProperties = { color: 'var(--c-red, #dc2626)', fontSize: 12.5, margin: 0 };

const DANGER_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 6,
  padding: '6px 12px',
  fontSize: 12.5,
  fontWeight: 500,
  border: '1px solid transparent',
  background: 'var(--c-red, #dc2626)',
  color: '#fff',
  cursor: 'pointer',
};

const MUTED_STYLE: CSSProperties = { color: 'var(--c-subtle, #6b7280)', fontSize: 12.5 };

/**
 * Tags — host-owned, no plugin column. Read via `useEntityTags` (returns tag
 * SLUGS); write via `useAssignTags` (set-całości, takes tag NAMES, auto-creates
 * missing ones) and `useRemoveEntityTag` (removes exactly one, host-side). The
 * catalog (`useTags`) maps slug → name so a set-replace on add resends the
 * ORIGINAL names, not slugs — otherwise a name with spaces/case would round-trip
 * through assign as a distinct duplicate tag. Writes immediately (no draft/Save):
 * this goes to a different host endpoint than name/description, with its own
 * error/pending state — same pattern as the inline delete below.
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
  const [draftName, setDraftName] = useState('');
  // `MutationLike` exposes no `variables`, so track the in-flight removal ourselves
  // to disable only the Badge being removed (not the whole list) while pending.
  const [removingSlug, setRemovingSlug] = useState<string | null>(null);

  if (entityTags.data === undefined) return <span style={MUTED_STYLE}>Loading tags…</span>;

  const nameBySlug = new Map((catalog.data ?? []).map((t) => [t.slug, t] as const));
  const currentNames = entityTags.data.map((s) => nameBySlug.get(s)?.name ?? s);

  const handleAdd = () => {
    const trimmed = draftName.trim();
    if (!trimmed || assign.isPending) return;
    const isDuplicate = currentNames.some((n) => n.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      setDraftName('');
      return;
    }
    // `MutationLike.mutate` takes no success/error callback — use `mutateAsync` to
    // clear the input only after the write actually lands.
    assign
      .mutateAsync({ type: EXAMPLE_ENTITY_TYPE, slug, tags: [...currentNames, trimmed] })
      .then(() => setDraftName(''))
      .catch(() => undefined); // surfaced via `assign.error` below
  };

  const handleRemove = (tagSlug: string) => {
    setRemovingSlug(tagSlug);
    removeTag
      .mutateAsync({ type: EXAMPLE_ENTITY_TYPE, slug, tagSlug })
      .catch(() => undefined) // surfaced via `removeTag.error` below
      .finally(() => setRemovingSlug(null));
  };

  const errorMessage = mutationErrorMessage(assign.error) ?? mutationErrorMessage(removeTag.error);

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {entityTags.data.map((tagSlug) => (
          <Badge
            key={tagSlug}
            label={nameBySlug.get(tagSlug)?.name ?? tagSlug}
            color={nameBySlug.get(tagSlug)?.color ?? undefined}
            small
            onRemove={removingSlug === tagSlug ? undefined : () => handleRemove(tagSlug)}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add tag…"
          disabled={assign.isPending}
        />
        <ActionButton
          label={assign.isPending ? 'Adding…' : 'Add'}
          onClick={handleAdd}
          disabled={assign.isPending || !draftName.trim()}
        />
      </div>
      {errorMessage ? (
        <p role="alert" style={ERROR_STYLE}>
          {errorMessage}
        </p>
      ) : null}
    </>
  );
};

export const ExampleEntityDetail: FC<EntityDetailProps> = ({ slug, onDeleted, onRenamed }) => {
  const { data: entity } = useGetBySlug(slug);

  // Three states — `undefined` = not yet resolved, `null` = resolved-but-absent.
  if (entity === undefined) return <LoadingState lines={6} />;
  if (entity === null) {
    return <EmptyState title="Not found" hint={<code>{slug}</code>} />;
  }
  // The inner form seeds its draft/baseline once from `entity` via `useState`; the
  // route's `key={slug}` guarantees a fresh mount (and fresh draft) per entity.
  return <ExampleEntityDetailForm entity={entity} onDeleted={onDeleted} onRenamed={onRenamed} />;
};

const ExampleEntityDetailForm: FC<{
  entity: ExampleEntitySnapshot;
  onDeleted?: () => void;
  onRenamed?: (newSlug: string) => void;
}> = ({ entity, onDeleted, onRenamed }) => {
  const update = useUpdateExampleEntity();
  const del = useDeleteExampleEntity();

  // Draft vs baseline — `dirty` gates the manual save. Seeded once from `entity`;
  // re-seeded only on our OWN save success (below), never on a background refetch,
  // so an in-flight edit is never clobbered.
  const [draft, setDraft] = useState({ name: entity.name, description: entity.description ?? '' });
  const [baseline, setBaseline] = useState({ name: entity.name, description: entity.description ?? '' });
  const dirty = draft.name !== baseline.name || draft.description !== baseline.description;

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSave = () => {
    if (!dirty || update.isPending) return;
    const nextSlug = slugify(draft.name);
    const body = {
      name: draft.name,
      description: draft.description.trim() || undefined,
      // A `name` edit alone does NOT move the slug server-side — request the rename
      // explicitly, and ONLY when the derived slug actually differs.
      ...(nextSlug !== entity.slug ? { newSlug: nextSlug } : {}),
    };
    update.mutate(
      { slug: entity.slug, body },
      {
        onSuccess: (snapshot) => {
          setBaseline({ name: snapshot.name, description: snapshot.description ?? '' });
          setDraft({ name: snapshot.name, description: snapshot.description ?? '' });
          // Notify the host ONLY on a real slug change (edge-case AC).
          if (snapshot.slug !== entity.slug) onRenamed?.(snapshot.slug);
        },
      },
    );
  };

  const handleDelete = () => {
    if (del.isPending) return;
    del.mutate(
      { slug: entity.slug },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          onDeleted?.();
        },
      },
    );
  };

  return (
    <DetailPanelShell
      // Single current-entity crumb, no back hop: back is host-owned
      // (`DetailPanelShell`), the panel does not build an `onBack` breadcrumb.
      breadcrumb={[{ label: draft.name || entity.slug }]}
      actions={
        <>
          <ActionButton
            label={update.isPending ? 'Saving…' : 'Save'}
            variant="primary"
            onClick={handleSave}
            disabled={!dirty || update.isPending}
          />
          <ActionButton label="Delete" variant="ghost" onClick={() => setConfirmOpen(true)} />
        </>
      }
    >
      <FieldGrid>
        <FieldRow label="Slug">
          <code>{entity.slug}</code>
        </FieldRow>
        <FieldRow label="Name">
          <InlineEditField
            value={draft.name}
            onCommit={(next) => setDraft((d) => ({ ...d, name: next }))}
            placeholder="Name"
          />
        </FieldRow>
        <FieldRow label="Description">
          <InlineEditField
            value={draft.description}
            onCommit={(next) => setDraft((d) => ({ ...d, description: next }))}
            placeholder="Optional description"
          />
        </FieldRow>
        <FieldRow label="Tags">
          <TagsField slug={entity.slug} />
        </FieldRow>
        <FieldRow label="Updated">{entity.updatedAt}</FieldRow>
      </FieldGrid>
      {update.error ? (
        <p role="alert" style={ERROR_STYLE}>
          {update.error.message}
        </p>
      ) : null}

      {/* Plugin-owned destructive confirm — the panel renders its own inline delete,
          so it OWNS the confirm before the mutation (host-owned confirm applies only
          to the not-yet-shipped `EntityDetailToolbar` bar). */}
      <Dialog
        open={confirmOpen}
        onClose={() => (del.isPending ? undefined : setConfirmOpen(false))}
        title="Delete this entity?"
        size="sm"
        footer={
          <>
            <ActionButton
              label="Cancel"
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={del.isPending}
            />
            <button type="button" onClick={handleDelete} disabled={del.isPending} style={DANGER_STYLE}>
              {del.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 13 }}>
          <code>{entity.slug}</code> will be permanently removed. This cannot be undone.
        </p>
        {del.error ? (
          <p role="alert" style={{ ...ERROR_STYLE, marginTop: 8 }}>
            {del.error.message}
          </p>
        ) : null}
      </Dialog>
    </DetailPanelShell>
  );
};
