---
type: patch
brief: initial-v0-0-1.md
patch_kind: clarification
created_at: 2026-06-30T00:00:00Z
created_by: claude-code
---

# Patch — list-screen names one UI Kit component that doesn't exist (`ListPageLayout`)

## What I found

The brief / `ui-view/example-entity-list` says the list screen is composed from
Host UI Kit **`EntityListRow`**, **`ListPageLayout`** and **`TagFilterBar`**.

Checked against the actual published types (`@inharness-ai/claude4spec/plugin-runtime/ui`,
i.e. `node_modules/.../dist/plugin-types/ui.d.ts`):

- `EntityListRow` — **exists** (experimental tier, props `{ leading, onClick, tags?,
  tagLookup, trailing?, children, ... }`). ✅
- `TagFilterBar` — **exists** (experimental tier, props `{ tags, tagFilter,
  onTagToggle, tagMode, onToggleMode, onClear }`). ✅
- `ListPageLayout` — **does NOT exist**. The list-container component is named
  **`EntityListLayout`** (`{ header?, children }`). The published export list
  (`PLUGIN_RUNTIME_UI_EXPORT_NAMES`) has no `ListPageLayout`.

Also worth recording: the list SCREEN is mounted via the `FrontendModule.routes`
slot (`RouteTreeFragment`, `@tanstack/react-router`) — a real field on the 1.0.0
`FrontendModule` that the brief's prose doesn't name explicitly.

## How I implemented it

`src/entity/frontend/routes.tsx` composes the screen from the real exports:
`EntityListHeader` (title + search) + `TagFilterBar` (gated — the scaffold's list
DTO has no tags, so the universe is empty) + rows via `EntityListRow` (through
`ExampleEntityRow`). Mounted through `FrontendModule.routes`. (The reference plugin
`@inharness-ai/c4s-plugin-simple-database-tables` uses the same shape.)

## Suggestion

Rename `ListPageLayout` → `EntityListLayout` in the `example-entity-list` view (and
the brief's Frontend section), and optionally mention `EntityListLayout` as the
header+body container. The other two names are correct as-is.
