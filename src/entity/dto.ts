/**
 * The four DTOs of the `example-entity` data model. Rename the `ExampleEntity*`
 * symbols (PascalCase) to your own entity when adapting the scaffold.
 *
 * Weight split: the list endpoint returns the lightweight `ExampleEntityListItem`
 * (no heavy `data`), while GET/POST/restore use the full `ExampleEntitySnapshot`.
 */

/**
 * Full entity shape. Plays a triple role: the `.json` source-of-truth file format,
 * the `GET :slug` / `POST` response body, AND the `restore` request body.
 * `snapshot()` emits this with a STABLE field order (determinism).
 */
export interface ExampleEntitySnapshot {
  /** kebab-case PK = `slugify(name)`; stable — change only via `newSlug`. */
  slug: string;
  name: string;
  description?: string;
  /** Arbitrary JSON; placeholder for the derived plugin's own schema. */
  data?: Record<string, unknown>;
  /** ISO 8601. */
  createdAt: string;
  /** ISO 8601. */
  updatedAt: string;
}

/** `POST /example-entities` body. `slug` is NOT accepted — it is `slugify(name)`. */
export interface CreateExampleEntityRequest {
  name: string;
  description?: string;
  data?: Record<string, unknown>;
}

/** `PATCH /example-entities/:slug` body. A name change does NOT move the slug. */
export interface UpdateExampleEntityRequest {
  name?: string;
  description?: string;
  data?: Record<string, unknown>;
  /** Explicit rename — repoints page references and FKs. */
  newSlug?: string;
}

/** `GET /example-entities` projection — lightweight, intentionally omits `data`. */
export interface ExampleEntityListItem {
  /** PK. */
  slug: string;
  name: string;
  description?: string;
  /** ISO 8601, for list sorting. */
  updatedAt: string;
}
