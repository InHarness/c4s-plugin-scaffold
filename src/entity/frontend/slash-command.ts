/**
 * L8 — editor extension registration: the `/example-entity` slash command that
 * inserts / creates an example-entity from inside the Tiptap editor. Wired into the
 * frontend module via `editorExtensions`.
 */

import type { EditorExtensionRegistration } from '@c4s/plugin-runtime';
import { EXAMPLE_ENTITY_TYPE } from '../../identity';

export const exampleEntitySlashCommand: EditorExtensionRegistration = {
  name: `${EXAMPLE_ENTITY_TYPE}-slash`,
  slashCommand: {
    id: EXAMPLE_ENTITY_TYPE,
    label: '/example-entity',
    description: 'Insert or create an example-entity',
    hint: 'slug',
    pluginPopoverKind: `${EXAMPLE_ENTITY_TYPE}-create`,
  },
};
