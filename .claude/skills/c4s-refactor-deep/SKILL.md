---
name: c4s-refactor-deep
description: Deeper variant of c4s-refactor — detect drift between the claude4spec specification and the code for a given topic, cross-checking two extra ground-truth sources before classifying (the plugins-doc spec project as a generic plugin-authoring fallback when this project's own spec is silent, and the host claude4spec repo source when the drift hinges on a host-provided capability), then route the fix the same way — to the spec (`c4s ask`) or to the code (analysis brief via `c4s agent --ct brief --source analysis`). Use instead of c4s-refactor when the topic touches host-provided UI/API surface or generic plugin-authoring mechanics, not just this plugin's own business logic. Optional argument — the topic/scope (module, entity, slug, tag).
---

# c4s-refactor-deep

A **deeper spec↔code drift router** — the same job as `c4s-refactor`, but before
classifying it cross-checks two extra ground-truth sources when this project's own
spec isn't enough to judge the drift on its own:

1. **`plugins-doc`** — a different, already-registered claude4spec project: a
   generic plugin-author's guide (manifest/`contributes`, entity-type
   contributions, writing-style contributions, settings, slash-commands, host UI
   kit). Consulted **only as a fallback**, when this project's own spec is silent
   about a generic plugin-authoring mechanic the drift depends on.
2. **The host `claude4spec` repo source** — not a `c4s` project, just code, read
   directly — consulted **only** when the drift hinges on a claim of the shape
   "the host does/doesn't provide capability X."

It performs **no edits itself** — same as `c4s-refactor`, it classifies and hands
off:

1. drift that needs a **specification** change → open a read-only planning turn
   (`c4s ask`),
2. drift that needs a **code** change → describe it in an **analysis brief**
   (`c4s agent --ct brief --source analysis`).

Execution is downstream: a human continues the spec plan thread, and the
`c4s-brief-implementer` skill implements the brief.

**CLI only — never call `curl` or the HTTP API directly** (for both spec
projects). The host repo is read with plain filesystem tools (Read/Grep) — it
isn't a `c4s` project.

This skill is bound to one specification project for routing — every routing
`c4s` command below carries its identity (`--project 'c4s-plugin-scaffold'
--workspace 'default'`), so it works from any cwd. Do NOT `cd` into any repo it
reads; every identity is baked in, not derived from cwd.

## Input — a topic is required

The argument is the **topic/scope** to analyze — a single feature, module,
endpoint, table, or behavior, e.g.:

- module — `M17 snapshots`, `M19 references`
- layer — `L5 ui`, `L2 domain`
- entity / slug — `endpoint get-api-acs`, `dto chat-message`
- tag — `entity-ac`, `releases`
- host-facing — `host UI kit EntityDetailToolbar`, `settings contribution`

**Invoked with no topic → ask the user to narrow the scope.** Do **not** scan the
whole spec at once.

## Reading own spec vs the `plugins-doc` fallback

Two spec projects are in play here — never conflate them:

- **`c4s-plugin-scaffold`** — this plugin's own contract: business logic,
  entities, this project's endpoints/DTOs/tables/AC/UI views.
- **`plugins-doc`** — a *different*, already-registered claude4spec project. It
  knows nothing about this plugin's own business rules — only about how the
  plugin-authoring system works in general.

Read both through the same `c4s` reader mechanics as `c4s-spec-reader` — only the
`--project` value changes:

```sh
c4s catalog --project 'c4s-plugin-scaffold' --workspace 'default'                                   # this project's own spec: entity types + schemas
c4s list-tags --project 'c4s-plugin-scaffold' --workspace 'default'                                 # tags + counts
c4s list-slugs --type endpoint --project 'c4s-plugin-scaffold' --workspace 'default'                # slugs for a type
c4s single_element --type endpoint --slug <x> --project 'c4s-plugin-scaffold' --workspace 'default'
c4s resolve modules/<module>.md --project 'c4s-plugin-scaffold' --workspace 'default'               # expand a page's tags inline

c4s catalog --project 'plugins-doc' --workspace 'default'                                           # plugins-doc fallback: generic plugin-authoring guide
c4s list-slugs --type <t> --project 'plugins-doc' --workspace 'default'
c4s single_element --type <t> --slug <x> --project 'plugins-doc' --workspace 'default'
c4s resolve <page.md> --project 'plugins-doc' --workspace 'default'
```

