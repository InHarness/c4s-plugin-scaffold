/**
 * M05 / L8 — the create modal (`ui-view example-entity-create-dialog`). Opened by
 * the CREATE button in the list header's `actions` slot; NOT a host slot and NOT a
 * route (no `url`). Controlled by the parent through `open` / `onClose`.
 *
 * Composed ENTIRELY from Host UI Kit shells (`@c4s/plugin-runtime/ui`): the
 * `Dialog` overlay (controlled, presentational — own NO modal markup) wraps a
 * `FormShell` (a `<form>` with a `<fieldset disabled={busy}>`, a form-level error
 * line, and an actions row) composing one `FormField` per input. The mutation is
 * the PLUGIN's (`useCreateExampleEntity`) — the kit ships no mutation; it is wired
 * to `FormShell.onSubmit`. `busy` blocks resubmit, `error` renders the failure and
 * the modal STAYS open; on success `handleClose` closes it and the list refetches
 * (the hook invalidates the `['example-entity']` query prefix).
 *
 * `Dialog` / `FormShell` are `experimental` kit components (outside the
 * `hostApiVersion` guarantee — their props may change without a major).
 *
 * `DOSTOSUJ:` the CREATE button + this modal port 1:1 to a derived plugin — swap
 * the entity type and the form fields (here `name` + `description?`) for your own
 * create DTO. The `data` / JSON field is deliberately omitted (added later via edit).
 */

import type { CSSProperties, FC, FormEvent } from 'react';
import { useCallback, useState } from 'react';
import { ActionButton, Dialog, FormField, FormShell } from '@c4s/plugin-runtime/ui';
import { EXAMPLE_ENTITY_LABEL } from '../../identity';
import { useCreateExampleEntity } from './hooks';

export interface ExampleEntityCreateDialogProps {
  /** Controlled visibility — the list screen owns this. */
  open: boolean;
  /** Requested close (scrim / Escape / ✕ / Cancel / post-success). */
  onClose: () => void;
}

const INPUT_STYLE: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '6px 8px',
  fontSize: 13,
  borderRadius: 6,
  border: '1px solid var(--c-hair, #e5e7eb)',
  background: 'var(--c-panel, #fff)',
  color: 'var(--c-ink, #111)',
};

// The submit trigger is a native `<button type="submit">` — `ActionButton` renders
// `type="button"` and cannot submit a form. Styled to mirror the kit's primary
// variant; the FormShell `<fieldset disabled={busy}>` greys + disables it while the
// mutation is in flight (this is what blocks a double submit).
const SUBMIT_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  borderRadius: 6,
  padding: '6px 12px',
  fontSize: 12.5,
  fontWeight: 500,
  border: '1px solid transparent',
  background: 'var(--c-accent, #2563eb)',
  color: '#fff',
  cursor: 'pointer',
};

export const ExampleEntityCreateDialog: FC<ExampleEntityCreateDialogProps> = ({ open, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const create = useCreateExampleEntity();

  // Reset local form + mutation state on close so the next open starts clean.
  // Stable identity (the host `Dialog`'s focus effect keys on `onClose`): an
  // unstable handler would re-run that effect on every keystroke and steal focus.
  const handleClose = useCallback(() => {
    create.reset();
    setName('');
    setDescription('');
    onClose();
  }, [onClose, create.reset]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || create.isPending) return;
    create.mutate({ name: name.trim(), description: description.trim() || undefined }, { onSuccess: handleClose });
  };

  return (
    <Dialog open={open} onClose={handleClose} title={`New ${EXAMPLE_ENTITY_LABEL}`} size="md">
      <FormShell
        onSubmit={handleSubmit}
        busy={create.isPending}
        error={create.error ? create.error.message : undefined}
        actions={
          <>
            <ActionButton label="Cancel" variant="ghost" onClick={handleClose} />
            <button type="submit" disabled={!name.trim()} style={SUBMIT_STYLE}>
              Create
            </button>
          </>
        }
      >
        <FormField label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Example entity name"
            required
            autoFocus
            style={INPUT_STYLE}
          />
        </FormField>
        <FormField label="Description">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            style={INPUT_STYLE}
          />
        </FormField>
      </FormShell>
    </Dialog>
  );
};
