---
name: c4s-brief-implementer
description: Implement features described in claude4spec briefs. Briefs are self-contained markdown files (entity snapshots, section diffs, narrative) that live in the companion specification repository, reached from your code repo via the c4s CLI (c4s list-briefs / read-brief, with --project and --workspace baked in). After implementation, if you discover drift between the brief and reality (missing details, incorrect assumptions, edge cases not covered), file a patch via c4s file-patch as feedback for the specification author. Use when implementing a claude4spec brief in a code repository.
---

# c4s-brief-implementer

This skill describes how to implement a release brief in **your code repository** (not the spec repo). A brief is a self-contained markdown file that captures everything you need to ship the change: entity snapshots, section diffs, narrative, acceptance criteria. Briefs live in the **spec** repository, a different repo from the one you are working in — you never touch it directly; the `c4s` CLI reaches everything for you.

**Reaching the briefs.** This skill is **CLI-only**: it reaches the briefs and writes patches solely through the `c4s` CLI, with the spec project's identity baked into this skill (`--project 'c4s-plugin-scaffold' --workspace 'default'`) — `c4s list-briefs` / `c4s read-brief` / `c4s file-patch` work from any directory, without a running server (they are filesystem-scoped). If `c4s` is not installed, **stop** and ask the user to install it — do not read or write the spec repo's files by hand.

**The brief is self-contained.** You do not need to read the main specification or query the entity database — everything is in the brief body. If the brief references something you cannot find in its body, treat that as drift and file a patch (step 5 below).

## Workflow

### 1. Discover

List the briefs through `c4s` (paginated — briefs accumulate over time, so filter and page rather than dumping everything):

```sh
c4s list-briefs --status pending --limit 10 --project 'c4s-plugin-scaffold' --workspace 'default'
```

`--status pending` hides briefs already marked `implemented: true`; drop it to see all. Use `--offset` to page. Output lists each brief's `path` (which you pass to `read-brief`) and whether it is already implemented.

**Which brief do I implement?** If the user named a brief, use it. If not — and `list-briefs` returns more than one pending brief — **ask the user which one**; do NOT guess. Picking the wrong brief wastes an implementation pass. Only proceed automatically when there is exactly one obvious candidate (a single pending brief, or the user pointed at one).

### 2. Read the brief as self-contained input

Read the full brief by the `path` printed by `list-briefs`:

```sh
c4s read-brief <brief-path> --project 'c4s-plugin-scaffold' --workspace 'default'
```

The body contains everything you need — entity snapshots, section diffs, the narrative of what changes, and acceptance criteria. Read it and implement it; you do not need to understand how the brief was produced. **Do not read the main specification.**

If the brief is unclear — a missing detail, an ambiguous wording, a decision you'd otherwise have to guess — you have two paths.

**Synchronous (preferred when available).** Ask the specification agent in the same terminal and continue once you have an answer. Two distinct commands, by what context you need.

Preferred — context of THIS brief plus its release diff (the agent sees only the change window of the brief you are implementing):

```bash
c4s agent "Brief nie precyzuje X — czy chodzi o A czy B?" --ct brief --brief <brief-path> --project 'c4s-plugin-scaffold' --workspace 'default'
```

Alternative — read-only peer-consult of the CURRENT spec state (may be ahead of the brief you are implementing); no brief context, no `--ct`/`--brief`:

```bash
c4s ask "Jak dziala Y w aktualnej specce?" --project 'c4s-plugin-scaffold' --workspace 'default'
```

Continue the brief thread with `c4s agent "..." --thread <threadId> --project 'c4s-plugin-scaffold' --workspace 'default'` (the `threadId` is printed with the answer). This path requires `c4s` installed *and* a running `npx @inharness-ai/claude4spec` server. When either is unavailable, skip it.

**Asynchronous (always available).** If you cannot ask synchronously, proceed with your best judgement and file a patch afterwards (step 5) so the spec-author can fold the clarification into the next brief.

### 3. Implement

Standard code flow in your target repository: read existing code, plan, edit, test. Stay focused on what the brief specifies.

Do the implementation in an isolated **git worktree**, not directly in the main checkout — this repo already gitignores `.worktrees/` for exactly this.

```sh
git worktree add .worktrees/<slug> -b <slug>
```

Pick `<slug>` from the brief's own slug/path (or a short descriptive name for ad-hoc, non-brief work). Do all edits, typechecking, and building inside that worktree — never touch the main checkout directly.

When the implementation is verified (typecheck/build/tests green), push the branch and open a pull request — but do **not** merge it yourself:

```sh
git push -u origin <slug>
gh pr create --title "..." --body "..."
```

Merging is a human decision (review, CI, etc.) — this skill's job ends at "PR opened," never at "PR merged." Once the PR is merged (or abandoned), remove the worktree:

```sh
git worktree remove .worktrees/<slug>
```

### 4. Smoke-test in Docker against a real host

