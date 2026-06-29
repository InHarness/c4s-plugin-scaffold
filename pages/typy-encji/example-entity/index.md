<!-- anchor: tou7gqpg -->
# Typ encji: example-entity

`example-entity` to **generyczny placeholder** — jeden, działający typ encji, na którym scaffold pokazuje pełny `EntityContribution`. To jest „rzecz do renamu": autor pochodny podmienia tokeny z rename-mapy (@pages/index.md) i dostaje własny typ, zachowując strukturę slotów.

> `DOSTOSUJ:` `type` `example-entity`, tabela <inline_mention type="database-table" slug="example-entity"/>, `pathPrefix` `/example-entities`, DTO `ExampleEntity*` — podmień na swoje. Reguły slotów nie zmieniają się.

<!-- anchor: tghcgsek -->
## EntityContribution — tożsamość plus sloty

Wkład typu encji to tożsamość (`EntityModuleManifest`) plus zestaw slotów. Dwa sloty są wymagane, dwa opcjonalne:

```ts
interface EntityContribution {
  manifest: EntityModuleManifest;
  serializer: EntitySerializer<T>;         // WYMAGANY — widoki danych + wydania
  systemPrompt: SystemPromptContribution;  // WYMAGANY — rola/statystyka/linia narzędzi
  backend?: EntityBackend;                  // opcjonalny — migracje, mount, API, MCP
  frontend?: EntityFrontend;               // opcjonalny — render-sloty, ekrany, edytor
}

interface EntityModuleManifest {
  type: string;        // 'example-entity'  — identyfikator typu
  table: string;       // 'example_entity'  — snake_case, nigdy 'table'
  label: string;       // etykieta pojedyncza
  labelPlural: string; // etykieta mnoga
  displayOrder?: number;
  slugFrom: string;    // pole, z którego liczony jest slug (slugify)
  pathPrefix: string;  // '/example-entities' — prefiks routera typu
}
```

`backend` i `frontend` należą do **typu encji**, nie do pluginu — dlatego mają osobne podstrony, a nie poziom plugin-level.

<!-- anchor: 7wfk1kgz -->
## Przegląd slotów

- **`serializer`** (wym.) — widoki danych i wydania (snapshot/restore/diff). Opisany przy backendzie: @pages/typy-encji/example-entity/backend.md.
- **`systemPrompt`** (wym.) — `roleNoun`, `countStat.sqlQuery`, `mcpToolsLine`. Też przy backendzie.
- **`backend`** (opc.) — migracje (L1), `mount(ctx)`, router/API (L4), MCP-fabryka (L3): @pages/typy-encji/example-entity/backend.md.
- **`frontend`** (opc.) — render-sloty osadzeń oraz ekrany; rozbity na dwie podstrony: @pages/typy-encji/example-entity/frontend/podstrony.md (ekrany/nawigacja) i @pages/typy-encji/example-entity/frontend/edytor-i-agent.md (renderowanie osadzeń, edytor + slash).

<!-- anchor: 9rc6k4an -->
## Stany rejestracji typu

Typ encji jest widziany przez host w jednym ze stanów:

- **`active`** — plugin aktywny, typ przeszedł filtr `config.entities`, sloty zamontowane.
- **`inactive`** — plugin zainstalowany, ale typ wyłączony (`config.entities`) lub plugin przed aktywacją.
- **`unknown`** — w danych istnieją encje tego typu, lecz żaden aktywny plugin go aktualnie nie dostarcza (np. plugin wyłączony). Host renderuje wtedy stan „broken" referencji (patrz `renderChip`).

<!-- anchor: hici2rj8 -->
## Wspólne podstawy slotu frontend

Podstawy są wspólne dla obu podstron frontendu, więc opisujemy je tu raz (nie w `frontend/index.md` — takiego pliku nie ma):

- **Model trójwarstwowy**: *czysty komponent* (bez zależności od hosta, dane przez propsy/hooki) → *host-resolver* (wiąże komponent z kontekstem hosta) → *Host UI Kit* (`EntityListRow`, `ListPageLayout`, `TagFilterBar`, …). Komponenty pluginu pozostają czyste i testowalne; integracja z hostem żyje w resolverze.
- **Externalizacja w Vite**: `@c4s/plugin-runtime/ui` jest **externalizowane** w buildzie — plugin nie pakuje własnej kopii Host UI Kit ani Reacta, tylko korzysta z instancji hosta.
- **Stylowanie `--c-*`**: komponenty używają tokenów CSS hosta (zmienne `--c-*`), więc dziedziczą motyw aplikacji bez twardych kolorów.

<!-- anchor: mnr9vrdu -->
## Przekrój encji tego typu

<tagged_list_mixed tags="example-entity" filter="or"/>
