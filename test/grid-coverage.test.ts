/**
 * Grid self-check (NOT AC-titled — this is a harness invariant, not an acceptance
 * criterion).
 *
 * The suite is the codebase proof of the spec's acceptance criteria under the rule
 * "1 active AC = 1 test". This guards the *structure* of that mapping:
 *
 *  - every AC-titled `it(...)` names its AC slug as `ac-<slug>: <restated behavior>`,
 *  - no AC slug is covered by more than one test (1 AC = 1 assertion, not N).
 *
 * It deliberately does NOT assert a fixed total (e.g. "52"): the set of ACTIVE AC
 * lives in the specification and grows/shrinks over time
 * (`c4s list-slugs --type ac`), so the grid is bound 1:1 to that live set out-of-band
 * (at implementation / in CI), never to a constant hardcoded here.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const TEST_DIR = resolve(process.cwd(), 'test');

function testFiles(): string[] {
  return readdirSync(TEST_DIR, { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.test\.tsx?$/.test(f))
    .map((f) => resolve(TEST_DIR, f));
}

/** Every `it('ac-...: ...')` slug across the suite, with its source file. */
function acTitles(): Array<{ slug: string; file: string }> {
  const out: Array<{ slug: string; file: string }> = [];
  for (const file of testFiles()) {
    const code = readFileSync(file, 'utf8');
    for (const m of code.matchAll(/\bit\(\s*['"](ac-[a-z0-9-]+):/g)) {
      out.push({ slug: m[1], file });
    }
  }
  return out;
}

describe('AC grid coverage (self-check)', () => {
  it('every AC-titled test names a well-formed ac-<slug>', () => {
    const titles = acTitles();
    expect(titles.length).toBeGreaterThan(0);
    for (const t of titles) expect(t.slug).toMatch(/^ac-[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('no AC slug is covered by more than one test (1 AC = 1 test)', () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];
    for (const { slug, file } of acTitles()) {
      if (seen.has(slug)) duplicates.push(`${slug} (in ${seen.get(slug)} and ${file})`);
      else seen.set(slug, file);
    }
    expect(duplicates).toEqual([]);
  });
});
