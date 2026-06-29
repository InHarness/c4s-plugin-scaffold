<!-- anchor: yqhlg8qd -->
# Frontend: ekrany i nawigacja (example-entity)

Ta podstrona opisuje **ekrany** typu encji: wejście w pasku bocznym, trasy oraz panel detalu. Wspólne podstawy frontendu (model trójwarstwowy, externalizacja Vite, tokeny `--c-*`) są w nadrzędnym @pages/typy-encji/example-entity/index.md i nie powtarzamy ich tu.

Warstwa renderowania osadzeń (chip/card/row) i edytor mają osobną podstronę: @pages/typy-encji/example-entity/frontend/edytor-i-agent.md.

<!-- anchor: uk7c1gtq -->
## Sloty ekranów we frontendzie

```ts
interface EntityFrontend {
  detailPanel: DetailPanel;   // WYMAGANY — ViewKind: detail
  sidebarTab?: SidebarTab;    // opcjonalny — wejście do listy
  routes?: RouteDef[];        // opcjonalny — montuje stronę listy + ekran detalu
  // render-sloty (renderChip/renderCard/renderRow), editorExtensions, stateSlice:
  //   patrz frontend/edytor-i-agent
}
```

<!-- anchor: cm51huas -->
## Ekran listy — kompozycja, nie slot

**Ekran listy nie jest slotem.** Powstaje jako kompozycja: `sidebarTab` (wejście) + `routes` (montaż strony pod `pathPrefix`) + komponenty Host UI Kit (`EntityListRow`, `ListPageLayout`, `TagFilterBar`) zasilane **własnym hookiem listy** (`listByTags`). Wiersze renderuje `EntityListRow` z Host UI Kit — **nie** slot `renderRow`. To częsta pomyłka: `renderRow` służy wyłącznie osadzonym listom w treści (patrz edytor-i-agent).

<single_element type="ui-view" slug="example-entity-list"/>

Ekran listy filtruje po tagach (parametry `tags` + `filter` w URL, komponent `TagFilterBar`) i pokazuje lekkie elementy <inline_mention type="dto" slug="example-entity-list-item"/> — bez pola `data`.

<!-- anchor: dpbe6bwv -->
## Panel detalu

`detailPanel` to **wymagany** slot frontendu (`ViewKind: detail`). Ładuje encję po slugu hookiem `useGetBySlug`, renderuje stany ładowania i braku encji, a dane prezentuje przez model trójwarstwowy.

<single_element type="ui-view" slug="example-entity-detail"/>

<!-- anchor: 47qyzevy -->
## Routes

`routes` montuje dwie ścieżki względem `pathPrefix`:

- **`pathPrefix`** (`/example-entities`) — strona listy.
- **`pathPrefix/:slug`** (`/example-entities/:slug`) — ekran detalu (panel `detailPanel`).

`sidebarTab` daje wejście do listy; `routes` wiąże adres z ekranem. Oba są opcjonalne — typ encji może istnieć bez nawigacji (np. tylko osadzenia w treści).

<!-- anchor: ts1o88t7 -->
## Kryteria akceptacji ekranów

<tagged_list type="ac" tags="frontend" filter="or"/>
