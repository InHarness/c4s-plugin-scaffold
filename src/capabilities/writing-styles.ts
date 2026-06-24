/**
 * `contributes.writingStyles` — stub (M15). The loader fans styles out to each
 * project's `SkillRegistry` as `source: "plugin"`. `content` = the SKILL.md body
 * (without frontmatter). TODO: fill in a real style or remove it from the manifest.
 */

import type { WritingStyleContribution } from '../host';

export const writingStyleStub: WritingStyleContribution = {
  slug: '__entity_type__-style',
  title: '__ENTITY_TITLE__ style',
  description: 'TODO: description of the writing style this plugin contributes.',
  version: 1,
  language: 'en',
  content: '# __ENTITY_TITLE__ writing style\n\nTODO: SKILL.md body (without frontmatter).\n',
  // files: { 'examples/example.md': '…' }, // optional attachments
};
