---
title: Synchronizacja z dokumentacją hosta
description: Proces na żądanie — sprawdza, czy kontrakt Host API (HOST_API_VERSION, wersja paczki runtime, kody błędów bramek, sygnatury) zmienił się względem stanu utrwalonego w pages/synchronizacja.md, i prowadzi dopasowanie specyfikacji. Uruchamiaj wyłącznie na żądanie użytkownika lub gdy podejrzewasz rozjazd ze stanem docs.
version: 1
language: pl
scope: process
---

# Synchronizacja z dokumentacją hosta

Ten skill jest **procesem na żądanie**, nie regułą stałą. Służy do utrzymania scaffoldu w zgodzie z kontraktem Host API publikowanym w dokumentacji hosta. Stan referencyjny (wartości wersji, kody błędów, data sprawdzenia) żyje w jednym miejscu: `pages/synchronizacja.md`.

## Kiedy uruchamiać

- Użytkownik prosi o „sprawdzenie zmian w docs" / „synchronizację z hostem".
- Podejrzewasz rozjazd (np. plugin nie aktywuje się przez `PLUGIN_HOST_API_MISMATCH`).
- Przed wydaniem, jeśli od ostatniej daty w `pages/synchronizacja.md` minęło dużo czasu.

## Zasady

- **Jedno źródło prawdy stanu**: aktualizuj wyłącznie `pages/synchronizacja.md`. Nie rozsiewaj wartości wersji po innych stronach.
- **Nie zgaduj**: wartości bierz z `ask` do peer docs (lub z analizy kodu hosta). Jeśli docs nie podaje — zapisz „brak w docs".
- **Różnica = plan, nie ad-hoc**: gdy kontrakt się zmienił, użyj `update_plan` z planem dopasowania, wdroż, dopiero potem zaktualizuj odniesienie i utwórz wydanie.

## Proces

Pełna procedura krok po kroku: `processes/sprawdzenie-zmian.md`.
