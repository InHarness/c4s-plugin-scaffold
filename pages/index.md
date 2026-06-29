<!-- anchor: s6chuf2v -->
# Scaffold pluginu C4S — pusty, działający szablon

Ten projekt to **scaffold**: pusty, ale od razu działający plugin C4S. Po `degit` i uruchomieniu działa jako minimalny, generyczny plugin wnoszący jeden typ encji — **placeholder `example-entity`**. Autor pochodnego pluginu nie pisze go od zera: **renamuje placeholder** na swój typ encji (rename-map poniżej), a reguły struktury zostają bez zmian.

Specyfikacja **odwzorowuje budowę pluginu**, nie domenę przykładu. Placeholder jest tu wyłącznie nośnikiem, na którym pokazujemy kopertę, wkład typu encji i sloty — na jednym, generycznym, działającym typie.

<!-- anchor: izbrsg6k -->
## Trzy poziomy struktury

Wiążące rozróżnienie, które organizuje całą specyfikację:

1. **Plugin (koperta)** — `PluginManifest` + `contributes.*`. To **jedyny** poziom plugin-level. Plugin nie ma „backendu" ani „frontendu".
2. **Wkład typu encji (`EntityContribution`)** — plugin może wnosić **wiele** typów encji. Każdy ma własną tożsamość (`EntityModuleManifest`) i własne sloty.
3. **Sloty typu encji** — `serializer` (wym.), `systemPrompt` (wym.), `backend?`, `frontend?`. **`backend` i `frontend` należą do TYPU ENCJI, nie do pluginu.**

Konsekwencja dla układu stron: dokumentacja typu encji żyje w podkatalogu per typ — `pages/typy-encji/<type>/`. Scaffold dostarcza jeden taki podkatalog, `example-entity`, jako placeholder do renamu.

<!-- anchor: o15rbcbp -->
## Mapa warstw (L1–L9 + M05)

Zachowanie pluginu mapujemy 1:1 na warstwy i sloty:

- **L1 — migracje**: budują pochodny indeks SQLite (źródłem prawdy jest plik `.json`). Slot `backend`.
- **L3 — MCP-fabryka**: serwer narzędzi `${type}-tools` rejestrowany jako fabryka. Slot `backend`.
- **L4 — router/API**: trasy CRUD montowane pod `pathPrefix`. Slot `backend`.
- **L9 — serializer**: widoki danych (chip/card/row/detail + schema) oraz wydania (snapshot/restore/diff). Slot `serializer`.
- **M05 — frontend**: warstwa renderowania osadzeń (chip/card/row) w edytorze Tiptap i czacie agenta, plus ekrany (lista, detal) i edytor ze slash-komendą. Slot `frontend`.

<!-- anchor: 96kgapkx -->
## Rename-map — jak placeholder staje się Twoim typem

Po `degit` podmień **te tokeny** w całym scaffoldzie (kod, encje, strony, skill). To jedyna „ręczna" robota — reguły struktury przenoszą się 1:1:

| Token placeholdera | Co to jest | Podmień na |
| --- | --- | --- |
| `example-entity` | `type` wkładu encji + slug tabeli + tag feature-slice | swój `type` (kebab-case) |
| `example_entity` | identyfikator tabeli SQL (snake_case) | swoją tabelę (snake_case, nie `table`) |
| `/example-entities` | `pathPrefix` routera typu | swój `pathPrefix` |
| `ExampleEntity*` | nazwy DTO (`ExampleEntitySnapshot`, `ExampleEntityListItem`, …) | swoje DTO (PascalCase) |
| `/example-entity` | slash-komenda edytora | swoją slash-komendę |
| slug skilla `styl-specyfikacji-pluginu-c4s` | writing-style scaffoldu | własny slug, jeśli zmieniasz nazwę |

> `DOSTOSUJ:` powyższa tabela to kontrakt renamu. Token `example-entity` jest świadomie generyczny — to jedna rzecz do podmiany, nie przykład domenowy.

<!-- anchor: cfyapj50 -->
## Przekrój encji placeholdera

Wszystkie realne encje typu `example-entity` (tabela, DTO, endpointy, widoki) zebrane dynamicznie po tagu `example-entity`:

<tagged_list_mixed tags="example-entity" filter="or"/>

<!-- anchor: m7viz9pf -->
## Mapa stron

**Plugin-level (koperta):**

- @pages/koperta-i-manifest.md — `PluginManifest`, `contributes.*`, instalacja vs aktywacja, bramka `hostApiVersion`.
- @pages/acceptance-criteria.md — hub kryteriów akceptacji.
- @pages/synchronizacja.md — odniesienie do dokumentacji hosta (aktualny `HOST_API_VERSION` + wersja paczki + data).

**Typ encji `example-entity` (`pages/typy-encji/example-entity/`):**

- @pages/typy-encji/example-entity/index.md — `EntityContribution`: tożsamość, przegląd slotów, wspólne podstawy frontendu.
- @pages/typy-encji/example-entity/backend.md — slot `backend`: migracje, `mount(ctx)`, router/API, MCP-fabryka, serializer, `systemPrompt`.
- @pages/typy-encji/example-entity/frontend/podstrony.md — ekrany i nawigacja (lista, detal, `routes`).
- @pages/typy-encji/example-entity/frontend/edytor-i-agent.md — warstwa renderowania osadzeń (chip/card/row), edytor + slash.

<!-- anchor: h1628p90 -->
## Odniesienie do dokumentacji

Ten scaffold opisuje **konkretny plugin**, nie dokumentację C4S. Źródłem prawdy o kontrakcie Host API (wartości wersji, sygnatury) jest dokumentacja hosta, odpytywana przez peer `ask` i utrwalana w jednym miejscu — @pages/synchronizacja.md. Wersji nie rozsiewamy po stronach.
