---
type: patch
brief: initial-v0-0-1.md
patch_kind: drift
created_at: 2026-06-30T00:00:00Z
created_by: claude-code
---

# Patch — `database-table/example-entity` already exists (18 AC → 19 AC)

## What I found

The brief body states (sections "Luka do odnotowania" and "Model danych (DTO)")
that v0.0.1 has **no separate `database-table` entity** — the `example_entity`
table is "described only in backend narrative and pinned by AC via
`verifies[] → database-table/example-entity`". It also tallies **18 acceptance
criteria**.

But the spec on disk already contains:

- `.claude4spec/entities/database-table/example-entity.json` — a fully modeled
  `database-table` entity (columns `slug` PK / `name` / `description` / `data` /
  `created_at` / `updated_at`, plus index `idx_example_entity_name`).
- **19** AC files under `.claude4spec/entities/ac/` (the brief says 18). The extra
  one is `ac-mcp-factory` being counted alongside the rest; regardless, the brief's
  "18" no longer matches the directory.

So the `verifies[] → database-table/example-entity` links in the AC entities now
resolve to a real entity — the "gap" the brief flags is already closed.

## Suggestion

Refresh the brief for the next release so it (a) reflects that
`database-table/example-entity` is a modeled entity (drop the "luka"/gap note or
restate it as resolved), and (b) corrects the entity/AC counts (31 → 32 entities,
18 → 19 AC). The implemented scaffold's L1 migration already matches the modeled
table 1:1 (`src/entity/backend/migrations.ts`).
