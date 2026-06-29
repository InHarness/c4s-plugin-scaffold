---
type: brief
source: release-diff
from_release: null
to_release: v0.0.1
generated_at: '2026-06-29T22:43:36.793Z'
generator_version: brief-author@0.1
implemented: false
---
# Brief początkowy: v0.0.1 — scaffold pluginu C4S

> Pierwszy release projektu. **Brak poprzednika** — poniżej opisany jest stan systemu „od zera", a nie różnica względem wcześniejszej wersji. Wszystkie encje i strony powstały w tym release (`op:create`).

## Czym jest ten release

v0.0.1 to **scaffold pluginu C4S**: generyczny, pusty, ale w pełni działający szablon, z którego autor pochodnego pluginu buduje swój plugin przez `degit` + rename-map. Specyfikacja odwzorowuje realną anatomię pluginu (koperta → `contributes` → sloty; warstwy L1–L9 + M05) na **jednym** placeholderowym typie encji `example-entity`.

Zawartość: **31 encji** (6 endpointów, 4 DTO, 3 widoki UI, 18 kryteriów akceptacji) + **8 stron** narracyjnych + **6 tagów** feature-slice. `check_consistency`: 0 błędów, 0 ostrzeżeń.

**Architektura danych:** źródłem prawdy są pliki `.json` per encja; tabela SQLite `example_entity` to **pochodny indeks** budowany przez migracje (L1). Tabela nazwana jest w `snake_case` i nigdy nie używa zarezerwowanego słowa `table`.

**Luka do odnotowania:** w v0.0.1 **nie istnieje osobna encja typu `database-table`**. Tabela `example_entity` jest opisana wyłącznie w narracji backendu i pinowana przez kryteria akceptacji (`verifies[] → database-table/example-entity`), ale nie ma jeszcze modelowanej encji bazodanowej. Kandydat do domodelowania w kolejnym release.

## Koperta i manifest (PluginManifest)

Koperta pluginu to obiekt `PluginManifest` (sygnatury ilustracyjne; pełne typy w docs hosta):

```ts
interface PluginManifest {
  name: string;
  version: string;            // semver samego pluginu
  hostApiVersion: string;     // wymagany zakres semver dla HOST_API_VERSION hosta
  engines?: Record<string, string>;   // np. engines.node
  onUnregister?(): void | Promise<void>;  // idempotentny, NIGDY nie rzuca
  contributes: Contributes;
}
```

`contributes` wystawia wkłady pluginu. **Tylko tablica `entities` jest filtrowana** przez `config.entities`; pozostałe pola są rejestrowane zawsze:

```ts
interface Contributes {
  entities: EntityContribution[];   // filtrowane przez config.entities
  writingStyles?: WritingStyle[];   // zawsze rejestrowane
  settings?: SettingsSchema;        // zawsze rejestrowane
  commands?: Command[];             // zawsze rejestrowane
  // systemPromptBlocks?            // slot przyszły, jeszcze nie zakontraktowany
}
```

Wkład typu encji (`EntityContribution`) ma 2 sloty wymagane i 2 opcjonalne:

- `serializer: EntitySerializer<T>` — **wymagany** (warstwa L9)
- `systemPrompt: SystemPromptContribution` — **wymagany**
- `backend?: EntityBackend` — opcjonalny (warstwy L1/L3/L4)
- `frontend?: EntityFrontend` — opcjonalny (M05)

Manifest modułu encji (`EntityModuleManifest`): `type` (kebab-case), `table` (snake_case, nigdy `table`), `label`, `labelPlural`, `displayOrder?`, `slugFrom` (pole do `slugify`), `pathPrefix` (np. `/example-entities`).