**CLI-only — no filesystem fallback for either project.** If `c4s` isn't
installed, STOP and ask the user to install it; never read either spec repo's
pages directly.

**When to reach for `plugins-doc`: only as a fallback.** Consult it when the
project's own spec is *silent* about a generic plugin-authoring/host mechanic the
drift judgment depends on — e.g. "is a settings contribution even supposed to
persist per-workspace" or "does a slash-command's `argument-hint` field mean what
the code assumes" — and the own spec doesn't say. Do **not** consult it for
anything the own spec already answers, and never use it to adjudicate this
plugin's own business rules — only `c4s-plugin-scaffold`'s own spec owns those.

## Cross-checking host ground truth

The host is `@inharness-ai/claude4spec` — the runtime this plugin loads into. For
a claim about what the host provides, its spec-of-record is its **source code**,
not a spec page's paraphrase (which can go stale the moment the host ships a new
version) and not `plugins-doc` (a guide, not the ground truth). Reach for this
only when a drift judgment hinges on "the host does/doesn't provide X" or "X in
the host behaves like Y" — verify it directly instead of trusting a description.

**Locate the source (symlink first, hardcoded path fallback, then skip):**

```sh
# 1. Preferred: this repo's own dev-linked copy (works only on this machine)
readlink -f node_modules/@inharness-ai/claude4spec 2>/dev/null \
  || readlink node_modules/@inharness-ai/claude4spec 2>/dev/null

# 2. If (1) isn't a resolvable symlink (fresh clone / CI / another machine),
#    fall back to the hardcoded absolute path this skill was authored against:
ls /Users/michael/Code/ctowiec/claude4spec 2>/dev/null

# 3. If neither resolves, SKIP this step — do not fail the whole skill. Note in
#    the final report that host ground-truth could not be verified and the
#    spec's claim was taken at face value (an assumption, not a verified fact).
```

**Once you have a host repo root `$HOST`, investigate generically** (substitute
the actual capability/export/API name for `<X>` — this is a search recipe, not a
fixed grep for one symbol):

```sh
grep -rn "<X>" "$HOST/src/shared/plugin-host/" "$HOST/src/plugin-types/" \
  "$HOST/src/server/core/plugin-host/"
```

- `src/shared/plugin-host/` (`manifest.ts`, `host-api.ts`, `frontend-manifest.ts`,
  `types.ts`) — the manifest/contract types: what a plugin *can* declare and what
  the host's API surface *is*, in the type system.
- `src/plugin-types/` (including `published-surface.test.ts`) — the **public
  authoring types** a plugin author actually imports; if a symbol appears in that
  test's export-name list, it's a real, committed, published surface — not
  work-in-progress.
- `src/server/core/plugin-host/` (`loader.ts`, `manifest-adapter.ts`,
  `cli-plugins.ts`) — the actual runtime wiring: whether the capability is merely
  typed or is really loaded/executed at runtime.
- `$HOST/CHANGELOG.md` — when the capability shipped or changed (exact version
  numbers) — tells you whether a spec's claim predates or postdates the change.

Record what you found (symbol, file:line, whether test-covered, version from
CHANGELOG if relevant) — this is the evidence cited in classification and in the
report. This step is **read-only** on the host repo — never edit it; it isn't
this plugin's to change.

## Process

### 1. Establish the topic

Confirm the scope and gather vocabulary (`c4s list-slugs`, `c4s list-tags`,
`c4s catalog`, against `c4s-plugin-scaffold`). If no topic was given, ask the user
to narrow it first.

### 2. Read own spec

Read `c4s-plugin-scaffold`'s spec for the topic — what this project's spec
**says** is the primary contract side of the comparison.

