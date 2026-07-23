/**
 * Frontend-test-only helpers.
 *
 * `renderWithClient` wraps a tree in a real `QueryClientProvider` so the module's
 * `useQuery`/`useMutation` hooks (`useGetBySlug`, `useCreateExampleEntity`, …) run
 * for real against a mocked `fetch`. Retries are off and the cache is fresh per
 * render, so tests never bleed into each other.
 */
import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ExampleEntityListItem, ExampleEntitySnapshot } from '../../src/entity/dto';

export function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

/** A minimal but complete snapshot; override any field per test. */
export function makeSnapshot(patch: Partial<ExampleEntitySnapshot> = {}): ExampleEntitySnapshot {
  return {
    slug: 'example-entity',
    name: 'Example Entity',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...patch,
  };
}

/** A minimal but complete list item; override any field per test. */
export function makeListItem(patch: Partial<ExampleEntityListItem> = {}): ExampleEntityListItem {
  return {
    slug: 'example-entity',
    name: 'Example Entity',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...patch,
  };
}
