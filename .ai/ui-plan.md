# Architektura UI dla 10xCards (MVP)

## 1. Przegląd struktury UI

Aplikacja 10xCards dla MVP wykorzystuje persystentny layout z górną nawigacją (logo, główne linki, menu użytkownika) i zestaw stron publicznych oraz chronionych. Interaktywne widoki budowane są w React 19 i stylowane Tailwind 4 przy użyciu komponentów Shadcn/ui. Wszystkie chronione trasy korzystają z sesji Supabase (cookie-based) i są zabezpieczone middleware’em. Brak cache’u w MVP – każdy widok pobiera świeże dane przy wejściu; po mutacjach następuje re-fetch. Formularze mają walidację po stronie klienta zgodną z limitami z PRD i planu API.

Kluczowe przepływy MVP:
- Generowanie → Przegląd kandydatów → Bulk akceptacja do zestawu → Przegląd zestawu → (opcjonalnie) Nauka
- Zarządzanie zestawami: lista, tworzenie inline, detale, edycja, usuwanie
- Manualne dodawanie fiszek z poziomu widoku zestawu

Nacisk na prostotę: loading state na przyciskach, spójny layout dla przeglądu kandydatów i sekcji Oczekujące, responsywność kart, podstawowe komunikaty błędów, dostępność (kontrast, focus states, nawigacja klawiaturą).

## 2. Lista widoków

### 2.1 Landing
- Nazwa widoku: Landing (publiczny)
- Ścieżka widoku: `/`
- Główny cel: Powitanie niezalogowanego użytkownika, CTA do rejestracji/logowania.
- Kluczowe informacje do wyświetlenia: Nazwa produktu, skrót wartości, przyciski „Zarejestruj się”, „Zaloguj się”.
- Kluczowe komponenty widoku: Button, Card, Separator.
- UX, dostępność i względy bezpieczeństwa:
  - Wyraźne CTA, wysoki kontrast, poprawne role i landmarki (`header`, `main`).
  - Brak wrażliwych danych; linki do polityki prywatności.
- Powiązane endpointy: Brak (publiczny, bez danych).
- Pokryte historyjki PRD: Wsparcie onboarding (częściowo), przygotowanie do US-001/002.

### 2.2 Logowanie
- Nazwa widoku: Logowanie (publiczny)
- Ścieżka widoku: `/login`
- Główny cel: Uwierzytelnienie użytkownika.
- Kluczowe informacje do wyświetlenia: Formularz e-mail/hasło, link do rejestracji, błędy walidacji.
- Kluczowe komponenty widoku: Form, Input, Label, Button, Separator.
- UX, dostępność i względy bezpieczeństwa:
  - Atrybuty `autocomplete`, maskowanie hasła, komunikaty o błędach bez ujawniania szczegółów.
  - Po sukcesie przekierowanie do `/dashboard`.
- Powiązane endpointy: Supabase Auth (cookie-based, poza własnym API).
- Pokryte historyjki PRD: US-002, częściowo US-004.

### 2.3 Rejestracja
- Nazwa widoku: Rejestracja (publiczny)
- Ścieżka widoku: `/register`
- Główny cel: Utworzenie konta e-mail + hasło.
- Kluczowe informacje do wyświetlenia: Formularz z walidacją haseł, link do logowania, błędy walidacji.
- Kluczowe komponenty widoku: Form, Input, Label, Button.
- UX, dostępność i względy bezpieczeństwa:
  - Jasne zasady hasła, informacja o sukcesie, brak wycieku informacji przy błędach.
  - Po sukcesie przekierowanie do logowania lub automatyczne zalogowanie (zgodnie z konfiguracją Auth).
- Powiązane endpointy: Supabase Auth.
- Pokryte historyjki PRD: US-001.

### 2.4 Dashboard (chroniony)
- Nazwa widoku: Dashboard
- Ścieżka widoku: `/dashboard`
- Główny cel: Miejsce startowe po zalogowaniu; placeholder pod statystyki i skróty.
- Kluczowe informacje do wyświetlenia: Skróty do Generuj/Zestawy/Oczekujące, ewentualnie quota AI.
- Kluczowe komponenty widoku: Card, Button, Badge, Progress (opcjonalnie quota).
- UX, dostępność i względy bezpieczeństwa:
  - Prosta nawigacja, brak przeciążenia informacjami.