Before filing patches or marking the brief implemented, build the plugin and verify the contributed entity actually loads and *activates* against a real, running host — don't hand off on green typecheck/build alone. From inside the worktree:

```sh
docker/plugin-smoke.sh "$slug"
# bump the port if another worktree/brief already has one running:
docker/plugin-smoke.sh "$slug" --port 3001
```

This builds `dist/` (`npm run build`), auto-detects a sibling `claude4spec` host checkout (override with `C4S_HOST_DIR`, or use `--host-ref <branch|PR#|sha>` to test against a specific host revision in its own isolated worktree — never your host checkout's working tree directly), mounts this plugin's `dist/` read-only into a seeded fixture project, trusts it non-interactively, and polls until the contributed entity type(s) are reported `active` — not just `loaded`. Leave the container running (the script does not tear down on success) and report back: the URL, the port, and the entity type(s) you verified — the user gets their own hands-on look at what you just exercised.

If the host checkout predates plugin-mount support, the script fails with a clear message naming what's missing — don't try to work around that by hand. If the smoke test reveals drift (e.g. a detail the brief didn't cover about how the entity should render once active), file a patch (step 5).

Tear down once you've moved on to another brief, or the user confirms they're done poking at it — don't leave stray containers/worktrees behind across unrelated briefs:

```sh
docker/plugin-smoke.sh "$slug" --down
```

#### 4b. Order an environment via env-runner

`docker/plugin-smoke.sh` **stays the default fast path** for the simple case: one plugin, no API, a stable host. Reach for **env-runner** only when the smoke test outgrows a single container:

- **Multi-component** scenarios — the plugin has to be verified together with the API stack and/or a specific app `ref` (e.g. a PR revision of `claude4spec`), not just a plain host checkout.
- **Parallel environments** — several briefs/worktrees smoke-testing at once, where you need isolated networks and non-colliding ports instead of manually bumping `--port`.

**You do not run env-runner yourself.** Write an *environment order* to the operator following the order template, receive back the environment name plus the port/URL map, and — when done — ask the operator to `envr destroy` it. The operator translates the order into `manifest.yml` and drives `envr create` / `up` / `destroy`. State plainly what you need (host app mode + ref, whether the API stack is on, which plugin repo/ref, the contributed `entityTypes`, and the data mode) and let the operator do the rest; iterating on a new push is a deterministic `destroy` + `create`.

### 5. Feedback loop (patches)

When you discover that the brief diverges from reality — a missing detail, an incorrect assumption, an edge case not covered, or anything else the spec-author should know — file a patch. Use `c4s file-patch`, which records the patch on the spec side for you:

```sh
printf '%s\n' "$PATCH_BODY" | c4s file-patch \
  --brief <brief-path> --desc "<short-desc>" --kind drift \
  --project 'c4s-plugin-scaffold' --workspace 'default'
```

The body (from stdin, or `--body-file <f>`) goes below an auto-generated `# Patch — <short-desc>` heading. Structure the body as two sections: a `## What I found` section (the drift / missing detail / incorrect assumption) and a `## Suggestion` section (what the spec-author should consider in a follow-up brief or entity edits). `c4s file-patch` records all the metadata for you (which brief it relates to, the kind from `--kind`, defaulting to `drift`) — you only write the markdown body.

`--kind` values:

- `drift` — the brief described behavior X, but the codebase already does Y.
- `missing` — the brief is silent on a detail you had to decide yourself.
- `incorrect` — the brief is factually wrong about existing code.
- `clarification` — the brief is ambiguous; you guessed but it should be made explicit for next time.

### 6. Mark brief as implemented

When the implementation is genuinely finished — code committed, tests green, merged to main / accepted by the user — mark the brief as implemented (`implemented: true`):

```sh
c4s mark-brief-implemented <brief-path> --project 'c4s-plugin-scaffold' --workspace 'default'
```

Unlike the filesystem-scoped `c4s list-briefs` / `read-brief` / `file-patch`, this command **requires a running `npx @inharness-ai/claude4spec` server** — if it isn't up, ask the user to start it. There is no by-hand file edit: this skill is CLI-only.

`implemented: true` is a **declaration**, not a computed fact derived from git. A revert on main does NOT roll the flag back. Set it ONLY when implementation is realistically done — never proactively or "just in case".

### 7. Hand-off

The spec-author picks up your patches on the spec side and folds each deviation back into the specification. That lifecycle lives entirely in the spec repo; you only write the raw markdown patch body via `c4s file-patch`.

## Notes

This is a **base skill** generated by claude4spec **on demand** — you got it either by downloading the ZIP from the Settings page or by running `c4s install-skills`, which writes it into your code repo's `.claude/skills/`. It already covers what you need to read briefs and ask the c4s agent questions. Feel free to **adapt it to your own workflow** (e.g. add a git/PR flow) or use it as-is. To refresh it against the current spec, re-download the ZIP or re-run `c4s install-skills` (overwrites the managed copy).
