/**
 * Frontend data-resolution slots. The render slots and screens are PURELY
 * presentational — they NEVER call the API directly; they go through these hooks
 * (`ac-render-presentational`). Project-scoped: requests hit
 * `/api/projects/<id>/example-entities`.
 */

import { useQuery } from '@tanstack/react-query';
import type { ExampleEntityListItem, ExampleEntitySnapshot } from '../dto';

/** Resolve the current project id from the host-provided global (default `default`). */
function apiBase(): string {
  const projectId =
    (globalThis as { __C4S_PROJECT__?: { id?: string } }).__C4S_PROJECT__?.id ?? 'default';
  return `/api/projects/${projectId}/example-entities`;
}

/** Load one entity by slug. `data` is `null` until resolved or when not found. */
export function useGetBySlug(slug: string | null): {
  data: ExampleEntitySnapshot | null;
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
  return { data: (query.data as ExampleEntitySnapshot | null) ?? null, isLoading: query.isLoading };
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
