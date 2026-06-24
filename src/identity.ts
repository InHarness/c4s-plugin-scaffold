/**
 * Entity identity + `slugFrom` — shared by the backend (`plugin.ts`) and the
 * frontend (`frontend.tsx`). KEPT SEPARATE, with no backend/frontend imports, so
 * the frontend entry does not pull in Express/SQLite and the backend entry does
 * not pull in React.
 *
 * Placeholders to replace (see the rename map in README).
 */

export const __ENTITY_TYPE__ = '__entity_type__'; // kebab-case
export const __ENTITY_TABLE__ = '__entity_table__'; // snake_case
export const __PATH_PREFIX__ = '/__entity_type__'; // WITHOUT "/api"
export const __ENTITY_LABEL__ = '__ENTITY_TITLE__';
export const __ENTITY_LABEL_PLURAL__ = '__ENTITY_TITLE__s'; // TODO: correct plural
export const __DISPLAY_ORDER__ = 100; // TODO: sidebar order (lower = earlier)

/**
 * `slugFrom` — called ONLY on create (when no explicit slug), never on update.
 * Three-step fallback: explicit slug → derived from the label field → random suffix.
 */
export function __entity_type__SlugFrom(data: unknown): string {
  const d = (data ?? {}) as { slug?: string; title?: string };
  if (d.slug && d.slug.trim()) return slugify(d.slug);
  // TODO: replace `title` with your entity's label field.
  if (d.title && d.title.trim()) return slugify(d.title);
  return `${__ENTITY_TYPE__}-${randomSuffix()}`;
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}
