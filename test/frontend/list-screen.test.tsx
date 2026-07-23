/**
 * M05 list screen (`example-entity-list` ui-view). It composes the Host UI Kit and
 * is wired into `@tanstack/react-router` (so it is exercised through its source
 * contract + the shared icon reference rather than a full router mount).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import ExampleEntityFrontendModule from '../../src/frontend';
import { ExampleEntityIcon } from '../../src/entity/frontend/icon';

const readSrc = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8');
const routesSrc = () => readSrc('src/entity/frontend/routes.tsx');

describe('example-entity list screen', () => {
  it('ac-ekran-listy-prezentuje-tagi-dwuwarstwowo: tags are two-layer — a TagFilterBar under the header and per-row chips via EntityListRow tags/tagLookup', () => {
    const code = routesSrc();
    expect(code).toMatch(/<TagFilterBar/);
    // Row chips: the screen feeds tags + tagLookup down to the row.
    expect(code).toMatch(/tags=\{item\.tags/);
    expect(code).toMatch(/tagLookup=\{tagLookup\}/);
  });

  it('ac-ekran-listy-renderuje-stan-pustki-brak: empty + loading states render through the kit EmptyState / LoadingState, never custom markup', () => {
    const code = routesSrc();
    expect(code).toMatch(/import\s*\{[^}]*EmptyState[^}]*\}\s*from\s*['"]@c4s\/plugin-runtime\/ui['"]/);
    expect(code).toMatch(/<EmptyState/);
    expect(code).toMatch(/<LoadingState/);
  });

  it('ac-entitylistheader-renderuje-ikone-typu-en: the list header icon is the SAME reference as the sidebar tab icon', () => {
    // One shared reference keeps the sidebar tab and the list header in sync.
    expect(ExampleEntityFrontendModule.sidebarTab?.icon).toBe(ExampleEntityIcon);
    expect(routesSrc()).toMatch(/icon=\{ExampleEntityIcon\}/);
  });

  it('ac-naglowek-ekranu-listy-renderuje-w-slocie: the header `actions` slot holds a CREATE ActionButton that opens the create modal', () => {
    const code = routesSrc();
    expect(code).toMatch(/actions=\{<ActionButton[^>]*onClick=\{\(\) => setCreateOpen\(true\)\}/);
  });

  it('ac-tagfilterbar-nie-renderuje-sie-gdy-tag: TagFilterBar is rendered only when the tag universe is non-empty', () => {
    expect(routesSrc()).toMatch(/tagUniverse\.length > 0 && \(\s*<TagFilterBar/);
  });

  it('ac-tekstowy-search-w-naglowku-ekranu-listy: the header search filters entities by name and description', () => {
    const code = routesSrc();
    expect(code).toMatch(/it\.name\.toLowerCase\(\)\.includes\(q\)/);
    expect(code).toMatch(/it\.description \?\? ''\)\.toLowerCase\(\)\.includes\(q\)/);
  });
});
