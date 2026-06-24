/**
 * Frontend data-resolution slots: `useGetBySlug` + `listByTags`. The host calls them
 * to feed the render components and the list NodeViews. They use the host's shared
 * `QueryClient` (one fetch per slug, shared cache).
 *
 * NOTE: the API path is a placeholder. The host mounts routes under
 * `/api/projects/:id/__entity_type__` — adapt the client to the host's real prefix.
 */

import { useQuery } from '@tanstack/react-query';

export function use__EntityName__BySlug(slug: string | null): {
  data: unknown | null | undefined;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ['__entity_type__', slug],
    queryFn: async () => {
      if (!slug) return null;
      const res = await fetch(`/api/__entity_type__/${encodeURIComponent(slug)}`);
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
  const res = await fetch(`/api/__entity_type__?${params.toString()}`);
  if (!res.ok) return [];
  const body = (await res.json()) as { items?: Array<{ slug: string }> };
  return body.items ?? [];
}