- Powiązane endpointy: (opcjonalnie) `GET /api/v1/users/me/generation-quota`.
- Pokryte historyjki PRD: Pośrednio – nawigacja do kluczowych funkcji.

### 2.5 Lista zestawów (chroniony)
- Nazwa widoku: Zestawy
- Ścieżka widoku: `/sets`
- Główny cel: Przegląd, sortowanie, tworzenie nowych zestawów.
- Kluczowe informacje do wyświetlenia: Nazwa, opis, kategoria (badge), liczba fiszek, ewentualne „X do nauki dziś” (placeholder).
- Kluczowe komponenty widoku: Card (SetCard), Form (inline nowy zestaw), Input, Textarea, Dropdown Menu (sortowanie), Badge, Button, Separator.
- UX, dostępność i względy bezpieczeństwa:
  - Grid responsywny (1/2/3 kolumny), formularz inline z wyraźną walidacją.
  - Potwierdzenie przed usunięciem zestawu.
- Powiązane endpointy:
  - `GET /api/v1/sets` (lista, sortowanie, paginacja)
  - `POST /api/v1/sets` (tworzenie inline)
  - `DELETE /api/v1/sets/:id` (usuwanie z karty)
- Pokryte historyjki PRD: US-005, US-006, częściowo US-008.

### 2.6 Szczegóły zestawu (chroniony)
- Nazwa widoku: Szczegóły zestawu
- Ścieżka widoku: `/sets/:id`
- Główny cel: Przegląd fiszek w zestawie, akcje na fiszkach, start nauki.
- Kluczowe informacje do wyświetlenia: Nazwa, opis, kategoria, liczba fiszek, lista fiszek (front/back po rozwinięciu), paginacja >50.
- Kluczowe komponenty widoku: Card/Accordion (FlashcardItem), Button, Badge, Dialog (edycja/usunięcie), Form (edycja), Pagination, Separator.
- UX, dostępność i względy bezpieczeństwa:
  - Edycja/usuń z confirm dialogami, jasne limity znaków.
  - Przycisk „+ Dodaj fiszkę” otwiera modal z walidacją.
- Powiązane endpointy:
  - `GET /api/v1/sets/:id`
  - `GET /api/v1/sets/:id/flashcards?per_page=50`
  - `POST /api/v1/flashcards` (manualny dodatek)
  - `PATCH /api/v1/flashcards/:id` (edycja)
  - `DELETE /api/v1/flashcards/:id` (usunięcie)
- Pokryte historyjki PRD: US-007, US-014, US-015, US-016, US-019.

### 2.7 Sesja nauki (chroniony)
- Nazwa widoku: Nauka zestawu
- Ścieżka widoku: `/sets/:id/learn`
- Główny cel: Prezentacja fiszek do nauki (MVP: uproszczone), ocena odpowiedzi w przyszłości.
- Kluczowe informacje do wyświetlenia: Karta fiszki z flip, licznik postępu, przycisk „Pokaż odpowiedź”.
- Kluczowe komponenty widoku: Card (FlashcardLearn), Button (sticky), Progress, Badge.
- UX, dostępność i względy bezpieczeństwa:
  - Mobile: full-screen, gestures (swipe), Desktop: klawiatura (Space/Arrows), focus management.
- Powiązane endpointy (MVP uproszczone):
  - `GET /api/v1/sets/:id/due-cards` (na przyszłość; MVP może użyć wszystkich kart)
  - `POST /api/v1/flashcards/:id/reviews` (planowane)
- Pokryte historyjki PRD: US-017, US-018 (częściowo – zależne od implementacji algorytmu).

### 2.8 Generowanie fiszek (chroniony)
- Nazwa widoku: Generuj
- Ścieżka widoku: `/generate`
- Główny cel: Formularz generowania kandydatów przez AI.
- Kluczowe informacje do wyświetlenia: Limit dzienny (pozostało X/50, resets_at), textarea „Tekst źródłowy” (1000–20 000), opcjonalna „Wskazówka” (≤500), błędy walidacji.
- Kluczowe komponenty widoku: Form, Textarea, Input (opcjonalnie dla hint), Label, Button (z loading), Progress (quota), Tooltip/Info, Separator.
- UX, dostępność i względy bezpieczeństwa:
  - Live counters, disabled przy niespełnionych limitach/validacji.
  - Komunikat 429 z czasem resetu; brak przechowywania treści źródłowej.
