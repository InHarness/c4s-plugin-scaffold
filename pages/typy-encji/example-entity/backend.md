<!-- anchor: yk2tvv7e -->
# Slot backend (example-entity)

`backend` to **opcjonalny slot typu encji** (nie pluginu). Skupia warstwy danych i API: migracje indeksu (L1), montaż serwisu (`mount`), router HTTP (L4), fabrykę MCP (L3) oraz — opisane tu razem — serializer (L9) i `systemPrompt`. Źródłem prawdy danych jest plik `.json`; SQLite to **pochodny indeks** budowany migracjami.

<!-- anchor: vobvfsda -->
## Indeks i migracje (L1)

Encja żyje w pliku `.json`; tabela jest indeksem do zapytań. Migracje budują schemat **wyłącznie naprzód** i są **idempotentne** — ponowne uruchomienie nie zmienia schematu. Identyfikator SQL jest snake_case (`example_entity`), nigdy słowem zarezerwowanym `table`.

<single_element type="database-table" slug="example-entity"/>

Minimalny kontrakt migracji (ilustracyjnie):

```ts
interface SqlMigration {
  id: string;                       // stabilny identyfikator (kolejność)
  up(db: Database): void | Promise<void>;  // tylko naprzód; idempotentne (IF NOT EXISTS)
}

// EntityBackend.migrations: SqlMigration[]
```

<!-- anchor: 4rl8hskv -->
## mount(ctx) — montaż serwisu

`mount(ctx)` uruchamia warstwę danych typu: tworzy serwis, montuje router pod `pathPrefix`, rejestruje fabrykę MCP i serwis encji. `MountContext` daje dostęp do hosta:

```ts
interface MountContext {
  app: Express;  // ctx.app.use(pathPrefix, router)
  registerMcpServer(name: string, factory: McpServerFactory): void;
  registerEntityService(type: string, service: EntityService): void;
  // … dostęp do bazy i konfiguracji hosta
}

function mount(ctx: MountContext): void | Promise<void>;
```

<!-- anchor: 402o7w87 -->
## Router i API (L4)

Router montowany pod `pathPrefix` (`/example-entities`) wnosi 6 tras CRUD plus `restore`. Każda trasa jest spięta z DTO (request/response) — szczegóły kontraktu żyją w encjach endpointów:

<element_list type="endpoint" slugs="get-example-entities,get-example-entities-slug,post-example-entities,patch-example-entities-slug,delete-example-entities-slug,post-example-entities-slug-restore"/>

Reguły obserwowalne tras: lista zwraca lekkie elementy (bez `data`), tworzenie liczy slug ze `slugify(name)`, rename tylko przez `newSlug`, a `restore` to idempotentny UPSERT używany przy boot/file-watch i odtwarzaniu wydań.

<!-- anchor: bdrgbxvj -->
### Kontrakty danych (DTO)

DTO są wyłącznie dla API przykładowej encji. <inline_mention type="dto" slug="example-entity-snapshot"/> pełni potrójną rolę: kształt pliku `.json`, body odpowiedzi `GET`/`POST` oraz body żądania <inline_mention type="endpoint" slug="post-example-entities-slug-restore"/>:

<element_list type="dto" slugs="example-entity-snapshot,example-entity-list-item,create-example-entity-request,update-example-entity-request"/>

<!-- anchor: lbpmwnah -->
## Fabryka MCP (L3)

Serwer narzędzi MCP rejestrowany jest jako **fabryka**, nie gotowa instancja: `ctx.registerMcpServer('example-entity-tools', factory)`. Host tworzy instancję per kontekst (per projekt/wątek), więc fabryka nie może trzymać współdzielonego stanu globalnego.

<!-- anchor: 18rlzap8 -->
## Serializer (L9)

`serializer` (wymagany slot typu) dostarcza **widoki danych** encji oraz operacje **wydań**:

```ts
interface EntitySerializer<T> {
  schema: EntitySchema;
  inlineMention(e: T): View;
  singleElement(e: T): View;
  elementListItem(e: T): View;
  taggedListItem(e: T): View;
  detail(e: T): View;
  snapshot(e: T): ExampleEntitySnapshot;   // deterministyczny
  restore(s: ExampleEntitySnapshot): T;     // idempotentny UPSERT
  diff(a: Snapshot, b: Snapshot): Diff;
}
```

Dwie reguły są obserwowalne i krytyczne dla wydań: `snapshot()` jest **deterministyczny** (ten sam stan → identyczny <inline_mention type="dto" slug="example-entity-snapshot"/>, stabilna kolejność pól), a `restore()` to **idempotentny UPSERT** (powtórzenie tym samym snapshotem nie zmienia wyniku). `diff()` porównuje dwa snapshoty na potrzeby przeglądu wydań.

<!-- anchor: dp1he0ve -->
## systemPrompt

`systemPrompt` (wymagany slot typu) wnosi do promptu agenta trzy elementy: rzeczownik roli, zapytanie statystyczne i linię opisu narzędzi:

```ts
interface SystemPromptContribution {
  roleNoun: string;                 // np. 'przykładowymi encjami'
  countStat: { sqlQuery: string };  // SELECT count(*) FROM example_entity
  mcpToolsLine: string;             // jednolinijkowy opis narzędzi 'example-entity-tools'
}
```

<!-- anchor: pho2qois -->
## Kryteria akceptacji backendu

<tagged_list type="ac" tags="backend" filter="or"/>
