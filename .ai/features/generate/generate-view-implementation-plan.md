# Plan implementacji widoku „Generuj”

## 1. Przegląd
Widok „Generuj” to dedykowana, chroniona sekcja aplikacji, która umożliwia zalogowanym użytkownikom generowanie kandydatów na fiszki przy użyciu sztucznej inteligencji. Użytkownik wprowadza tekst źródłowy oraz opcjonalną wskazówkę, a system generuje propozycje fiszek. Widok ten integruje się z systemem dziennych limitów generacji i zapewnia walidację danych wejściowych oraz obsługę błędów w czasie rzeczywistym.

## 2. Routing widoku
Widok będzie dostępny pod chronioną ścieżką, wymagającą uwierzytelnienia użytkownika:
- **Ścieżka**: `/generate`
- **Plik**: `src/pages/generate.astro`

## 3. Struktura komponentów
Komponenty zostaną zorganizowane w sposób hierarchiczny, gdzie strona Astro będzie renderować główny komponent React, który zarządza całą logiką.

```
src/pages/generate.astro
└── src/components/views/GenerateFlashcardsView.tsx (ładowany na kliencie)
    ├── src/components/features/GenerationQuotaIndicator.tsx
    │   ├── components/ui/Progress.tsx (Shadcn)
    │   └── components/ui/Tooltip.tsx (Shadcn)
    └── src/components/features/GenerateFlashcardsForm.tsx
        ├── components/ui/Form.tsx (Shadcn)
        ├── components/ui/Textarea.tsx (Shadcn)
        ├── components/ui/Input.tsx (Shadcn)
        ├── components/ui/Button.tsx (Shadcn)
        └── src/components/shared/CharacterCounter.tsx
```

## 4. Szczegóły komponentów

### `GeneratePage.astro` (`src/pages/generate.astro`)
- **Opis**: Główny plik strony. Odpowiada za ochronę trasy — sprawdza, czy użytkownik jest zalogowany, a jeśli nie, przekierowuje go na stronę logowania. Renderuje komponent `GenerateFlashcardsView` z dyrektywą `client:load`, aby zapewnić jego interaktywność.
- **Główne elementy**: `<Layout>`, `<GenerateFlashcardsView client:load />`.
- **Obsługiwane interakcje**: Brak, komponent serwerowy.
- **Propsy**: Brak.

### `GenerateFlashcardsView.tsx`
- **Opis**: Główny komponent React, który jest kontenerem dla całego widoku. Zarządza stanem, w tym danymi o limicie generacji, statusem formularza oraz obsługą błędów. Odpowiada za komunikację z API.
- **Główne elementy**: `<GenerationQuotaIndicator />`, `<GenerateFlashcardsForm />`, komponent `Toast` do wyświetlania powiadomień.
- **Obsługiwane interakcje**: Pobieranie danych o limicie przy załadowaniu, obsługa przesyłania formularza.
- **Typy**: `GenerationQuotaDTO`, `GenerateFlashcardsCommand`, `GenerateFlashcardsResponseDTO`, `ErrorResponseDTO`, `QuotaViewModel`, `GenerateFlashcardsStateVM`.
- **Propsy**: Brak.

### `GenerationQuotaIndicator.tsx`
- **Opis**: Wyświetla informacje o dziennym limicie generacji fiszek. Pokazuje pasek postępu oraz tekst informujący o pozostałej liczbie generacji.
- **Główne elementy**: `<Progress />`, `<Tooltip />`, elementy tekstowe (`<p>`, `<span>`).
- **Obsługiwane interakcje**: Wyświetlanie dodatkowych informacji (np. czas resetu limitu) w dymku po najechaniu myszą.
- **Typy**: `QuotaViewModel`.
- **Propsy**:
    - `quota: QuotaViewModel | null`
    - `isLoading: boolean`
    - `error: string | null`