- Powiązane endpointy:
  - `GET /api/v1/users/me/generation-quota`
  - `POST /api/v1/flashcards/generate`
- Pokryte historyjki PRD: US-009, US-010, US-020, US-021, US-022, US-023.

### 2.9 Przegląd nowych kandydatów (chroniony)
- Nazwa widoku: Przegląd generacji
- Ścieżka widoku: `/generate/review/:generationId`
- Główny cel: Wybranie kandydatów i bulk akceptacja do zestawu.
- Kluczowe informacje do wyświetlenia: Lista kandydatów (front/back draft, liczniki), checkboxy, sticky footer z wyborem zestawu (radio: istniejący lub „Utwórz nowy”), input nazwy nowego zestawu, licznik zaznaczonych.
- Kluczowe komponenty widoku: Card (CandidateCard), Checkbox, RadioGroup, Input, Button, Separator, Badge.
- UX, dostępność i względy bezpieczeństwa:
  - Sticky footer, wyraźny stan disabled, focus/aria dla list i kontrolek.
  - Akcja „Odrzuć wszystkie i wróć”.
- Powiązane endpointy:
  - (Źródło danych kandydatów – wewnętrzne po generacji)
  - `POST /api/v1/pending-flashcards/bulk-accept`
- Pokryte historyjki PRD: US-011 (bez inline edycji w MVP), US-012 (bulk), US-019.

### 2.10 Oczekujące (chroniony)
- Nazwa widoku: Oczekujące
- Ścieżka widoku: `/pending`
- Główny cel: Przegląd wszystkich niezaakceptowanych kandydatów z paginacją i bulk akceptacją.
- Kluczowe informacje do wyświetlenia: Lista kandydatów (jak wyżej), sortowanie po `created_at desc`, paginacja 20/stronę.
- Kluczowe komponenty widoku: Card (CandidateCard), Checkbox, RadioGroup, Input, Button, Pagination, Separator.
- UX, dostępność i względy bezpieczeństwa:
  - Spójny layout z widokiem przeglądu generacji, wyraźna paginacja.
  - Opcja zaznacz/odznacz wszystko na stronie (z rozwagą, dla dostępności).
- Powiązane endpointy:
  - `GET /api/v1/pending-flashcards?sort_by=created_at&sort_order=desc&page&per_page=20`
  - `POST /api/v1/pending-flashcards/bulk-accept`
  - `DELETE /api/v1/pending-flashcards/:id` (odrzucenie pojedynczego)
- Pokryte historyjki PRD: US-013, US-012, US-024.

### 2.11 Błędy i stany specjalne
- 401 Unauthorized: przekierowanie do `/login` dla tras chronionych.
- 400 Validation: wyświetlanie strukturalnych komunikatów w formularzach.
- 404 Not Found: neutralna strona błędu w layoucie.
- 409 Conflict: komunikaty dla nazw zestawów.
- 429 Too Many Requests: dla limitu AI (z `resets_at`).
- 500/503: przyjazny komunikat i opcja ponów później.

## 3. Mapa podróży użytkownika

### 3.1 Happy path – nowy użytkownik
1) `/register` → rejestracja konta → (opcjonalnie) automatyczne logowanie lub `/login` → `/dashboard`.
2) `/generate` → wklejenie tekstu (1000–20 000), opcjonalna wskazówka (≤500) → submit (loading) → sukces → redirect do `/generate/review/:generationId`.
3) `/generate/review/:generationId` → wybór kandydatów (checkboxy) → wybór zestawu (radio: istniejący lub nowy + nazwa) → „Zaakceptuj wybrane (N)” → sukces → redirect do `/sets/:setId`.
4) `/sets/:setId` → przegląd zaakceptowanych fiszek → (opcjonalnie) „Rozpocznij naukę” → `/sets/:id/learn`.

