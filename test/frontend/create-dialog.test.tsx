/**
 * M05 create modal — the `example-entity-create-dialog` ui-view. Composed from Host
 * UI Kit shells (`Dialog` + `FormShell` + `FormField`); the mutation is the plugin's
 * own (`useCreateExampleEntity`), wired to `FormShell.onSubmit`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import { ExampleEntityCreateDialog } from '../../src/entity/frontend/create-dialog';
import { makeSnapshot, renderWithClient } from './helpers';

afterEach(() => vi.restoreAllMocks());

/** Mock the create POST with a controllable outcome. */
function mockCreate(outcome: 'ok' | 'error' | 'pending') {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
    if (outcome === 'pending') return new Promise(() => {}); // never resolves
    if (outcome === 'error') {
      return Promise.resolve(
        new Response(JSON.stringify({ error: 'Boom' }), { status: 500, headers: { 'content-type': 'application/json' } }),
      );
    }
    return Promise.resolve(
      new Response(JSON.stringify(makeSnapshot()), { status: 201, headers: { 'content-type': 'application/json' } }),
    );
  });
}

const typeName = (container: HTMLElement, value: string) => {
  const input = container.querySelector('input[placeholder="Example entity name"]') as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
};
const submit = (container: HTMLElement) => {
  fireEvent.submit(container.querySelector('[data-ui-kit="FormShell"]') as HTMLFormElement);
};

describe('example-entity create dialog', () => {
  it('ac-modal-tworzenia-uzywa-powloki-dialog: the modal is the Host UI Kit Dialog shell wrapping a FormShell, not hand-rolled modal markup', () => {
    const { container } = renderWithClient(<ExampleEntityCreateDialog open onClose={() => {}} />);
    expect(container.querySelector('[data-ui-kit="Dialog"]')).toBeTruthy();
    expect(container.querySelector('[data-ui-kit="FormShell"]')).toBeTruthy();
    // When closed, the Dialog shell renders nothing.
    const closed = renderWithClient(<ExampleEntityCreateDialog open={false} onClose={() => {}} />);
    expect(closed.container.querySelector('[data-ui-kit="Dialog"]')).toBeNull();
  });

  it('ac-zatwierdzenie-formularza-w-modalu-form: submitting the form fires the plugin create mutation (POST), since the kit ships no mutation', async () => {
    const spy = mockCreate('ok');
    const { container } = renderWithClient(<ExampleEntityCreateDialog open onClose={() => {}} />);
    typeName(container, 'Example Entity');
    submit(container);
    await waitFor(() => expect(spy).toHaveBeenCalled());
    const [url, init] = spy.mock.calls[0];
    expect(String(url)).toMatch(/\/example-entities$/);
    expect((init as RequestInit).method).toBe('POST');
    expect(String((init as RequestInit).body)).toContain('Example Entity');
  });

  it('ac-blad-mutacji-jest-renderowany-przez-for: a mutation error renders through FormShell.error and the modal stays open', async () => {
    mockCreate('error');
    const onClose = vi.fn();
    const { container } = renderWithClient(<ExampleEntityCreateDialog open onClose={onClose} />);
    typeName(container, 'Example Entity');
    submit(container);
    await waitFor(() => expect(container.querySelector('[data-ui-kit="FormShell"] [data-ui-kit-slot="error"]')).toBeTruthy());
    // Still open, not dismissed.
    expect(container.querySelector('[data-ui-kit="Dialog"]')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ac-podczas-zapisu-formshell-busy-blokuje: while the create is in flight FormShell.busy disables the fieldset, blocking a resubmit', async () => {
    mockCreate('pending');
    const { container } = renderWithClient(<ExampleEntityCreateDialog open onClose={() => {}} />);
    typeName(container, 'Example Entity');
    submit(container);
    await waitFor(() =>
      expect((container.querySelector('[data-ui-kit-slot="fieldset"]') as HTMLFieldSetElement).disabled).toBe(true),
    );
  });

  it('ac-po-sukcesie-mutacji-modal-zamyka-sie-o: on a successful create the modal closes (onClose) — the hook invalidates the list so it refetches', async () => {
    mockCreate('ok');
    const onClose = vi.fn();
    const { container } = renderWithClient(<ExampleEntityCreateDialog open onClose={onClose} />);
    typeName(container, 'Example Entity');
    submit(container);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