### `GenerateFlashcardsForm.tsx`
- **Opis**: Formularz do wprowadzania danych przez użytkownika. Zawiera pole na tekst źródłowy i opcjonalną wskazówkę. Waliduje dane wejściowe w czasie rzeczywistym i zarządza stanem przycisku "Generuj".
- **Główne elementy**: `<Form>`, `<Textarea>`, `<Input>`, `<Button>`, `<CharacterCounter />`.
- **Obsługiwane interakcje**: Wprowadzanie tekstu, przesyłanie formularza.
- **Obsługiwana walidacja**:
    - **Tekst źródłowy**: wymagany, długość od 1000 do 20000 znaków.
    - **Wskazówka**: opcjonalna, długość do 500 znaków.
- **Typy**: `GenerateFlashcardsCommand`.
- **Propsy**:
    - `isSubmitting: boolean`
    - `isSubmitDisabled: boolean`
    - `onSubmit: (data: GenerateFlashcardsCommand) => void`
    - `quota: QuotaViewModel | null`

## 5. Typy
Do implementacji widoku, oprócz istniejących DTO, potrzebne będą następujące typy ViewModel, które ułatwią zarządzanie stanem w komponencie React.

- **`QuotaViewModel`**: Reprezentuje dane o limicie w formie przystępnej do renderowania.
  - `remaining: number` - Liczba pozostałych generacji.
  - `limit: number` - Całkowity dzienny limit (np. 50).
  - `percentage: number` - Procentowe zużycie limitu, używane przez komponent `Progress`.
  - `resetsAtFormatted: string` - Sformatowana data resetu limitu do wyświetlenia w UI.

- **`GenerateFlashcardsStateVM`**: Agreguje cały stan widoku.
  - `quota: { data: QuotaViewModel | null, status: 'idle' | 'loading' | 'error', error: string | null }` - Stan pobierania danych o limicie.
  - `generation: { status: 'idle' | 'submitting' | 'success' | 'error', error: ErrorResponseDTO | string | null }` - Stan procesu generowania fiszek.

## 6. Zarządzanie stanem
Cała logika biznesowa, zarządzanie stanem i komunikacja z API zostaną zamknięte w custom hooku `useGenerateFlashcards`. Takie podejście oddziela logikę od prezentacji, utrzymując komponenty w czystości.

- **`useGenerateFlashcards()`**:
  - **Zarządza**: Wewnętrznym stanem opartym na `GenerateFlashcardsStateVM`.
  - **Wykonuje**:
    - Pobieranie danych o limicie przy inicjalizacji.
    - Obsługę przesyłania formularza, w tym walidację i wywołanie API.
    - Aktualizację stanu w odpowiedzi na sukces lub błąd operacji.
  - **Zwraca**: Obiekt zawierający aktualny stan (`state`), funkcję do obsługi formularza (`handleSubmit`) oraz pochodne wartości, takie jak `isSubmitDisabled`.

## 7. Integracja API
Widok będzie korzystał z dwóch endpointów API.

1.  **`GET /api/v1/users/me/generation-quota`**
    - **Cel**: Pobranie aktualnego stanu dziennego limitu generacji.
    - **Wywołanie**: Automatycznie po załadowaniu komponentu `GenerateFlashcardsView`.
    - **Typ odpowiedzi (sukces)**: `GenerationQuotaDTO`.
    - **Obsługa**: Wynik zostanie przetworzony na `QuotaViewModel` i zapisany w stanie.

2.  **`POST /api/v1/flashcards/generate`**
    - **Cel**: Wysłanie tekstu źródłowego i wskazówki w celu wygenerowania kandydatów na fiszki.
    - **Wywołanie**: Po kliknięciu przycisku "Generuj" i pomyślnej walidacji po stronie klienta.
    - **Typ żądania**: `GenerateFlashcardsCommand`.
    - **Typ odpowiedzi (sukces)**: `GenerateFlashcardsResponseDTO`.
    - **Obsługa**: W przypadku sukcesu, użytkownik zostanie przekierowany na stronę `/pending` w celu przeglądania wygenerowanych kandydatów.