### 3. Consult `plugins-doc` (fallback, conditional)

**Only if** step 2 leaves open a question about generic plugin-authoring/host
mechanics (not this project's own business rules) — see "When to reach for
`plugins-doc`" above. Skip this step entirely if step 2 already answers the
question, or if the open question is about this plugin's own domain logic.

### 4. Analyze the code

Read the matching code (routes/endpoints, DTOs, domain services, UI). Establish
what the code **actually does** — the implementation side of the comparison.

### 5. Cross-check host ground truth (conditional)

**Only if** classifying the drift depends on a host-provided-capability claim —
see "Cross-checking host ground truth" above. Skip this step for drift that's
purely about the plugin's own code vs. the plugin's own spec, with no host claim
in play — don't grep an entire external repo for every candidate.

### 6. Detect & classify drift

Compare what you gathered (own spec, optionally `plugins-doc`, code, optionally
host ground truth) and put each difference in exactly one bucket:

- **spec-fix** — the code is the intended/current behavior; the spec is missing it
  or describes it incorrectly → **Path 1**.
- **code-fix** — the spec is the intended contract; the code doesn't meet it →
  **Path 2**.
- **both** — run both paths; note the priority (usually reconcile the spec first,
  then the code).
- **none** — report "in sync" and **STOP**.
- **external-drift** — the mismatch isn't between this project's spec and this
  project's code at all; it's between `plugins-doc` and the host (e.g. the host
  shipped a capability `plugins-doc` hasn't documented yet, or `plugins-doc`
  describes a mechanic the host no longer implements that way). This skill does
  **not** own `plugins-doc` or the host repo, so it does **not** route a fix —
  report it and **STOP** for this finding; a human decides whether to raise it
  against `plugins-doc` or the host.

### 7. Path 1 — spec-fix → read-only plan (`c4s ask`)

`c4s ask` is read-only and forces plan-mode (a peer-consult), so the agent
**always produces a plan** of spec changes and never mutates the spec:

```sh
c4s ask "Spec drift on <topic>: <description>. Create a plan of specification \
changes — list the entities/pages to change and the exact edits. Plan only, do \
not execute." --project 'c4s-plugin-scaffold' --workspace 'default'
```

**Record the returned `threadId`.** This skill does **not** apply the plan — a human
continues the thread (`c4s ask "..." --thread <threadId>`, or in the UI).

### 8. Path 2 — code-fix → analysis brief (`c4s agent --ct brief --source analysis`)

Route a code fix into an **analysis brief** that the `c4s-brief-implementer` skill
can implement later.

**Use create-mode, not attach-mode.** `c4s-refactor-deep` is a standalone CLI
caller — there's no parent thread in a foreign repo to attach to — so a fresh
top-level thread via create-mode is the right shape. One command mints a new
**analysis brief** (`source: analysis`, `to_release: null`) and runs a turn that
fills its body from your message:

```sh
c4s agent "Code drift on <topic>: the spec says Y but the code does X. <what \
the implementer must change and why — cite any host ground-truth evidence \
gathered in step 5, if collected>" --ct brief --source analysis --project 'c4s-plugin-scaffold' --workspace 'default'
```

The command prints the created brief's path — record it for handing off to
`c4s-brief-implementer`. **Never pass `--brief <path>`** (attach-mode) here —
attach-mode expects an already-minted brief; for a path that doesn't exist yet
the turn's `get_brief` call fails with `NOT_FOUND` inside the turn (the CLI
still exits 0, but no brief gets authored).

### 9. Report + STOP

Print and **finish** (no execution):

- **Topic** and the **drift classification** (spec-fix / code-fix / both / none /
  external-drift).
- **Sources consulted, and what each contributed** — skip lines for sources not
  consulted, don't pad the report:
  - own spec (`c4s-plugin-scaffold`) — always consulted (step 2); summarize what
    it said.
  - `plugins-doc` — only if step 3 ran; summarize the fallback answer, or note it
    was silent too.
  - host repo (`claude4spec` source) — only if step 5 ran; cite the concrete
    evidence found (symbol, file:line, test coverage, CHANGELOG version) — or, if
    the repo couldn't be located, say so explicitly: *"host ground-truth could
    not be verified — treated the spec's claim as an unverified assumption."*
