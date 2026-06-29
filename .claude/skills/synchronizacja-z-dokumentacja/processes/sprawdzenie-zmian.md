# Proces: sprawdzenie zmian kontraktu Host API

Procedura na żądanie. Cel: porównać aktualny kontrakt Host API z dokumentacji hosta ze stanem utrwalonym w `pages/synchronizacja.md` i — jeśli trzeba — dopasować specyfikację.

## Krok 1 — odczytaj odniesienie

Przeczytaj `pages/synchronizacja.md`, sekcję „Ostatnio sprawdzony stan dokumentacji". Zanotuj bieżące wartości: `HOST_API_VERSION`, nazwę i wersję paczki runtime, kody błędów bramek, kierunek bramki, datę ostatniego sprawdzenia.

## Krok 2 — odpytaj dokumentację

`ask` do peer „C4S - Plugins Docs" (a w razie braku — „C4S - App Spec"). Zapytaj zwięźle i poproś o same wartości:

- aktualna wartość `HOST_API_VERSION`,
- nazwa i wersja paczki runtime hosta (`@inharness-ai/claude4spec` lub aktualna),
- kody błędów bramek (`PLUGIN_HOST_API_MISMATCH`, `PLUGIN_ENGINE_UNSATISFIED`),
- kierunek bramki `semver.satisfies(HOST_API_VERSION, manifest.hostApiVersion)`,
- czy zmieniły się sygnatury kontraktu (`PluginManifest`, `EntityModuleManifest`, `EntitySerializer`, `SqlMigration`, `MountContext`).

Jeśli docs nie podaje wartości — zapisz „brak w docs", nie zgaduj.

## Krok 3a — brak różnic

Jeśli wszystkie wartości i sygnatury są zgodne ze stanem odniesienia: zaktualizuj **tylko** datę sprawdzenia w tabeli i dopisz wpis do „Log sprawdzeń" (data + „bez różnic"). Koniec — bez wydania.

## Krok 3b — wykryto różnicę

1. **Zaplanuj dopasowanie** — `update_plan` (action: `append` lub `replace`) z listą zmian: które encje/strony/AC wymagają korekty (np. nowe pole w manifeście, zmiana kodu błędu, zmiana sygnatury serializera).
2. **Oceń wpływ** — dla każdej dotykanej encji uruchom `find_references` (cztery kanały) i przedstaw wpływ, zanim zmienisz cokolwiek aktywnego.
3. **Wdróż** — nanieś zmiany w encjach i stronach zgodnie z planem. Sygnatury Host API w stronach trzymaj minimalne (narracja + sygnatura), nie przepisuj docs.
4. **Zaktualizuj odniesienie** — w `pages/synchronizacja.md` wpisz nowe wartości, nową datę i wpis w „Log sprawdzeń" opisujący różnicę i wdrożone dopasowanie.
5. **Wydanie** — `release_create` z opisem zmiany kontraktu (np. „dopasowanie do HOST_API_VERSION x.y.z").

## Krok 4 — weryfikacja

Na koniec `check_consistency` — upewnij się, że dopasowanie nie zostawiło zerwanych referencji ani osieroconych `verifies[]`.
