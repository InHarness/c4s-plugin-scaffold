/**
 * Frontend data-resolution slots: `useGetBySlug` + `listByTags`. The host calls them
 * to feed the render components and the list NodeViews. They use the host's shared
 * `QueryClient` (one fetch per slug, shared cache).
 *
 * NOTE: the host is project-scoped — per-project plugin routes are mounted under
 * `/api/projects/:id/__entity_type__`. The client reads the project id from the
 * server-injected global `window.__C4S_PROJECT__.id` (M31) and builds the prefix
 * via `apiBase()`. When the global is absent the id defaults to `'default'`, so the
 * URL stays project-scoped and a missing id surfaces as a LOUD 404 rather than
 * silently degrading to a project-less path.
 */

import { useQuery } from '@tanstack/react-query';

/** Project-scoped API base for this entity (`/api/projects/<id>/__entity_type__`). */
function apiBase(): string {
  const pid =
    (typeof window !== 'undefined'
      ? (window as unknown as { __C4S_PROJECT__?: { id?: string } }).__C4S_PROJECT__?.id
      : undefined) ?? 'default';
  return `/api/projects/${pid}/__entity_type__`;
}

export function use__EntityName__BySlug(slug: string | null): {
  data: unknown | null | undefined;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ['__entity_type__', slug],
    queryFn: async () => {
      if (!slug) return null;
      const res = await fetch(`${apiBase()}/${encodeURIComponent(slug)}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!slug,
  });
  return { data, isLoading };
}

export async function list__EntityName__ByTags(args: {
  tags: string[];
  filter: 'and' | 'or';
}): Promise<Array<{ slug: string }>> {
  const params = new URLSearchParams();
  if (args.tags.length) {
    params.set('tags', args.tags.join(','));
    params.set('tagFilter', args.filter);
  }
  const res = await fetch(`${apiBase()}?${params.toString()}`);
  if (!res.ok) return [];
  const body = (await res.json()) as { items?: Array<{ slug: string }> };
  return body.items ?? [];
}
