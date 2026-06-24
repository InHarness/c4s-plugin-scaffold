/**
 * L1 — SQLite migrations (per-plugin, idempotent). The host runs them on
 * `mountBackend` with its own `schema_version` counter for this plugin.
 *
 * The entity has ONE placeholder data field besides `slug` (`title`) so that CRUD /
 * serializer / chip have something to show.
 */

import type { SqlMigration } from '../../host';
import { __ENTITY_TABLE__ } from '../../identity';

export const __entity_type__Migrations: SqlMigration[] = [
  {
    version: 1,
    name: `create_${__ENTITY_TABLE__}`,
    // Idempotent SQL (must tolerate replay).
    up: `
      CREATE TABLE IF NOT EXISTS ${__ENTITY_TABLE__} (
        slug  TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT ''   -- TODO: replace with your entity's fields
      );
    `,
  },
];