### 3.2 Powracający użytkownik
- `/dashboard` → szybkie przejście do `/pending` (uzupełnienie przeglądów), `/sets`, lub `/generate`.

### 3.3 Alternatywne ścieżki i błędy
- Limit AI osiągnięty (429) na `/generate`: wyświetlenie bannera z resztą do resetu; CTA do manualnego dodawania z `/sets/:id`.
- Błędy walidacji: disabled submit + inline errors; ponów po poprawie.
- Brak połączenia (US-021): komunikat i przycisk „Ponów” na submitach.

## 4. Układ i struktura nawigacji

- Persystentny layout z górnym paskiem:
  - Logo (link do `/dashboard` po zalogowaniu; do `/` gdy niezalogowany)
  - Linki: Dashboard (`/dashboard`), Zestawy (`/sets`), Oczekujące (`/pending`), Generuj (`/generate`)
  - User menu (Avatar) z opcjami: Ustawienia (przyszłość), Wyloguj
  - Mobile: hamburger → menu w SlideOver/Dropdown
- Ochrona tras: middleware sprawdza sesję dla wszystkich poza `/`, `/login`, `/register`.
- Widoki przeglądu kandydatów i pending: spójny layout list + sticky footer z akcjami.

## 5. Kluczowe komponenty

- SetCard: karta zestawu (nazwa, opis, badge kategorii, liczba fiszek, akcje). Użycie: `/sets`.
- CandidateCard: karta kandydata (front_draft/back_draft, liczniki, checkbox). Użycie: `/generate/review/:generationId`, `/pending`.
- FlashcardItem: element listy fiszek (front → expand back, akcje edytuj/usuń). Użycie: `/sets/:id`.
- FlashcardLearn: karta nauki (flip front/back, progress, CTA „Pokaż odpowiedź”). Użycie: `/sets/:id/learn`.
- NewSetInlineForm: formularz tworzenia zestawu inline (name, description). Użycie: `/sets`.
- ManualFlashcardDialog: modal dodawania fiszki (front/back, liczniki). Użycie: `/sets/:id`.
- EditSetDialog / EditFlashcardDialog: modal edycji z walidacją. Użycie: `/sets/:id`.
- BulkAcceptFooter: sticky footer (radio: set istniejący/nowy, input nazwy, action button, licznik N). Użycie: `/generate/review/:generationId`, `/pending`.
- Pagination: paginacja list (pending, fiszki w zestawie >50). Użycie: `/pending`, `/sets/:id`.
- Toast/Alert: wyniki mutacji, krytyczne błędy.

Dostępność i bezpieczeństwo w komponentach:
- Wysokie kontrasty, focus states, role/aria dla list i kontrolek, klawiatura.
- Ochrona przed przypadkowym usunięciem (confirm), brak ekspozycji ID poza potrzebą.
- Brak przechowywania treści źródłowych; anonimizowane metadane generacji.

Zgodność z API (dla wszystkich widoków):
- Wszystkie operacje na danych poprzez opisane w planie API endpointy v1; identyfikacja użytkownika z sesji (cookies, RLS). Parametry zapytań (sort/paginacja) zgodne ze specyfikacją. Komunikaty błędów w spójnym formacie z `error.id`, `code`, `message`.

Pokrycie historyjek z PRD (mapowanie skrótowe):
- Konta i dostęp: US-001, US-002, US-003, US-004 → Landing/Login/Register, ochrona tras.
- Zestawy: US-005, US-006, US-007, US-008 → `/sets`, `/sets/:id` + autom. kategoryzacja (po akceptacji, backend).
- Generowanie AI: US-009, US-010, US-011, US-012, US-019, US-020, US-021, US-022, US-023, US-024 → `/generate`, `/generate/review/:generationId`, `/pending`.
- Nauka: US-017, US-018 → `/sets/:id/learn` (MVP częściowe, przygotowane UI).

Przypadki brzegowe (wybrane) i ich obsługa UI:
- Limit dzienny (429): banner + disabled submit + wskazanie `resets_at`.
- Walidacja długości pól (front/back/source/hint): live counter, komunikaty inline, blokada przycisku.
- Sieć/offline (US-021): wyraźny error + „Ponów”.
- 404/403/401: przyjazne przekierowania/strony błędów bez ujawniania szczegółów.