## 8. Interakcje użytkownika
- **Ładowanie widoku**: Użytkownik widzi szkielet interfejsu, a następnie dynamicznie pojawia się informacja o limicie. Formularz jest gotowy do wypełnienia.
- **Wprowadzanie danych**: Podczas pisania w polach `Textarea` i `Input`, liczniki znaków aktualizują się w czasie rzeczywistym.
- **Walidacja na żywo**: Jeśli wprowadzone dane nie spełniają kryteriów (np. długość tekstu), przycisk "Generuj" staje się nieaktywny, a pod polem może pojawić się subtelna informacja o błędzie.
- **Wysyłanie formularza**: Kliknięcie "Generuj" powoduje zablokowanie przycisku i wyświetlenie na nim wskaźnika ładowania (spinnera).
- **Wynik operacji**: Po zakończeniu generowania, użytkownik jest albo przekierowywany na inną stronę (sukces), albo widzi powiadomienie o błędzie (np. toast).

## 9. Warunki i walidacja
- **Limit generacji**: Jeśli `quota.remaining` wynosi 0, cały formularz jest zablokowany, a obok wskaźnika limitu pojawia się informacja o czasie resetu.
- **Długość tekstu źródłowego**: Musi zawierać od 1000 do 20000 znaków. Przycisk "Generuj" jest nieaktywny, jeśli ten warunek nie jest spełniony.
- **Długość wskazówki**: Może zawierać maksymalnie 500 znaków. Przycisk "Generuj" jest nieaktywny, jeśli ten warunek nie jest spełniony.
- **Status przesyłania**: Przycisk "Generuj" jest nieaktywny, gdy `generation.status` to `submitting`.

## 10. Obsługa błędów
Obsługa błędów będzie realizowana za pomocą globalnego systemu powiadomień (np. `react-hot-toast` / `sonner`).

- **Błąd pobierania limitu**: W miejscu wskaźnika limitu wyświetlony zostanie komunikat błędu, a formularz będzie zablokowany.
- **Przekroczony limit (429)**: Wyświetlenie powiadomienia: "Dzienny limit generacji został osiągnięty. Nowe generacje będą dostępne o [czas]".
- **Błąd walidacji serwera (400)**: Wyświetlenie powiadomienia: "Wprowadzone dane są nieprawidłowe. Proszę, popraw je i spróbuj ponownie."
- **Błąd serwera lub usługi AI (500/503)**: Wyświetlenie powiadomienia: "Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie za chwilę."
- **Brak autoryzacji (401)**: Logika w `useGenerateFlashcards` powinna wykryć ten błąd i przekierować użytkownika na stronę logowania.

## 11. Kroki implementacji
1.  **Struktura plików**: Utworzenie plików: `src/pages/generate.astro`, `src/components/views/GenerateFlashcardsView.tsx`, `src/components/features/GenerationQuotaIndicator.tsx`, `src/components/features/GenerateFlashcardsForm.tsx`, `src/components/shared/CharacterCounter.tsx` oraz `src/hooks/useGenerateFlashcards.ts`.
2.  **Ochrona trasy**: Implementacja logiki sprawdzania sesji i przekierowania w `generate.astro`.
3.  **Komponenty UI**: Zbudowanie komponentów `GenerationQuotaIndicator` i `GenerateFlashcardsForm` z użyciem komponentów Shadcn/ui i statycznych danych.
4.  **Custom Hook**: Implementacja szkieletu hooka `useGenerateFlashcards` z logiką zarządzania stanem, bez wywołań API.
5.  **Integracja komponentów**: Połączenie komponentów w `GenerateFlashcardsView` i przekazanie stanu oraz funkcji z hooka jako propsy.
6.  **Integracja API**: Dodanie do `useGenerateFlashcards` logiki wywołań `fetch` do endpointów `GET /.../generation-quota` i `POST /.../generate`.
7.  **Obsługa błędów**: Implementacja wyświetlania powiadomień (toastów) dla każdego scenariusza błędu.
8.  **Nawigacja**: Implementacja przekierowania do `/pending` po pomyślnym wygenerowaniu fiszek.
9.  **Stylowanie i dopracowanie**: Ostateczne poprawki w stylach Tailwind, zapewnienie responsywności i dostępności (np. etykiety ARIA).
10. **Testowanie**: Ręczne przetestowanie wszystkich ścieżek użytkownika, walidacji i scenariuszy błędów.
