<!-- anchor: qywv8owb -->
# Koperta i manifest pluginu

Koperta to **jedyny** poziom plugin-level: deklaratywny `PluginManifest` i jego `contributes.*`. Plugin nie ma własnego „backendu" ani „frontendu" — wnosi **typy encji**, a backend/frontend są slotami tych typów (patrz @pages/typy-encji/example-entity/index.md). Ta strona opisuje, jak host czyta kopertę: co rejestruje, kiedy aktywuje i jak bramkuje zgodność wersji.

<!-- anchor: rho1ta03 -->
## PluginManifest — minimalny kontrakt

Manifest jest deklaratywny: host odczytuje go, zanim cokolwiek uruchomi. Minimalny kształt (sygnatura ilustracyjna — pełne typy są w dokumentacji hosta, nie przepisujemy ich):

```ts
interface PluginManifest {
  name: string;
  version: string;          // semver pluginu
  hostApiVersion: string;   // zakres semver wymagany wobec HOST_API_VERSION hosta
  engines?: Record<string, string>;
  onUnregister?(): void | Promise<void>;  // idempotentny; nigdy nie rzuca
  contributes: Contributes;
}
```

Dwa pola niosą semantykę cyklu życia:

- **`hostApiVersion`** to **zakres** semver wymagany od hosta — nie wersja pluginu. Host porównuje go ze swoją stałą `HOST_API_VERSION` (bramka niżej).
- **`onUnregister()`** musi być **idempotentny i nie rzucać** — host wywołuje go przy dezaktywacji/odświeżeniu, także po częściowej rejestracji.

<!-- anchor: es0pyg5k -->
## contributes.* — co plugin wnosi

`contributes` to lista wkładów. Tylko `entities[]` jest filtrowana przez konfigurację; pozostałe wkłady wchodzą zawsze:

```ts
interface Contributes {
  entities: EntityContribution[];   // filtrowane przez config.entities
  writingStyles?: WritingStyle[];
  settings?: SettingsSchema;
  commands?: Command[];
  // systemPromptBlocks?: ...        // slot przyszły, jeszcze nie kontraktowany
}
```

Każdy element `entities[]` to `EntityContribution` — tożsamość typu (`EntityModuleManifest`) plus sloty. **Jeden plugin może wnosić wiele typów encji**; scaffold wnosi jeden — placeholder `example-entity`. Szczegóły wkładu: @pages/typy-encji/example-entity/index.md.

<!-- anchor: ibhzpja3 -->
## Instalacja vs aktywacja

To dwa różne zdarzenia:

- **Instalacja** — plugin jest obecny (globalnie lub w projekcie), ale jeszcze nieuruchomiony. Host zna manifest, nie wykonał slotów.
- **Aktywacja** — host przeszedł bramkę wersji, wywołał `mount(ctx)` slotów backendu, zarejestrował MCP-fabryki, serializery i wkłady frontendu.

Instalacja bywa **globalna** (dla wszystkich projektów użytkownika) albo **projektowa** (tylko bieżący projekt). Niezależnie od zasięgu instalacji, o uruchomieniu typu encji decyduje aktywacja i filtr `config.entities`.

Stan rejestracji pluginu/typu to `active` / `inactive` / `unknown` — `unknown` oznacza typ widziany w danych, którego żaden aktywny plugin aktualnie nie dostarcza (np. wyłączony plugin).

<!-- anchor: tc3gulev -->
## Bramka wersji Host API

Aktywacja jest **bramkowana semantycznie**: host sprawdza `semver.satisfies(HOST_API_VERSION, manifest.hostApiVersion)`. Niezgodność blokuje aktywację błędem `PLUGIN_HOST_API_MISMATCH` — plugin pozostaje zainstalowany, ale nieaktywny. Dzięki temu plugin zbudowany pod starszy kontrakt nie uruchomi się na niekompatybilnym hoście „po cichu".

Bieżącą wartość `HOST_API_VERSION` hosta i wersję paczki trzymamy w jednym miejscu — @pages/synchronizacja.md — i nie rozsiewamy jej po stronach. Pluginy bywają oznaczane jako `stable` lub `experimental`; to wymiar ortogonalny do bramki wersji.

<!-- anchor: ok95aa7q -->
## config.entities — filtr typów encji

`config.entities` filtruje **wyłącznie** wnoszone typy encji (`contributes.entities[]`). Nie dotyka `writingStyles`, `settings` ani `commands` — te wchodzą niezależnie od konfiguracji. Pozwala to włączać/wyłączać poszczególne typy encji bez ruszania reszty wkładu.

<!-- anchor: 9tf2pmay -->
## Kryteria akceptacji koperty

Obserwowalne reguły poziomu koperty (dynamicznie po tagu `koperta`):

<tagged_list type="ac" tags="koperta" filter="or"/>
