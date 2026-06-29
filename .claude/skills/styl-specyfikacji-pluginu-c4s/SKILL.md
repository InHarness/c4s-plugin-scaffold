---
title: Styl specyfikacji pluginu C4S (scaffold)
description: Zasady pisania specyfikacji pluginu C4S. Spec ma odwzorowywać realną budowę pluginu (koperta → contributes → sloty, warstwy L1–L9+M05), spinać narrację kontraktu z realnymi encjami przez osadzenia, a nie być zbiorem pustych stron. Wzorcowy/meta — część scaffoldu, którą autor pochodnego pluginu przejmuje i dostosowuje.
version: 1
language: pl
scope: writing-style
---

# Styl specyfikacji pluginu C4S (scaffold)

Ten styl obowiązuje przy pisaniu specyfikacji **pluginu C4S**. Projekt jest **scaffoldem** — generycznym pluginem, z którego (przez `degit` + rename map) buduje się własne pluginy. Dlatego ten styl jest **wzorcowy/meta**: jest częścią scaffoldu i autor pochodnego pluginu dostaje go w pakiecie (`.claude/skills/`), po czym dostosowuje pod swój typ encji.

> **DOSTOSUJ w swoim pluginie:** wszystkie miejsca oznaczone `DOSTOSUJ` odnoszą się do generycznego placeholdera scaffoldu (`example-entity`, `pathPrefix` `/example-entities`, slug stylu). Po `degit` podmień je na swój typ encji — reguły zostają, zmieniają się tylko nazwy.

## Zasada nadrzędna: spec odwzorowuje budowę pluginu

Specyfikacja **nie jest dokumentacją C4S** ani kopią docs. Jest **modelem konkretnego pluginu**: jego koperty, wkładów i slotów, zilustrowanym **realnymi encjami c4s** od migracji po widoki. Każda strona narracyjna spina kontrakt z encjami — nie istnieje strona „pusta", będąca samą prozą.

Mapuj treść 1:1 na anatomię pluginu i warstwy:

- **Koperta** = `PluginManifest` (`name`, `version`, `hostApiVersion`, `onUnregister()`, `contributes`).
- **`contributes.*`** = `entities[]`, `writingStyles`, `settings`, `commands` (+ slot przyszły `systemPromptBlocks`).
- **Wkład typu encji** = tożsamość (`EntityModuleManifest`) + sloty: `serializer` (wym.), `systemPrompt` (wym.), `backend?`, `frontend?`.
- **Warstwy L1–L9 + M05** → pliki/sloty: migracje (L1), MCP-fabryka (L3), router/API (L4), serializer (L9), frontend (chip/card/row, lista, detal, edytor + slash).

Gdy opisujesz zachowanie — przypisz je do warstwy/slotu, nie do abstrakcji.

## Narracja kontraktu, nie kopiowanie docs

- Pisz **dlaczego** i **jak to spięte**, nie przepisuj pól z docs ani z kodu hosta.
- Docs (peer `ask`) traktuj jako **źródło prawdy do odpytania**, nie do skopiowania. Stan sprawdzenia trzymaj w jednym miejscu (`synchronizacja.md`), nie rozsiewaj wersji po stronach.
- Unikaj „ściany prozy" — krótki akapit kontekstu, potem **osadzenie encji**, które pokazuje szczegóły na żywo.

## Osadzaj encje — nie duplikuj pól w prozie

Szczegóły (pola DTO, kolumny tabel, walidacje, relacje) **żyją w encji**, nie w markdownie. Edytor renderuje osadzenie jako żywy widget pobierający świeże dane z SQLite — proza nie rozjeżdża się z encją.

Wybierz najmniejszy pasujący tag:

- `<inline_mention type slug/>` — nazwa encji w zdaniu (chip).
- `<single_element type slug/>` — strona dokumentuje **tę** encję (pełna karta detalu).
- `<element_list type slugs="a,b,c"/>` — ręcznie wybrana, stała lista N encji.
- `<tagged_list type tags="x"/>` — dynamiczna lista jednego typu po tagu (auto-aktualizacja).
- `<tagged_list_mixed tags="x"/>` — przekrój wielu typów po tagu (feature-slice).
- `<diagram slug caption/>` — referencja do encji `diagram` (źródłem prawdy jest DSL `source`, nie strona).