Stany rejestracji typu encji: `active`, `inactive`, `unknown` (typ widoczny w danych, ale żaden aktywny plugin go nie dostarcza → wyzwala render „broken" przez `renderChip`).

**Bramka Host API:** plugin aktywuje się tylko gdy `semver.satisfies(HOST_API_VERSION, manifest.hostApiVersion)`; niezgodność rzuca `PLUGIN_HOST_API_MISMATCH` i blokuje aktywację (plugin pozostaje zainstalowany, lecz nieaktywny). Analogiczna bramka dla `engines.node`: `PLUGIN_ENGINE_UNSATISFIED`.

## Model danych (DTO)

Cztery DTO (brak modelowanej encji `database-table` — kolumny indeksu SQLite odzwierciedlają pola `ExampleEntitySnapshot`):

**`CreateExampleEntityRequest`** — ciało żądania `POST` (tworzenie). `slug` **nie** jest przyjmowany z ciała — jest wyliczany przez `slugify(name)`.
```
name: string          // wymagane
description?: string
data?: object
```

**`UpdateExampleEntityRequest`** — ciało żądania `PATCH` (częściowa aktualizacja). Zmiana nazwy nie rusza sluga; rename tylko przez `newSlug`.
```
name?: string
description?: string
data?: object
newSlug?: string      // jawny rename — repointuje referencje stron i FK
```

**`ExampleEntityListItem`** — projekcja listy zwracana przez endpoint listujący (lekka, **bez ciężkiego pola `data`**).
```
slug: string          // PK encji
name: string
description?: string
updatedAt: string     // ISO 8601, do sortowania listy
```

**`ExampleEntitySnapshot`** — wyjście `snapshot()` serializera. Pełni potrójną rolę: kształt pliku `.json` (źródło prawdy) + ciało odpowiedzi `GET :slug` i `POST` + ciało żądania `restore`.
```
slug: string          // kebab-case PK, stabilny; zmiana tylko przez newSlug
name: string
description?: string
data?: object          // dowolny JSON; placeholder pod schemat pochodnego pluginu
createdAt: string      // ISO 8601
updatedAt: string      // ISO 8601
```

## Backend: API (L4), MCP (L3), migracje (L1), serializer (L9)

**L4 — API (6 tras pod `pathPrefix` `/example-entities`):**

| Metoda + ścieżka | Cel | Żądanie | Odpowiedź | Statusy / uwagi |
|---|---|---|---|---|
| `GET /example-entities` | lista | query: `tags` (CSV), `filter` (`and`\|`or`, domyślnie `or`) | `ExampleEntityListItem[]` (bez `data`) | 200; filtr po tagach przez `listByTags` |
| `POST /example-entities` | tworzenie | `CreateExampleEntityRequest` | `ExampleEntitySnapshot` | 201; `slug = slugify(name)`; zapis `.json` + odświeżenie indeksu |
| `GET /example-entities/:slug` | detal | — | `ExampleEntitySnapshot` | 200; **404** gdy brak sluga |
| `PATCH /example-entities/:slug` | edycja | `UpdateExampleEntityRequest` | `ExampleEntitySnapshot` | 200; rename tylko przez `newSlug` (repoint referencji + FK); 404 |
| `DELETE /example-entities/:slug` | usunięcie | — | — | 204; twarde usunięcie (`.json` + wiersz indeksu); **bez kaskady** — miękkie FK raportowane jako wiszące, nie usuwane |
| `POST /example-entities/:slug/restore` | odtworzenie | `ExampleEntitySnapshot` | (UPSERT) | **idempotentny UPSERT** ze snapshotu; używany przy bootcie, file-watch i odtwarzaniu release |

Montaż warstwy: `mount(ctx: MountContext)` wiąże `ctx.app.use(pathPrefix, router)`, `ctx.registerMcpServer(...)`, `ctx.registerEntityService(type, service)`.

**L3 — MCP:** serwer MCP encji rejestrowany jako **fabryka**, nie gotowa instancja: `ctx.registerMcpServer('${type}-tools', factory)` (brak współdzielonego stanu globalnego).

**L1 — migracje:** budują pochodny indeks SQLite (źródło prawdy = plik `.json`). Schemat **tylko naprzód** i **idempotentny** (`IF NOT EXISTS`); ponowne uruchomienie nie zmienia schematu ani danych. Tabela `example_entity` (snake_case).

**L9 — serializer:** widoki danych (`inlineMention` / `singleElement` / `elementListItem` / `taggedListItem` / `detail`) + operacje release (`snapshot` / `restore` / `diff`). `snapshot()` jest **deterministyczny** (stabilna kolejność pól); `restore()` to idempotentny UPSERT.

**System prompt encji** (`SystemPromptContribution`): `roleNoun: string`, `countStat: { sqlQuery: string }` (np. `SELECT count(*) FROM example_entity`), `mcpToolsLine: string`.

## Frontend (M05)

Trzy widoki UI, wszystkie czysto prezentacyjne (dane wyłącznie przez hooki, brak bezpośrednich wywołań API):

- **`example-entity-list` — ekran listy** (`/example-entities`). Kompozycja (nie slot): `sidebarTab` + `routes` + komponenty Host UI Kit (`EntityListRow`, `ListPageLayout`, `TagFilterBar`) zasilane przez `listByTags`. Query: `tags` (CSV), `filter` (`and`\|`or`, domyślnie `or`). Wiersze renderowane przez `EntityListRow`, **nie** przez slot `renderRow`.
- **`example-entity-detail` — panel detalu** (`/example-entities/:slug`). Wypełnia slot `detailPanel` (`ViewKind: detail`, **wymagany**; `sidebarTab` i `routes` opcjonalne). Dane przez `useGetBySlug`; renderuje stany ładowania i „nie znaleziono". Model trójwarstwowy: czysty komponent → host-resolver → Host UI Kit.
- **`example-entity-editor` — osadzenie w edytorze** (bez routingu). Wstawiane slash-komendą `/example-entity` przez `editorExtensions`. Trzy sloty render:
  - `renderChip` — inline mention; **jedyny** slot przyjmujący `entity: T | null` i renderujący stan „broken" (wisząca referencja).
  - `renderCard` — pojedynczy element (zawsze `entity` non-null).
  - `renderRow` — **tylko** listy osadzone w treści (`element_list` / `tagged_list`); nigdy ekran listy.

Hooki danych: `useGetBySlug(slug) → { entity: T | null; loading: boolean }`, `listByTags(tags, filter) → T[]`.

Build: `@c4s/plugin-runtime/ui` jest externalizowany w Vite (plugin nie bundluje własnej kopii Host UI Kit ani Reacta). Theming przez tokeny CSS `--c-*`. Slot `stateSlice` jest przyszłym no-opem (rezerwuje przestrzeń współdzielonego stanu, bez zachowania w scaffoldzie).

## Kryteria akceptacji (18)

Każde AC = jedno obserwowalne zachowanie, wiązane z encjami przez `verifies[]`.

**Koperta / manifest:**
- `ac-host-api-gate` — aktywacja tylko gdy `semver.satisfies(HOST_API_VERSION, hostApiVersion)`; niezgodność → `PLUGIN_HOST_API_MISMATCH`, blokada aktywacji.
- `ac-on-unregister-idempotent` — `onUnregister()` idempotentny i nigdy nie rzuca.
- `ac-config-entities-filter` — `config.entities` filtruje wyłącznie `entities[]`, nie rusza `writingStyles`/`settings`/`commands`.

**L1 — migracje / tabela:**
- `ac-table-snake-case` — indeks nazwany `example_entity` (snake_case), nigdy zarezerwowane `table`. (`verifies: database-table/example-entity`)
- `ac-migrations-forward-idempotent` — migracje tylko naprzód i idempotentne; ponowne uruchomienie nie zmienia schematu ani danych. (`verifies: database-table/example-entity`)

**L3 — MCP:**
- `ac-mcp-factory` — serwer MCP rejestrowany jako fabryka (`registerMcpServer('${type}-tools', factory)`), nie gotowa instancja.

**L4 — backend API:**
- `ac-slug-from-name` — przy tworzeniu `slug = slugify(name)`; slug nie jest przyjmowany z ciała. (`verifies: database-table/example-entity`, `dto/create-example-entity-request`, `endpoint/post-example-entities`)
- `ac-get-slug-404` — `GET /example-entities/:slug` zwraca 404 gdy brak encji o danym slugu. (`verifies: endpoint/get-example-entities-slug`)
- `ac-list-returns-listitem` — `GET /example-entities` zwraca lekkie `ExampleEntityListItem` (bez `data`), nie pełne snapshoty. (`verifies: dto/example-entity-list-item`, `endpoint/get-example-entities`)
- `ac-delete-no-cascade` — `DELETE :slug` nie kaskaduje miękkich FK; referencje do usuniętej encji raportowane jako wiszące, nie usuwane. (`verifies: endpoint/delete-example-entities-slug`)
- `ac-rename-via-newslug` — zmiana nazwy nie rusza sluga; rename tylko przez `newSlug`, repointuje referencje stron i FK. (`verifies: dto/update-example-entity-request`, `endpoint/patch-example-entities-slug`)

**L9 — serializer:**
- `ac-snapshot-deterministic` — `snapshot()` deterministyczny; ten sam stan → identyczny `ExampleEntitySnapshot` (stabilna kolejność pól). (`verifies: dto/example-entity-snapshot`, `endpoint/get-example-entities-slug`)
- `ac-restore-idempotent-upsert` — `POST :slug/restore` to idempotentny UPSERT ze snapshotu; powtórzenie z tym samym snapshotem nie zmienia wyniku. (`verifies: dto/example-entity-snapshot`, `endpoint/post-example-entities-slug-restore`)

**Frontend (M05):**
- `ac-render-presentational` — sloty `renderChip`/`renderCard`/`renderRow` czysto prezentacyjne; dane tylko przez `useGetBySlug`, bez bezpośrednich wywołań API. (`verifies: ui-view/example-entity-editor`)
- `ac-detailpanel-usegetbyslug` — panel detalu (`ViewKind: detail`) ładuje encję po slugu przez `useGetBySlug`, renderuje stany ładowania i „nie znaleziono". (`verifies: ui-view/example-entity-detail`)
- `ac-list-screen-entitylistrow` — ekran listy renderuje wiersze przez `EntityListRow` z Host UI Kit, nie przez slot `renderRow`. (`verifies: ui-view/example-entity-list`)
- `ac-renderchip-broken-state` — `renderChip` (inline mention) to jedyny slot renderujący stan „broken"; przyjmuje `entity = null` i pokazuje placeholder wiszącej referencji. (`verifies: ui-view/example-entity-editor`)
- `ac-renderrow-embedded-only` — slot `renderRow` wołany tylko dla list osadzonych (`element_list`/`tagged_list`), nigdy dla ekranu listy. (`verifies: ui-view/example-entity-editor`, `ui-view/example-entity-list`)

## Synchronizacja z docs hosta

Kontrakt Host API utrwalony w `pages/synchronizacja.md` (jedyne źródło wartości wersji — nie duplikowane po stronach):

- `HOST_API_VERSION` = **`1.0.0`**
- Paczka runtime: **`@inharness-ai/claude4spec`**, wersja **`1.0.24`**
- Bramka wersji: `PLUGIN_HOST_API_MISMATCH`; bramka silnika (`engines.node`): `PLUGIN_ENGINE_UNSATISFIED`
- Kierunek bramki: `semver.satisfies(HOST_API_VERSION, manifest.hostApiVersion)` — host sprawdza, że jego wersja spełnia zadeklarowany zakres pluginu; niezgodność → plugin zainstalowany, lecz nieaktywny
- Docs odpytywane przez peera `"C4S - Plugins Docs"` mechanizmem `ask` (wartości nigdy nie kopiowane do stron)
- Odświeżanie: skill na żądanie `synchronizacja-z-dokumentacja` (czytaj tabelę → `ask` o aktualny blok wersji → brak różnicy: aktualizacja daty; różnica: `update_plan`, implementacja, aktualizacja tabeli, nowy release)
- Ostatnie sprawdzenie: **`2026-06-30`**

## Tagi feature-slice (6)

- `koperta` — reguły koperty: bramka wersji, filtr encji, idempotentny `onUnregister()`
- `backend` — warstwa danych i API: migracje, slug, lista vs snapshot, rename, fabryka MCP
- `serializer` — determinizm `snapshot()` i idempotencja `restore()`
- `frontend` — sloty render, ekran listy, panel detalu, stan „broken"
- `example-entity` — przekrojowy tag zbierający wszystkie encje placeholdera (tabela, DTO, endpointy, widoki)
- `styl-specyfikacji-pluginu-c4s` — slug wkładu writing-style scaffoldu

## Strony narracyjne (8)

- `index.md` — przegląd pluginu na poziomie koperty
- `koperta-i-manifest.md` — `PluginManifest`, `contributes.*`, sloty wkładu encji
- `acceptance-criteria.md` — zbiorcze AC
- `synchronizacja.md` — mechanizm i wartości kontraktu Host API
- `typy-encji/example-entity/index.md` — tożsamość typu encji
- `typy-encji/example-entity/backend.md` — L1 migracje, L3 MCP, L4 router/API, L9 serializer
- `typy-encji/example-entity/frontend/podstrony.md` — ekran listy i panel detalu
- `typy-encji/example-entity/frontend/edytor-i-agent.md` — osadzenie w edytorze + slash-komenda / agent

## Dla implementujących (rename-map + konkretne cele edycji)

Scaffold uruchamia się po `degit`; jedyny ręczny krok to **rename-map** (podmiana placeholdera na własny typ encji):

| Token | Co to jest | Podmień na |
|---|---|---|
| `example-entity` | `type` encji, slug tabeli, tag feature-slice | twój typ (kebab-case) |
| `example_entity` | identyfikator tabeli SQL (snake_case) | twoja tabela (snake_case, nie `table`) |
| `/example-entities` | `pathPrefix` routera | twój `pathPrefix` |
| `ExampleEntity*` | nazwy DTO (`ExampleEntitySnapshot`, `ExampleEntityListItem`, `CreateExampleEntityRequest`, `UpdateExampleEntityRequest`) | twoje DTO (PascalCase) |
| `/example-entity` | slash-komenda edytora | twoja slash-komenda |
| `styl-specyfikacji-pluginu-c4s` | slug writing-style | twój slug (jeśli zmieniasz nazwę) |

Konkretne cele edycji przy budowie pochodnego pluginu:

- **Manifest** (`PluginManifest`): ustaw `name`, `version`, `hostApiVersion` (zakres względem `HOST_API_VERSION=1.0.0`); zaimplementuj idempotentny `onUnregister()`. W `EntityModuleManifest` ustaw `type`, `table`, `label`/`labelPlural`, `slugFrom`, `pathPrefix`.
- **L1 migracja:** indeks SQLite forward-only, idempotentny (`CREATE TABLE IF NOT EXISTS ...`), kolumny odzwierciedlające pola `ExampleEntitySnapshot` (`slug` PK, `name`, `description`, `data` JSON, `created_at`, `updated_at`). **Rozważ domodelowanie encji `database-table`** — w v0.0.1 jej brak, choć AC ją pinują (`verifies → database-table/example-entity`).
- **L3 MCP:** rejestracja przez fabrykę `ctx.registerMcpServer('${type}-tools', factory)`.
- **L4 API:** 6 tras pod `pathPrefix` (lista zwraca `*ListItem` bez `data`; `slug = slugify(name)`; rename tylko `newSlug`; `restore` = idempotentny UPSERT; `DELETE` bez kaskady FK).
- **L9 serializer:** `snapshot()` deterministyczny (stabilna kolejność pól), `restore()` idempotentny; widoki `inlineMention`/`singleElement`/`elementListItem`/`taggedListItem`/`detail`.
- **System prompt:** zaktualizuj `countStat.sqlQuery` (np. `SELECT count(*) FROM <twoja_tabela>`), `roleNoun`, `mcpToolsLine`.
- **M05 frontend:** wymagany slot `detailPanel` (`useGetBySlug`, stany loading/not-found); `renderChip` obsługuje `entity=null` (stan „broken"); ekran listy składaj z `EntityListRow`/`ListPageLayout`/`TagFilterBar` zasilanych `listByTags`; zostaw `@c4s/plugin-runtime/ui` externalizowane w Vite.
- **Synchronizacja:** po zmianach kontraktu hosta uruchom skill `synchronizacja-z-dokumentacja` i zaktualizuj `pages/synchronizacja.md`.
