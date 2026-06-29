/**
 * L1 — migrations that build the DERIVED SQLite index for `example-entity`.
 *
 * The source of truth is the per-entity `.json` file; this table is a queryable
 * projection of it. The schema is FORWARD-ONLY and IDEMPOTENT (`IF NOT EXISTS`):
 * replaying it changes neither schema nor data (`ac-migrations-forward-idempotent`).
 *
 * The table is named `example_entity` (snake_case) — NEVER the reserved word
 * `table` (`ac-table-snake-case`). Columns mirror `ExampleEntitySnapshot`
 * (`data` is JSON serialized as TEXT — SQLite has no native JSON type).
 */

import type { SqlMigration } from '@c4s/plugin-runtime';
import { EXAMPLE_ENTITY_TABLE } from '../../identity';

export const exampleEntityMigrations: SqlMigration[] = [
  {
    version: 1,
    name: `create_${EXAMPLE_ENTITY_TABLE}`,
    up: `
      CREATE TABLE IF NOT EXISTS ${EXAMPLE_ENTITY_TABLE} (
        slug        TEXT PRIMARY KEY NOT NULL,
        name        TEXT NOT NULL,
        description TEXT,
        data        TEXT,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_${EXAMPLE_ENTITY_TABLE}_name
        ON ${EXAMPLE_ENTITY_TABLE} (name);
    `,
  },
];
