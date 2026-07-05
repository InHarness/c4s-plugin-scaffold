---
name: c4s-brief-implementer
description: >-
  Implement features described in claude4spec briefs (markdown files in
  .claude4spec/briefs/). Briefs are self-contained — they include all context
  needed for implementation (entity snapshots, section diffs, narrative). After
  implementation, if you discover drift between the brief and reality (missing
  details, incorrect assumptions, edge cases not covered), generate a patch file
  in .claude4spec/patches/ as feedback for the specification author. Use when
  implementing changes in a code repository that has a .claude4spec/briefs/
  directory.
---

<!-- anchor: gqgxb9x4 -->
# c4s-brief-implementer

This skill describes how to implement a release brief in **your code repository**
(not the spec repo). A brief is a self-contained markdown file under
`.claude4spec/briefs/` that captures everything you need to ship the change:
entity snapshots, section diffs, narrative, acceptance criteria.

**This skill does NOT assume the `c4s` CLI is installed.** Briefs are designed
to be self-contained — you do not need to read the main specification or query
the entity database. If the brief references something you cannot find in its
body, treat that as drift and file a patch (step 5 below).

<!-- anchor: diryx7my -->
## Workflow

<!-- anchor: d4bgs4fh -->
### 1. Discover

```sh
ls .claude4spec/briefs/        # list available briefs
cat .claude4spec/briefs/<slug>.md
```

If `.claude4spec/` is not in your current directory, walk up the directory tree
until you find it (similar to how git finds `.git/`).

<!-- anchor: dkqgkgty -->
### 2. Read the brief as self-contained input

Every brief has YAML frontmatter:

```yaml
---
type: brief
from_release: v0.1.16
to_release: v0.1.17
generator_version: brief-author@0.1
implemented: false
---
```

The body contains everything you need — entity snapshots, section diffs, the
narrative of what changes, and acceptance criteria. **Do not read the main
specification.**

If the brief is unclear — a missing detail, an ambiguous wording, a decision
you'd otherwise have to guess — you have two paths:

**Synchronous (preferred when available).** Ask the specification agent in the
same terminal and continue once you have an answer. There are two synchronous
paths — pick by *what context* you need the agent to see:

**Path A (preferred) — brief context.** Ask in the context of the specific brief
plus its release diff. The agent sees only the brief and what changed in that
brief's window — i.e. exactly the scope you are implementing. `c4s ask` does
**not** accept `--ct`/`--brief` (it is a narrowed alias with `contextType='ask'`
hard-wired); the brief-context path is `c4s agent`:

```bash
c4s agent "Brief nie precyzuje X — czy chodzi o A czy B?" --ct brief --brief <brief-slug>.md
```

Continue the same thread with `c4s agent "..." --thread <threadId>` (the
`threadId` is printed with the answer).

**Path B — current spec state (read-only ask).** `c4s ask` is a read-only peer
consult of the **current** specification state, which may already be well ahead
of the brief you are implementing. It "knows more / further", but the answer may
reference changes outside your brief's scope. Pass the brief slug in the question
text (there is no `--brief` here):

```bash
c4s ask "W briefie <brief-slug> nie jest jasne X — czy chodzi o A czy B?"
```

Continue the same thread with `c4s ask "..." --thread <threadId>`.

Both paths require `c4s` installed *and* a running
`npx @inharness-ai/claude4spec` server. When either is unavailable, skip them.

If the command returns `PROJECT_NOT_FOUND` despite a running server, your cwd is
probably reached through a **symlink** (common for `.claude/skills/<name>`
projects): `c4s` resolves `process.cwd()` to the real path, which is NOT the one
registered in `~/.claude4spec/workspaces.json`. Pass the registered (symlink) path
explicitly — `--project` is run through `path.resolve`, which does NOT canonicalize
symlinks, so it matches the registry. `--project` applies to **both** paths:

```bash
<!-- anchor: divvnatu -->
# Path A (brief context):
c4s agent "Brief nie precyzuje X — ..." --ct brief --brief <brief-slug>.md --project /abs/path/to/registered/skill-dir
<!-- anchor: 11dmriz5 -->
# Path B (current spec state):
c4s ask "W briefie <brief-slug> nie jest jasne X — ..." --project /abs/path/to/registered/skill-dir
```

