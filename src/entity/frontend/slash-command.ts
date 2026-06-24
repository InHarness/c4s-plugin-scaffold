/**
 * L8 — editor extension registration (slash command `/__entity_type__`). It goes into
 * `FrontendModule.editorExtensions`; the host pins it onto its single Tiptap instance.
 * This is the DECLARATIVE variant (the host opens a popover by `pluginPopoverKind`).
 *
 * Put a full custom Tiptap NodeView / extension into the `extension` field (the host's
 * extension type) — omitted in the stub to avoid pulling in @tiptap/core.
 */

import type { EditorExtensionRegistration } from '../../host';

export const __entity_type__SlashCommand: EditorExtensionRegistration = {
  name: '__entity_type__-slash',
  // availableIn: ['page'], // defaults to all contexts
  slashCommand: {
    id: '__entity_type__',
    label: '/__entity_type__',
    description: 'Insert / create a __entity_type__',
    hint: 'slug',
    pluginPopoverKind: '__entity_type__-create', // TODO: a real client PopoverKind
  },
};
