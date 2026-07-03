---
type: brief
source: release-diff
from_release: v0.0.4
to_release: v0.0.5
generated_at: '2026-07-02T13:30:37.934Z'
generator_version: brief-author@0.1
implemented: true
roots:
  - pages
---
# Brief: v0.0.4 → v0.0.5

## Podsumowanie

Ten release formalizuje **kontrakt propsów slotu `detailPanel`** we frontendzie typu encji oraz podnosi wersję API hosta z `1.0.0` do `1.1.0`. Zmiana jest **additive (minor)** — zakres z manifestu pluginu `hostApiVersion: "^1.0.0"` nadal spełnia `1.1.0`, więc **nie ma bumpu manifestu ani migracji**. Dotknięty jest wyłącznie kontrakt frontendu (slot detalu); backend, serializer, migracje i koperta bez zmian.

## Co zmienia się w systemie

**1. Slot `detailPanel` ma teraz jawny typ Reacta z kontraktem propsów.**

Poprzednio slot był deklarowany jako nieprzezroczysty typ `DetailPanel`. Teraz:

```ts
interface EntityFrontend {
  detailPanel: React.FC<EntityDetailProps>;  // WYMAGANY — ViewKind: detail; props: { slug; onDeleted?; onRenamed? }
  sidebarTab?: SidebarTab;
  routes?: RouteDef[];
}
```

Kanoniczny kształt propsów:

```ts
type EntityDetailProps = { slug: string; onDeleted?: () => void; onRenamed?: () => void };
```

- **Host wstrzykuje TYLKO `slug`.** Panel ładuje po nim encję hookiem `useGetBySlug`.
- **`onDeleted?` / `onRenamed?` to opcjonalne notyfikacje panel→host.** Wołane wyłącznie wtedy, gdy panel sam wykona inline delete/rename — host odświeża wtedy listę/breadcrumb. Panel, który nie usuwa/nie zmienia nazwy u siebie, może je zignorować.

**2. Zniknął prop `onBack`.** Powrót z panelu detalu realizuje **breadcrumb hostowego `DetailPanelShell`**, a nie prop panelu. Nie deklaruj ani nie przyjmuj `onBack`.

**3. Nawigacja do innej encji/sekcji idzie przez singleton, nie przez propsy.** `onOpenEntity` / `onOpenPage` **nie są** propsami slotu. Przejście do innej encji/sekcji realizuje się przez singleton z `@c4s/plugin-runtime`:

```ts
import { useEditorBridge } from '@c4s/plugin-runtime';
const bridge = useEditorBridge();
bridge.openEntity(/* ... */);
bridge.openSection(/* ... */);
```

**4. Model zapisu — standard, nie wymóg.** Host jest niemy w kwestii zapisu. Plugin wybiera dowolnie: ręczny przycisk „Zapisz" **albo** debounced-autosave (draft + ~500 ms debounce + porównanie dirty vs baseline) — obie opcje są równorzędne. Destrukcyjne potwierdzenie usuwania pozostaje **host-owned**; panel jedynie notyfikuje przez `onDeleted?`.

**5. Wersja API hosta: `HOST_API_VERSION` `1.0.0` → `1.1.0`** (potwierdzone u peera „C4S - Plugins Docs"). Bramka aktywacji liczy `semver.satisfies(HOST_API_VERSION, manifest.hostApiVersion)`; zakres `^1.0.0` obejmuje `1.1.0`, więc plugin dalej się aktywuje. Runtime hosta `@inharness-ai/claude4spec` pozostaje na `1.0.24`, kody błędów bramki bez zmian (`PLUGIN_HOST_API_MISMATCH`, `PLUGIN_ENGINE_UNSATISFIED`).

## Nowe kryteria akceptacji (widok `example-entity-detail`)

Release dodaje 3 aktywne AC (tag `frontend`, weryfikują widok detalu encji):

- **Host wstrzykuje tylko `slug`; `onDeleted?`/`onRenamed?` opcjonalne** — notyfikacje panel→host wołane wyłącznie przy własnym inline delete/rename (`kind: requirement`).
- **Nawigacja przez `useEditorBridge().openEntity/openSection`**, nie przez propsy `onOpenEntity`/`onOpenPage` (`kind: requirement`).
- **Powrót realizuje breadcrumb hostowego `DetailPanelShell`** — panel nie przyjmuje propa `onBack` (`kind: edge-case`).

## Dla implementatorów pochodnego pluginu

Kontrakt przenosi się 1:1 do pluginu zbudowanego z tego scaffoldu — podmieniasz tylko typ encji; kształt propsów, brak `onBack` i nawigacja przez `useEditorBridge` zostają. Konkretne cele edycji w kodzie frontendu typu encji:

- Zmień sygnaturę komponentu panelu detalu na `React.FC<EntityDetailProps>` z `EntityDetailProps = { slug; onDeleted?; onRenamed? }`. Ładuj encję z `useGetBySlug(slug)`.
- **Usuń** z komponentu prop `onBack` i całą obsługę powrotu — powrót obsługuje host (`DetailPanelShell`).
- **Usuń** propsy `onOpenEntity` / `onOpenPage`; zastąp wywołaniami `useEditorBridge().openEntity(...)` / `.openSection(...)` z `@c4s/plugin-runtime`.
- `onDeleted?` / `onRenamed?` wołaj **tylko** w ścieżkach inline delete/rename wykonywanych przez sam panel; nie wołaj ich w innych przypadkach.
- Zapis: zaimplementuj ręczny przycisk „Zapisz" **lub** debounced-autosave (~500 ms) — dowolnie; potwierdzenie usuwania pozostaw hostowi.
- **Bez zmian w manifeście i bez migracji** — nie bumpuj `hostApiVersion` (zakres `^1.0.0` wciąż spełnia `1.1.0`).
