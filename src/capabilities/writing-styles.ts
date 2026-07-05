/**
 * `contributes.writingStyles` (M15). ALWAYS registered — `config.entities` does NOT
 * filter it (`ac-config-entities-filter`). The scaffold ships the meta writing-style
 * that documents how to write a C4S plugin spec; rename its `slug` if you fork it.
 */

import type { WritingStyleContribution } from '@c4s/plugin-runtime';

export const writingStyleStub: WritingStyleContribution = {
  slug: 'styl-specyfikacji-pluginu-c4s',
  title: 'Styl specyfikacji pluginu C4S',
  description:
    'Zasady pisania specyfikacji pluginu C4S — odwzorowanie realnej budowy pluginu (koperta → contributes → sloty, warstwy L1–L9 + M05).',
  version: 1,
  language: 'pl',
  content:
    '# Styl specyfikacji pluginu C4S\n\n' +
    'Specyfikacja ma odwzorowywać realną budowę pluginu: koperta (PluginManifest) → ' +
    'contributes.* → sloty typu encji; warstwy L1–L9 + M05. Wiąż narrację z realnymi ' +
    'encjami przez osadzenia, nie wklejaj tabel pól. Każde AC = jedno obserwowalne ' +
    'zachowanie pinowane przez verifies[].\n',
};
