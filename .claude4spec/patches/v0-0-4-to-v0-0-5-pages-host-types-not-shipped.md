---
type: patch
brief: v0-0-4-to-v0-0-5-pages.md
patch_kind: drift
created_at: 2026-07-02T00:00:00Z
created_by: claude-code
---

# Patch — Host API 1.1.0 surface nie jest jeszcze w opublikowanym pakiecie hosta

## Co znalazłem

Brief `v0-0-4-to-v0-0-5-pages.md` opisuje kontrakt **Host API 1.1.0**, ale
zainstalowany/zlinkowany pakiet hosta `@inharness-ai/claude4spec@1.0.24`
(aliasowany jako `@c4s/plugin-runtime`, typy przez ambient
`/// <reference types="@inharness-ai/claude4spec/plugin-runtime/ambient" />`
w `src/index.ts:1`) **nadal wystawia surface 1.0.0**:

1. **`EntityDetailProps` wciąż ma `onBack` i wymagane callbacki.** W
   `node_modules/@inharness-ai/claude4spec/dist/plugin-types/plugin-runtime.d.ts`
   (źródło `../claude4spec/src/plugin-types/plugin-runtime.ts:136`) typ to:
   ```ts
   interface EntityDetailProps { slug: string; onDeleted: () => void; onRenamed: (newSlug: string) => void; onBack: () => void; }
   ```
   — a nie kanoniczny 1.1.0 `{ slug; onDeleted?; onRenamed? }`. Import tego typu
   do panelu wymuszałby `onBack` i niepustych `onDeleted`/`onRenamed`.

2. **`HOST_API_VERSION` to wciąż `'1.0.0'`** (`../claude4spec/src/shared/plugin-host/manifest.ts:42`),
   mimo że brief §5 mówi o `1.0.0 → 1.1.0` „potwierdzonym u peera". (Bez wpływu
   na aktywację — `hostApiVersion: '^1.0.0'` spełnia oba; manifest bez zmian.)

3. **Nawigacja: host wystawia singleton-const `editorBridge`, nie hook
   `useEditorBridge()`.** Powierzchnia pluginowa deklaruje
   `export declare const editorBridge: EditorBridge` (`openEntity`/`openSection`)
   — i tak jest już używana w scaffoldzie (`src/entity/frontend/render-card.tsx`,
   `render-chip.tsx`: `editorBridge.openEntity(...)`). Brief, AC
   `ac-nawigacja-do-encji-sekcji-z-panelu-detal` i podstrona `podstrony.md`
   (anchor `dpbe6bwv`) mówią natomiast o **hooku** `useEditorBridge().openEntity/openSection`.
   Taki hook **nie istnieje** w surface pluginowym.

## Jak to obszedłem w implementacji

- Panel detalu (`src/entity/frontend/detail-panel.tsx`) **deklaruje 1.1.0
  `EntityDetailProps` lokalnie** (`{ slug; onDeleted?; onRenamed? }`) zamiast
  importować z `@c4s/plugin-runtime`. Rejestracja slotu w `src/frontend.tsx`
  używa asercji `as FrontendModule['detailPanel']` (węższy komponent wobec
  hostowego, wciąż 1.0.0, `ComponentType<EntityDetailProps>`).
- Usunięto `onBack` z panelu i z wrappera trasy (`routes.tsx`); powrót jest
  host-owned (`DetailPanelShell`).
- Nie dodano wywołania nawigacji w panelu (panel nie przechodzi do innej
  encji/sekcji), więc rozbieżność `useEditorBridge()` vs `editorBridge` nie
  blokuje builda; komentarze w kodzie wskazują **faktyczny** singleton
  `editorBridge`.

## Sugestia

1. Wydać host API 1.1.0 w `@inharness-ai/claude4spec`: zmienić
   `EntityDetailProps` na `{ slug; onDeleted?; onRenamed? }` (usunąć `onBack`),
   podbić `HOST_API_VERSION` do `1.1.0`. Wtedy plugin może wrócić do importu typu
   z `@c4s/plugin-runtime` i porzucić lokalną deklarację + asercję.
2. Ujednolicić kontrakt nawigacji: albo dodać do surface pluginowego hook
   `useEditorBridge()`, albo poprawić brief/AC/`podstrony.md` (anchor `dpbe6bwv`)
   i tekst `ac-nawigacja-do-encji-sekcji-z-panelu-detal`, by odwoływały się do
   istniejącego singletonu `editorBridge.openEntity/openSection`.

> Uzupełnia istniejący `v0-0-4-detailpanel-props-host-api-1-1-0.md` (ten dotyczył
> tylko użycia `onBack` w kodzie panelu); niniejszy dotyczy **braku 1.1.0 w samym
> pakiecie hosta** (typy + wersja + hook nawigacji).
