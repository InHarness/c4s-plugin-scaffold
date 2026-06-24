/**
 * L8 — card (single element). PURE REACT + entity injected by the host.
 * Same bans as the chip (no useEditor/editor.commands/PM state).
 */

import * as React from 'react';
import { editorBridge } from '../../host';
import type { EntityCardProps } from '../../host';

export const __EntityName__Card: React.FC<EntityCardProps> = ({ slug, entity, onOpen }) => {
  const data = entity as { title?: string } | null;
  const open = () => (onOpen ? onOpen() : editorBridge.openEntity('__entity_type__', slug));

  if (!data) {
    return <div role="alert">⚠ broken: __entity_type__ "{slug}"</div>;
  }

  return (
    <button type="button" onClick={open}>
      <strong>{data.title ?? slug /* TODO: label field */}</strong>
      {/* TODO: render your entity's fields */}
    </button>
  );
};