- The created `threadId` (Path 1) and/or `briefPath` (Path 2), when a fix was
  routed.
- For `external-drift` findings: which side (`plugins-doc` or host) appears
  stale, and the evidence — with an explicit note that no fix was filed by this
  skill.
- Next step: a human continues the spec plan thread; `c4s-brief-implementer`
  implements the brief; for `external-drift`, a human decides whether/how to
  raise it against `plugins-doc` or the host.

## Hard dependency & gotchas

- **Both routing paths require the `c4s` CLI AND a running server.** Without a
  server the skill can still read both specs and analyze the code, but it
  **cannot route the fix** (`c4s ask` / `c4s agent` delegate the turn to the
  server). The read-only `resolve` / `list-*` / `single_element` commands do not
  need a server.
- **The identity is baked in — never `cd`.** `--project 'c4s-plugin-scaffold' --workspace 'default'` is injected into every
  routing command above; `cd`-ing into any repo this skill reads is unnecessary
  and, if reached through a symlink, can even break resolution.
- **`c4s ask` is read-only** — it yields a plan only and never mutates the spec;
  execution is a separate, human-driven step.
- **Path 2 uses create-mode, not attach-mode.** Mint the analysis brief via
  `c4s agent --ct brief --source analysis`. Don't pass `--brief <path>` — that's
  attach-mode, which expects a pre-existing brief.
- **`PROJECT_SLUG_NOT_FOUND`** — the injected `--project 'c4s-plugin-scaffold'` no longer
  matches a project in this machine's `~/.claude4spec/workspaces.json` (moved,
  deleted, or copied from another machine). Regenerate `c4s-refactor` from the
  spec repo and port the routing identity here. `AMBIGUOUS_WORKSPACE` /
  `AMBIGUOUS_PROJECT` → pass the correct `--workspace <name>`.
- **`plugins-doc` not registered on this machine** (`PROJECT_SLUG_NOT_FOUND` on
  `--project 'plugins-doc'`) — this is a *fallback* source, not a hard
  dependency: skip step 3 (don't stop the whole skill), and note in the report
  that the generic-mechanic fallback wasn't available. If it's actually needed,
  `plugins-doc` has to be registered separately (a different repo,
  `claude4spec-private/plugins-doc` on this machine) — outside this skill's job.
- **Host repo not found at either the symlink or the hardcoded path.** Not
  fatal — this is a machine-local dev convenience, not part of this plugin's own
  dependency graph. Skip step 5, proceed with classification using only the
  spec-side sources, and flag any host-provided-capability claim you couldn't
  verify as an **assumption** in the report, not a confirmed fact.
- **Don't over-trigger step 5.** Grepping a large external repo for every single
  drift candidate is wasteful and noisy. Only do it when the specific difference
  you're about to classify is a claim about host-provided behavior — most drift
  (business logic, this plugin's own DTOs/routes/domain rules) never needs it.
- **`external-drift` is a dead end for routing, by design.** Do not attempt to
  call `c4s ask` or `c4s agent --ct brief --source analysis` against `--project 'plugins-doc'` to
  "fix" a `plugins-doc`-vs-host mismatch — this skill's routing identity and both
  paths are scoped to `c4s-plugin-scaffold` only; report those findings to a
  human instead of improvising a write into a project this skill doesn't own.

## Notes

This skill is a **hand-derived variant of `c4s-refactor`** (not itself generated
by `c4s install-skills`) — it adds two extra ground-truth sources (`plugins-doc`,
the host repo) to the fact-gathering phase before drift classification; the
classification buckets and both routing mechanics (`c4s ask` / `c4s agent --ct
brief --source analysis`) are unchanged from `c4s-refactor`. If `c4s-refactor` is
regenerated/refreshed from the spec repo, port relevant changes into this file by
hand — nothing regenerates it automatically.