Nigdy nie wklejaj tabeli pól, którą da się pokazać osadzeniem.

## Linkuj encje z SQLite — zakaz bare-nazw

Gdy nazywasz w prozie encję istniejącą w SQLite, **zawsze** linkuj ją XML-em — nigdy gołą nazwą. Dotyczy ścieżek endpointów (`GET /...`), nazw DTO (`*Request`/`*Response`/`*Dto`), nazw tabel jako encji, slugów AC.

- Naming w zdaniu → `<inline_mention/>`.
- Wyjątek (bare proza OK): gdy sama nazwa/ścieżka **jest tematem** zdania (konwencje nazewnicze, składnia, regex) albo gdy to wartość czysto ilustracyjna / encja nieaktywna. Wtedy zaznacz sobie wyjątek świadomie.

Przed każdą edycją `pages/`/encji przeczesz draft pod kątem `(GET|POST|PATCH|PUT|DELETE)\s+/\S+` oraz `\b[A-Z][a-zA-Z]+(Request|Response|Dto)\b` i zamień trafienia z istniejącym slugiem na tag.

## Tagi = feature-slice (dynamiczne grupy)

Używaj tagów do **przekrojowych** wiązek encji (np. `koperta`, `backend`, `frontend`, `serializer`, `host-api`, `example-entity`) i konsumuj je przez `<tagged_list/>` / `<tagged_list_mixed/>`. Relacje **strukturalne** (endpoint↔DTO, FK kolumny) wyrażaj linkami encji, nie tagami.

## Kryteria akceptacji = obserwowalne stwierdzenia

- Jedno AC = jedno **obserwowalne** zachowanie (nie „system jest dobry").
- Modeluj realne reguły pluginu: `slug = slugify(name)`; tabela snake-case (nie słowo zarezerwowane); `onUnregister()` idempotentny i nie rzuca; MCP rejestrowany jako **fabryka**; `restore()` = idempotentny UPSERT; `snapshot()` deterministyczny; migracje tylko naprzód i idempotentne; `render*` czysto-prezentacyjne (dane przez `useGetBySlug`); lista zwraca `*ListItem`, nie pełne dane; bramka `hostApiVersion`; `config.entities` filtruje tylko typy encji.
- Wiąż AC z encjami przez `verifies[]`.

## Diagramy

Diagram to **encja** (`mermaid` w `source` = źródło prawdy). Strona referuje go `<diagram slug caption/>`; `caption` jest per-referencja. Nie wklejaj DSL do strony.

## Sekcje, anchory, linki

- Nie wymyślaj/nie edytuj anchorów `<!-- anchor: xxxxxxxx -->` — indekser je nadaje.
- Przenosząc/zmieniając nagłówek, trzymaj nagłówek + anchor + treść razem. Nie zostawiaj breadcrumbów „(patrz MXX)".
- Linkuj sekcje przez `<section_ref anchor="..."/>` (działa też w czacie), nie prozą „patrz sekcja X".

## Język i ton

- Cała treść specyfikacji po **polsku**.
- Zwięźle, rzeczowo, technicznie. Akapit kontekstu → osadzenie → ewentualny komentarz. Bez marketingu i powtarzania docs.

## Adnotacje dla pochodnych pluginów (charakter scaffold)

W miejscach specyficznych dla przykładu zostawiaj krótką adnotację, co autor pochodny ma podmienić, np.:

> `DOSTOSUJ:` zamień typ encji `example-entity` → swój typ; `pathPrefix` `/example-entities` → swój; tabelę `example_entity` → swoją; slug tego stylu jeśli zmieniasz nazwę.

Reguły stylu (osadzanie, linkowanie, mapowanie na warstwy, AC) **nie zmieniają się** — przenoszą się 1:1 do każdego pluginu zbudowanego z tego scaffoldu.
