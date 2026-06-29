/**
 * Central identity for the `example-entity` type — kept free of backend/frontend
 * imports so neither entry pulls in the other's deps.
 *
 * Rename-map targets (see README): `example-entity` (type), `example_entity`
 * (table, snake_case — never the reserved word `table`), `/example-entities`
 * (pathPrefix).
 */

/** Entity `type` (kebab-case). Also the feature-slice tag slug. */
export const EXAMPLE_ENTITY_TYPE = 'example-entity';

/** SQLite index table identifier (snake_case). NEVER the reserved word `table`. */
export const EXAMPLE_ENTITY_TABLE = 'example_entity';

/** Router mount prefix (the host prepends `/api/projects/:id`). */
export const EXAMPLE_ENTITY_PATH_PREFIX = '/example-entities';

export const EXAMPLE_ENTITY_LABEL = 'Example Entity';
export const EXAMPLE_ENTITY_LABEL_PLURAL = 'Example Entities';

/** Sidebar ordering hint. */
export const EXAMPLE_ENTITY_DISPLAY_ORDER = 100;

/**
 * Normalize a human name into a kebab-case slug: NFKD-fold diacritics, lowercase,
 * collapse non-alphanumerics to single hyphens, trim edge hyphens.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Create-only slug derivation (host `slugFrom` slot). Prefers an explicit slug,
 * then `slugify(name)`, then a typed random fallback so a nameless create still
 * gets a stable, unique slug. Renames after creation go ONLY through `newSlug`.
 */
export function exampleEntitySlugFrom(data: unknown): string {
  const d = (data ?? {}) as { slug?: unknown; name?: unknown };
  if (typeof d.slug === 'string' && d.slug.trim()) return slugify(d.slug);
  if (typeof d.name === 'string' && d.name.trim()) return slugify(d.name);
  return `${EXAMPLE_ENTITY_TYPE}-${randomSuffix()}`;
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}
