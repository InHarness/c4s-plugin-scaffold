/**
 * L1 migrations — the derived SQLite index. Forward-only + idempotent, snake_case
 * table name. Run against a real in-memory `better-sqlite3`.
 */
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { EXAMPLE_ENTITY_TABLE } from '../../src/identity';
import { applyExampleEntityMigrations } from '../helpers/mount-context';

function tableInfo(db: Database.Database, table: string) {
  return db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string; type: string }>;
}

describe('example-entity migrations', () => {
  it('ac-migrations-forward-idempotent: replaying the migration set changes neither schema nor data and never throws', () => {
    const db = new Database(':memory:');
    try {
      applyExampleEntityMigrations(db);
      const schemaAfterFirst = tableInfo(db, EXAMPLE_ENTITY_TABLE);
      db.prepare(
        `INSERT INTO ${EXAMPLE_ENTITY_TABLE} (slug, name, created_at, updated_at)
         VALUES ('a', 'A', '2026', '2026')`,
      ).run();

      // Second run — forward-only + `IF NOT EXISTS`: no throw, no schema drift, no data loss.
      expect(() => applyExampleEntityMigrations(db)).not.toThrow();
      expect(tableInfo(db, EXAMPLE_ENTITY_TABLE)).toEqual(schemaAfterFirst);

      const rows = db.prepare(`SELECT count(*) AS n FROM ${EXAMPLE_ENTITY_TABLE}`).get() as { n: number };
      expect(rows.n).toBe(1);

      // Exactly one index table exists — the replay did not create a duplicate.
      const tables = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`)
        .all(EXAMPLE_ENTITY_TABLE);
      expect(tables).toHaveLength(1);
    } finally {
      db.close();
    }
  });

  it('ac-table-snake-case: the index table is snake_case (example_entity) and never the reserved word `table`', () => {
    expect(EXAMPLE_ENTITY_TABLE).toBe('example_entity');
    expect(EXAMPLE_ENTITY_TABLE).toMatch(/^[a-z][a-z0-9_]*$/); // snake_case, no hyphens/caps
    expect(EXAMPLE_ENTITY_TABLE).not.toBe('table'); // not the reserved word

    // The physically-created table carries that exact snake_case name.
    const db = new Database(':memory:');
    try {
      applyExampleEntityMigrations(db);
      const created = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`)
        .get(EXAMPLE_ENTITY_TABLE) as { name: string } | undefined;
      expect(created?.name).toBe('example_entity');
    } finally {
      db.close();
    }
  });
});
