/**
 * L8 render slots — chip / card / row. Purely presentational (data injected via
 * props / `useGetBySlug`, never self-fetched); the chip is the only broken-state
 * slot; navigation goes through the host `editorBridge` singleton.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { ExampleEntityChip } from '../../src/entity/frontend/render-chip';
import { ExampleEntityCard } from '../../src/entity/frontend/render-card';
import { ExampleEntityRow } from '../../src/entity/frontend/render-row';
import ExampleEntityFrontendModule from '../../src/frontend';
import { hostRuntimeState, resetHostRuntime } from '../helpers/host-runtime';
import { makeSnapshot } from './helpers';

function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}
const readSrc = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8');

beforeEach(() => resetHostRuntime());

describe('example-entity render slots', () => {
  it('ac-render-presentational: chip/card/row take their data from props (host-injected), never issuing their own API calls', () => {
    // Static guarantee: no render slot self-fetches or reaches for the editor.
    for (const rel of [
      'src/entity/frontend/render-chip.tsx',
      'src/entity/frontend/render-card.tsx',
      'src/entity/frontend/render-row.tsx',
    ]) {
      const code = stripComments(readSrc(rel));
      expect(code).not.toMatch(/fetch\s*\(/);
      expect(code).not.toMatch(/useQuery/);
      expect(code).not.toMatch(/useEditor/);
    }
    // And the row renders exactly the entity it is given (data from outside).
    const { getByText } = render(
      <ExampleEntityRow slug="example-entity" entity={makeSnapshot({ name: 'Injected Name' })} onOpen={() => {}} />,
    );
    expect(getByText('Injected Name')).toBeTruthy();
  });

  it('ac-renderchip-broken-state: the chip is the only slot that renders a broken reference — entity === null shows a placeholder for the slug', () => {
    const broken = render(<ExampleEntityChip slug="ghost" entity={null} />);
    expect(broken.getByText(/ghost/)).toBeTruthy();
    expect(broken.container.querySelector('.c4s-chip--broken')).toBeTruthy();

    // With a resolved entity it shows the name, not the broken state.
    const ok = render(<ExampleEntityChip slug="example-entity" entity={makeSnapshot({ name: 'Alpha' })} />);
    expect(ok.getByText('Alpha')).toBeTruthy();
    expect(ok.container.querySelector('.c4s-chip--broken')).toBeNull();
  });

  it('ac-chipy-tagow-w-wierszu-listy-sa-puste-gd: a row for a list item with no tags renders no tag chips', () => {
    const noTags = render(
      <ExampleEntityRow slug="example-entity" entity={makeSnapshot()} tags={[]} onOpen={() => {}} />,
    );
    expect(noTags.container.querySelectorAll('[data-tag-slug]')).toHaveLength(0);

    // A tagged item does draw chips (proving emptiness is the item's state, not a dead slot).
    const tagged = render(
      <ExampleEntityRow
        slug="example-entity"
        entity={makeSnapshot()}
        tags={['billing']}
        tagLookup={new Map([['billing', { slug: 'billing', name: 'billing' }]])}
        onOpen={() => {}}
      />,
    );
    expect(tagged.container.querySelectorAll('[data-tag-slug]')).toHaveLength(1);
  });

  it('ac-list-screen-entitylistrow: the row is drawn through the Host UI Kit EntityListRow, not hand-rolled markup', () => {
    const { container } = render(
      <ExampleEntityRow slug="example-entity" entity={makeSnapshot()} onOpen={() => {}} />,
    );
    expect(container.querySelector('[data-ui-kit="EntityListRow"]')).toBeTruthy();
  });

  it('ac-renderrow-embedded-only: renderRow is registered as a slot for host embeds, while the list screen composes the row component directly', () => {
    // The plugin registers the renderRow slot (host calls it for element_list/tagged_list embeds)…
    expect(ExampleEntityFrontendModule.renderRow).toBe(ExampleEntityRow);
    // …and the list SCREEN reaches for the component by direct composition, not the slot.
    const routesSrc = readSrc('src/entity/frontend/routes.tsx');
    expect(routesSrc).toMatch(/import\s*\{[^}]*ExampleEntityRow[^}]*\}\s*from\s*['"]\.\/render-row['"]/);
    expect(routesSrc).toMatch(/<ExampleEntityRow/);
  });

  it('ac-nawigacja-do-encji-sekcji-z-panelu-detal: opening from a render slot goes through the editorBridge singleton, not injected onOpenEntity/onOpenPage props', () => {
    const { getByText } = render(<ExampleEntityChip slug="alpha" entity={makeSnapshot({ name: 'Alpha' })} />);
    fireEvent.click(getByText('Alpha'));
    // The host singleton recorded the open — no prop callback was involved.
    expect(hostRuntimeState.openedEntities).toEqual([{ type: 'example-entity', slug: 'alpha' }]);

    for (const rel of ['src/entity/frontend/render-chip.tsx', 'src/entity/frontend/render-card.tsx']) {
      const code = stripComments(readSrc(rel));
      expect(code).not.toMatch(/onOpenEntity/);
      expect(code).not.toMatch(/onOpenPage/);
    }
  });
});
