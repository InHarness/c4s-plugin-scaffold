<!-- anchor: 9s5kt3ji -->
# Kryteria akceptacji

Każde kryterium to **jedno obserwowalne zachowanie** pluginu (nie ocena „system jest dobry"), powiązane z encjami przez `verifies[]`. Kryteria modelują realne reguły scaffoldu — od `slug = slugify(name)` po idempotentny `restore()` — i przenoszą się 1:1 do pluginu pochodnego po renamie placeholdera.

Listy poniżej są dynamiczne (po tagu feature-slice) — aktualizują się, gdy dodasz lub przetagujesz kryterium.

<!-- anchor: 1euazrrs -->
## Koperta i Host API

Reguły poziomu pluginu: bramka wersji, filtr typów, idempotentny `onUnregister()`.

<tagged_list type="ac" tags="koperta" filter="or"/>

<!-- anchor: 0wtczh84 -->
## Backend i dane

Reguły warstwy danych i API: migracje, slug, lista vs snapshot, rename, fabryka MCP.

<tagged_list type="ac" tags="backend" filter="or"/>

<!-- anchor: 3imbx1gc -->
## Serializer i wydania

Determinizm `snapshot()` i idempotencja `restore()`.

<tagged_list type="ac" tags="serializer" filter="or"/>

<!-- anchor: g34ue804 -->
## Frontend

Render-sloty, ekran listy, panel detalu, stan „broken".

<tagged_list type="ac" tags="frontend" filter="or"/>
