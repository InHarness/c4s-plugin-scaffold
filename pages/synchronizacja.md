<!-- anchor: 3zdhlh95 -->
# Synchronizacja z dokumentacją hosta

To **jedyne miejsce** w specyfikacji, w którym trzymamy konkretne wartości kontraktu Host API (wersje, kody błędów). Reszta stron narratuje mechanizmy i odsyła tutaj — wersji nie rozsiewamy po stronach. Wartości pochodzą z dokumentacji hosta (wyprowadzonej z kodu), odpytywanej przez peer `ask`.

<!-- anchor: 198ya022 -->
## Ostatnio sprawdzony stan dokumentacji

| Pozycja | Wartość | Źródło |
| --- | --- | --- |
| `HOST_API_VERSION` (stała hosta) | `1.0.0` | peer „C4S - Plugins Docs" (`ask`) |
| Paczka runtime hosta | `@inharness-ai/claude4spec` | peer „C4S - Plugins Docs" (`ask`) |
| Wersja paczki | `1.0.24` | peer „C4S - Plugins Docs" (`ask`) |
| Kod błędu bramki wersji | `PLUGIN_HOST_API_MISMATCH` | peer „C4S - Plugins Docs" (`ask`) |
| Kod błędu bramki silnika | `PLUGIN_ENGINE_UNSATISFIED` (dla `engines.node`) | peer „C4S - Plugins Docs" (`ask`) |
| Kierunek bramki | `semver.satisfies(HOST_API_VERSION, manifest.hostApiVersion)` | peer „C4S - Plugins Docs" (`ask`) |
| Data sprawdzenia | `2026-06-30` | — |

Bramka aktywacji: pierwszy argument to konkretna wersja hosta (`HOST_API_VERSION`), drugi to **zakres** z manifestu (`manifest.hostApiVersion`). Host sprawdza, czy *jego* wersja mieści się w zakresie deklarowanym przez plugin; niezgodność → `PLUGIN_HOST_API_MISMATCH`. Mechanizm bramki opisuje @pages/koperta-i-manifest.md.

<!-- anchor: fdqf8g2b -->
## Log sprawdzeń

- **2026-06-30** — pierwsze sprawdzenie (utworzenie scaffoldu). Odpytano peer „C4S - Plugins Docs". Ustalono `HOST_API_VERSION = 1.0.0`, `@inharness-ai/claude4spec = 1.0.24`, kody błędów `PLUGIN_HOST_API_MISMATCH` / `PLUGIN_ENGINE_UNSATISFIED`, kierunek bramki potwierdzony. Bez różnic wobec stanu specyfikacji (stan początkowy).

<!-- anchor: 5rbry78x -->
## Jak odświeżyć

Proces sprawdzenia zmian jest skillem **na żądanie** (`synchronizacja-z-dokumentacja`): odczytaj powyższe odniesienie → `ask` do docs o aktualny blok wersji i zmiany kontraktu → przy braku różnic zaktualizuj datę; przy różnicy zaplanuj dopasowanie (`update_plan`), wdroż, a potem zaktualizuj tę tabelę i utwórz wydanie.

> Uwaga: wartości `1.0.0` / `1.0.24` pochodzą z dokumentacji (wyprowadzonej z kodu hosta). Aby zamrozić je jako wierne lustro *bieżącego* kodu, można potwierdzić je bezpośrednio w repozytorium hosta procesem „aktualizacja na podstawie analizy kodu".
