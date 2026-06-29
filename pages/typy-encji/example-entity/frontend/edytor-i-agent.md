<!-- anchor: yojuv1fz -->
# Frontend: edytor i renderowanie osadzeń (example-entity)

Ta podstrona opisuje **warstwę renderowania osadzeń** typu encji — render-sloty wywoływane wszędzie, gdzie encja pojawia się w treści: w edytorze Tiptap i w czacie agenta (react-markdown). Wspólne podstawy frontendu są w nadrzędnym @pages/typy-encji/example-entity/index.md; ekrany i nawigacja — w @pages/typy-encji/example-entity/frontend/podstrony.md.

<single_element type="ui-view" slug="example-entity-editor"/>

<!-- anchor: tv956z0o -->
## Render-sloty osadzeń

Każdy tag osadzenia mapuje się na dokładnie jeden render-slot. Sloty są **czysto prezentacyjne** — nie wykonują własnych zapytań do API, biorą dane wyłącznie z hooków:

```ts
interface EntityFrontend {
  renderChip(ctx: { entity: T | null }): ReactNode;  // inline_mention
  renderCard(ctx: { entity: T }): ReactNode;         // single_element
  renderRow(ctx: {                                   // element_list_item | tagged_list_item
    entity: T;
    variant: 'element_list_item' | 'tagged_list_item';
  }): ReactNode;
  // hooki danych:
  useGetBySlug(slug: string): { entity: T | null; loading: boolean };
  listByTags(tags: string[], filter: 'and' | 'or'): T[];
  // edytor + stan:
  editorExtensions: Extension[];   // Tiptap; slash-komenda '/example-entity'
  stateSlice?: StateSlice;         // przyszły no-op
}
```

Trzy reguły rozdzielają odpowiedzialności slotów:

- **`renderChip` to jedyne miejsce stanu „broken"** — przyjmuje `entity: T | null`. Gdy referencja wskazuje nieistniejącą lub nieaktywną encję (`null`), chip renderuje placeholder zepsutej referencji. `renderCard` i `renderRow` dostają zawsze encję niepustą.
- **`renderRow` tylko dla osadzonych list** — jest wywoływany wyłącznie dla `element_list_item` / `tagged_list_item` w treści, **nigdy** dla ekranu listy (ten używa `EntityListRow` z Host UI Kit — patrz podstrony).
- **Dane przez hooki** — `useGetBySlug` (pojedyncza encja po slugu) i `listByTags` (lista po tagach). Sloty nie wołają API bezpośrednio.

<!-- anchor: lohrx8vk -->
## editorExtensions i slash-komenda

`editorExtensions` wnosi rozszerzenia Tiptap, w tym **slash-komendę `/example-entity`**, która wstawia osadzenie encji do strony. Po wstawieniu osadzenie renderuje się przez odpowiedni render-slot i pobiera świeże dane z indeksu — proza nie rozjeżdża się z encją.

> `DOSTOSUJ:` slash-komenda `/example-entity` → Twoja (np. `/note`, `/ticket`). Nazwa slash-komendy zwykle pochodzi od `type`.

<!-- anchor: p5figv1m -->
## stateSlice

`stateSlice` to **slot przyszły, na razie no-op**. Rezerwuje miejsce na fragment stanu współdzielony między komponentami typu encji; w scaffoldzie nie wnosi zachowania.

<!-- anchor: b89kp7yx -->
## Kryteria akceptacji warstwy renderowania

<tagged_list type="ac" tags="frontend" filter="or"/>
