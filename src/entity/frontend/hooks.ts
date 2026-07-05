/**
 * Frontend data-resolution slots. The render slots and screens are PURELY
 * presentational — they NEVER call the API directly; they go through these hooks
 * (`ac-render-presentational`). Project-scoped: requests hit
 * `/api/projects/<id>/example-entities`.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateExampleEntityRequest,
  ExampleEntityListItem,
  ExampleEntitySnapshot,
  UpdateExampleEntityRequest,
} from '../dto';

/** Resolve the current project id from the host-provided global (default `default`). */
function apiBase(): string {
  const projectId =
    (globalThis as { __C4S_PROJECT__?: { id?: string } }).__C4S_PROJECT__?.id ?? 'default';
  return `/api/projects/${projectId}/example-entities`;
}

/**
 * Load one entity by slug. Three states the detail panel discriminates on:
 * `data === undefined` → not yet resolved (loading/disabled), `data === null` →
 * resolved but not found (404), otherwise the snapshot. NOTE: do NOT coerce
 * `undefined → null` — the panel relies on the distinction to pick skeleton vs
 * empty state.
 */
export function useGetBySlug(slug: string | null): {
  data: ExampleEntitySnapshot | null | undefined;
  isLoading: boolean;
} {
  const query = useQuery({
    queryKey: ['example-entity', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const res = await fetch(`${apiBase()}/${encodeURIComponent(String(slug))}`);
      if (res.status === 404 || !res.ok) return null;
      return (await res.json()) as ExampleEntitySnapshot;
    },
  });
  return { data: query.data as ExampleEntitySnapshot | null | undefined, isLoading: query.isLoading };
}

/** Full list items for the list screen (the lightweight projection, no `data`). */
export function useExampleEntityList(): { data: ExampleEntityListItem[]; isLoading: boolean } {
  const query = useQuery({
    queryKey: ['example-entity', '__list__'],
    queryFn: async () => {
      const res = await fetch(apiBase());
      if (!res.ok) return [] as ExampleEntityListItem[];
      return (await res.json()) as ExampleEntityListItem[];
    },
  });
  return { data: (query.data as ExampleEntityListItem[]) ?? [], isLoading: query.isLoading };
}

/**
 * Turn a failed `Response` into an `Error` — prefer the server's `error`/`message`
 * field, else fall back to a status-based line. Shared by the write mutations so
 * their `error` surfaces uniformly (`FormShell.error`, delete-dialog error line).
 */
async function toError(res: Response, fallback: string): Promise<Error> {
  let message = `${fallback} (${res.status})`;
  try {
    const payload = (await res.json()) as { error?: unknown; message?: unknown };
    const detail = payload?.error ?? payload?.message;
    if (typeof detail === 'string' && detail.trim()) message = detail;
  } catch {
    // Non-JSON body — keep the status-based message.
  }
  return new Error(message);
}

/**
 * Create mutation for the list-screen modal (`example-entity-create-dialog`). The
 * Host UI Kit supplies no mutation — `FormShell.onSubmit` calls THIS. POSTs the
 * create body (`slug = slugify(name)` is derived server-side), then invalidates
 * the `['example-entity']` key prefix so the list (and any open detail) refetch.
 * `error` / `isPending` drive `FormShell.error` / `FormShell.busy`.
 */
export function useCreateExampleEntity() {
  const queryClient = useQueryClient();
  return useMutation<ExampleEntitySnapshot, Error, CreateExampleEntityRequest>({
    mutationFn: async (body) => {
      const res = await fetch(apiBase(), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw await toError(res, 'Create failed');
      return (await res.json()) as ExampleEntitySnapshot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['example-entity'] });
    },
  });
}

/**
 * Update mutation for the detail panel's manual "Zapisz" — the save model is
 * PLUGIN-owned; the host provides no mutation. PATCHes `/:slug` with a partial
 * body; a `name` edit alone does NOT move the slug, so the panel passes an
 * explicit `newSlug` (derived `slugify`) when it wants the rename. Returns the
 * fresh snapshot (its `slug` may differ → the panel calls `onRenamed?`). Invalidates
 * the `['example-entity']` prefix so the list and any open detail refetch.
 */
export function useUpdateExampleEntity() {
  const queryClient = useQueryClient();
  return useMutation<ExampleEntitySnapshot, Error, { slug: string; body: UpdateExampleEntityRequest }>({
    mutationFn: async ({ slug, body }) => {
      const res = await fetch(`${apiBase()}/${encodeURIComponent(slug)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw await toError(res, 'Save failed');
      return (await res.json()) as ExampleEntitySnapshot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['example-entity'] });
    },
  });
}

/**
 * Delete mutation for the detail panel's inline "Usuń". The panel owns the
 * destructive confirm (host `EntityDetailToolbar` is not shipped — see the
 * `entity-detail-toolbar-not-shipped` patch); on success it calls `onDeleted?`.
 * DELETE `/:slug` returns 204 (no body). Invalidates the `['example-entity']` prefix.
 */
export function useDeleteExampleEntity() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { slug: string }>({
    mutationFn: async ({ slug }) => {
      const res = await fetch(`${apiBase()}/${encodeURIComponent(slug)}`, { method: 'DELETE' });
      if (!res.ok) throw await toError(res, 'Delete failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['example-entity'] });
    },
  });
}

/** Resolve slug refs filtered by tags (`and` | `or`, default `or`) — host slot. */
export async function listByTags(args: {
  tags: string[];
  filter: 'and' | 'or';
}): Promise<Array<{ slug: string }>> {
  const params = new URLSearchParams();
  if (args.tags.length) params.set('tags', args.tags.join(','));
  params.set('filter', args.filter);
  const res = await fetch(`${apiBase()}?${params.toString()}`);
  if (!res.ok) return [];
  const items = (await res.json()) as ExampleEntityListItem[];
  return items.map((i) => ({ slug: i.slug }));
}
