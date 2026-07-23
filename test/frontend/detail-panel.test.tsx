/**
 * M05 / L8 detail panel — the required `detailPanel` slot. Host injects only `slug`;
 * the panel loads via `useGetBySlug`, renders the three states, owns its save model
 * and its own delete confirm, and consumes host-owned references + version history.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { ExampleEntityDetail, ExampleEntityHistory } from '../../src/entity/frontend/detail-panel';
import { makeSnapshot, renderWithClient } from './helpers';

afterEach(() => vi.restoreAllMocks());

function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}
const readSrc = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8');
const panelSrc = () => readSrc('src/entity/frontend/detail-panel.tsx');

/** Mock every request; GET returns the given snapshot (or 404 when null). */
function mockFetch(snapshot: ReturnType<typeof makeSnapshot> | null) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
    const method = (init as RequestInit | undefined)?.method ?? 'GET';
    const status = method === 'GET' && !snapshot ? 404 : 200;
    return new Response(JSON.stringify(snapshot), { status, headers: { 'content-type': 'application/json' } });
  });
}
const breadcrumbButtons = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('[data-ui-kit="DetailPanelShell"] [data-ui-kit-slot="breadcrumb"] button'));

describe('example-entity detail panel', () => {
  it('ac-detailpanel-usegetbyslug: the panel loads the entity by slug with useGetBySlug, showing the loading state then the not-found state', async () => {
    mockFetch(null); // 404 → resolved-but-absent
    const { container, getByText } = renderWithClient(<ExampleEntityDetail slug="ghost" />);
    // Before the query resolves: the kit LoadingState (data === undefined).
    expect(container.querySelector('[data-ui-kit="LoadingState"]')).toBeTruthy();
    // After the 404: the kit EmptyState (data === null).
    await waitFor(() => expect(getByText('Not found')).toBeTruthy());
  });

  it('ac-host-wstrzykuje-do-detailpanel-tylko-sl: the panel needs only `slug` — onDeleted/onRenamed are optional and absent here', () => {
    mockFetch(makeSnapshot()); // stays in flight long enough to show loading
    const { container } = renderWithClient(<ExampleEntityDetail slug="example-entity" />);
    // Rendered with slug alone, no callbacks — no throw, shows the loading skeleton.
    expect(container.querySelector('[data-ui-kit="LoadingState"]')).toBeTruthy();
  });

  it('ac-detailpanelshell-nie-przyjmuje-propsu-ti: the screen title is the last breadcrumb crumb (the slug), not a DetailPanelShell title prop', () => {
    const { container } = render(<ExampleEntityHistory slug="my-slug" />);
    const crumbs = breadcrumbButtons(container);
    expect(crumbs.at(-1)?.textContent).toBe('my-slug'); // title == last crumb
  });

  it('ac-panel-detalu-renderuje-pasek-metadanych: the loaded panel renders a metadata bar with the slug (mono) and updatedAt', async () => {
    mockFetch(makeSnapshot({ slug: 'example-entity' }));
    const { container, getByText } = renderWithClient(<ExampleEntityDetail slug="example-entity" />);
    await waitFor(() => expect(container.querySelector('code')?.textContent).toBe('example-entity'));
    expect(getByText(/updated/i)).toBeTruthy();
  });

  it('ac-gdy-panel-renderuje-wlasny-inline-przyci: the panel’s own inline Delete runs its own confirm dialog before mutating', async () => {
    mockFetch(makeSnapshot());
    const { container, getByTitle } = renderWithClient(<ExampleEntityDetail slug="example-entity" />);
    await waitFor(() => expect(getByTitle('Delete')).toBeTruthy());
    // No confirm open yet…
    expect(container.querySelector('[data-ui-kit="Dialog"]')).toBeNull();
    fireEvent.click(getByTitle('Delete'));
    // …the panel opens its OWN confirm before any delete mutation.
    await waitFor(() => expect(container.querySelector('[data-ui-kit="Dialog"]')).toBeTruthy());
  });

  it('ac-powrot-z-panelu-detalu-realizuje-breadcr: back is the DetailPanelShell breadcrumb (onBackToList), not an onBack prop', () => {
    const onBackToList = vi.fn();
    const { container } = render(<ExampleEntityHistory slug="my-slug" onBackToList={onBackToList} />);
    fireEvent.click(breadcrumbButtons(container)[0]); // first crumb = "back to list"
    expect(onBackToList).toHaveBeenCalled();
    // There is no `onBack` prop in the panel's contract.
    expect(stripComments(panelSrc())).not.toMatch(/onBack\b(?!ToList)/);
  });

  it('ac-panel-detalu-wola-onrenamed-newslug-wyl: onRenamed fires only when a save actually moved the slug', () => {
    // The guard: notify the host ONLY on a real slug change.
    expect(panelSrc()).toMatch(/if \(snapshot\.slug !== entity\.slug\) onRenamed\?\.\(snapshot\.slug\)/);
  });

  it('ac-model-zapisu-w-panelu-detalu-jest-plugin: the save model is plugin-owned — the plugin’s own update mutation on a debounce, not a host-supplied one', () => {
    const code = panelSrc();
    expect(code).toMatch(/useUpdateExampleEntity/); // plugin mutation, kit ships none
    expect(code).toMatch(/AUTOSAVE_DELAY_MS/); // debounced autosave model
  });

  it('ac-panel-detalu-pobiera-back-linki-przez-ho: back-links come from the host useReferences hook; the plugin defines no references route', () => {
    expect(panelSrc()).toMatch(/useReferences/);
    expect(readSrc('src/entity/backend/routes.ts')).not.toMatch(/references/i);
  });

  it('ac-panel-detalu-wystawia-zakladke-details-h: the Details/History tab is fed by host version hooks + VersionHistory, not a plugin-owned history view', () => {
    const code = panelSrc();
    expect(code).toMatch(/SegmentedControlTabs/);
    expect(code).toMatch(/label: 'Details'/);
    expect(code).toMatch(/label: 'History'/);
    expect(code).toMatch(/VersionHistory/);
  });
});