**Asynchronous (always available).** If you cannot ask synchronously, proceed
with your best judgement and file a patch afterwards (step 5) so the
spec-author can fold the clarification into the next brief.

<!-- anchor: nefc9a21 -->
### 3. Work in an isolated worktree (mandatory)

Every brief is implemented in its own git worktree — never directly on `main`
or a shared checkout. This keeps the main checkout clean and lets several
briefs be in flight at once. Once you know the brief slug (from step 1):

```sh
git worktree add .worktrees/<brief-slug> -b brief/<brief-slug>
cd .worktrees/<brief-slug>
```

- Branch: `brief/<brief-slug>` (the brief file name without `.md`).
- Path: `.worktrees/<brief-slug>` inside the repo; `.worktrees/` is git-ignored.
- Resuming an existing branch: drop `-b`
  (`git worktree add .worktrees/<brief-slug> brief/<brief-slug>`).

Do all implementation, commits, patches, and the `implemented: true` flip from
inside the worktree. After the brief is merged/accepted, clean up from the main
checkout:

```sh
git worktree remove .worktrees/<brief-slug>
git branch -d brief/<brief-slug>   # after merge
```

> Dev-install caveat: if this scaffold is dev-installed as a base plugin, the
> host watches the **main checkout** path — changes made inside a worktree are
> not hot-reloaded there. Verify from the main checkout after merge (or point
> the dev-install symlink at the worktree).

<!-- anchor: zb33fumf -->
### 4. Implement

Standard code flow in your target repository: read existing code, plan, edit,
test. Stay focused on what the brief specifies.

<!-- anchor: 4dftpmum -->
### 5. Feedback loop (patches)

When you discover that the brief diverges from reality — a missing detail, an
incorrect assumption, an edge case not covered, or anything else the
spec-author should know — write a patch file:

```sh
mkdir -p .claude4spec/patches
```

Create `.claude4spec/patches/<brief-slug>-<short-desc>.md` with this format:

```markdown
---
type: patch
brief: v0-1-16-to-v0-1-17.md      # path relative to briefs/
patch_kind: drift                  # drift | missing | incorrect | clarification
created_at: 2026-05-11T17:32:00Z
created_by: claude-code            # or "cursor", "aider", ...
---

<!-- anchor: 0o2q53b7 -->
# Patch — short title

<!-- anchor: s8cynxpc -->
## What I found

…description of the drift / missing detail / incorrect assumption…

<!-- anchor: 40t02zje -->
## Suggestion

…what the spec-author should consider in a follow-up brief or entity edits…
```

Patch-kind values:

- `drift` — the brief described behavior X, but the codebase already does Y.
- `missing` — the brief is silent on a detail you had to decide yourself.
- `incorrect` — the brief is factually wrong about existing code.
- `clarification` — the brief is ambiguous; you guessed but it should be made
  explicit for next time.

The `.claude4spec/patches/` directory is created **lazily** — only when you
file your first patch. The claude4spec server does NOT create it.

<!-- anchor: 2k9eeegi -->
### 6. Mark brief as implemented

When the implementation is genuinely finished — code committed, tests green,
merged to main / accepted by the user — flip the brief's frontmatter to
`implemented: true`:

```bash
<!-- anchor: y2jwsohi -->
# Option A — Edit tool: change the line `implemented: false` → `implemented: true`.
<!-- anchor: 75d2b1fj -->
# Option B — yq (idempotent; adds the field to legacy briefs that never had it):
yq -i '.implemented = true' .claude4spec/briefs/<brief-slug>.md
```

`implemented: true` is a **declaration**, not a computed fact derived from git.
A revert on main does NOT roll the flag back. Set it ONLY when implementation
is realistically done — never proactively or "just in case".

<!-- anchor: rumgznt8 -->
### 7. Hand-off

The spec-author reads patches manually (`ls .claude4spec/patches/`, `cat`)
and folds them into the next brief or entity edits. There is no UI listing in
this release — patches are raw markdown.

<!-- anchor: bbf8v25z -->
## Notes

This is a **base skill** generated by claude4spec. It already covers what you
need to read briefs and ask the c4s agent questions. Feel free to **adapt it to
your own workflow** (e.g. add a git/PR flow) or use it as-is — this base copy
under `.claude4spec/skills/` is refreshed on server start, so copy it into your
project's `.claude/skills/` if you want edits that stick.
