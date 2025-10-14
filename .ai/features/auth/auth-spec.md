## Specyfikacja techniczna modułu uwierzytelniania

### 1. Architektura interfejsu użytkownika

#### 1.1. Nowe strony (Astro)

Aplikacja zostanie rozszerzona o następujące strony w katalogu `src/pages`:

- `src/pages/login.astro`: Strona logowania. Będzie zawierać kliencki komponent React `LoginForm` odpowiedzialny za interakcję z użytkownikiem.
- `src/pages/register.astro`: Strona rejestracji. Będzie zawierać kliencki komponent React `RegisterForm`.

#### 1.2. Nowe komponenty (React)

W katalogu `src/components/features/auth` zostaną utworzone następujące komponenty React:

- `AuthForm.tsx`: Generyczny komponent obudowujący formularze autentykacji, zawierający wspólną logikę UI, taką jak obsługa stanu ładowania, wyświetlanie błędów itp.
- `LoginForm.tsx`: Formularz logowania z polami na e-mail i hasło. Będzie wykorzystywał `AuthForm`. Po pomyślnym zalogowaniu, przekieruje użytkownika do strony `/generate`.
- `RegisterForm.tsx`: Formularz rejestracji z polami na e-mail, hasło i powtórzenie hasła. Po pomyślnej rejestracji, użytkownik zostanie automatycznie zalogowany i przekierowany do `/generate`.

Komponenty te będą odpowiedzialne za:
- Zarządzanie stanem formularza (np. przy użyciu `react-hook-form`).
- Walidację po stronie klienta (np. przy użyciu `zod` i `@hookform/resolvers/zod`).
- Wyświetlanie komunikatów o błędach i sukcesie (np. przy użyciu `sonner`).

#### 1.3. Modyfikacja istniejących komponentów i layoutów

- **`src/layouts/Layout.astro`**:
  - Layout będzie pobierał informacje o sesji użytkownika z `Astro.locals.session`.
  - Na podstawie istnienia sesji, będzie renderował odpowiedni stan nawigacji, przekazując dane o użytkowniku do `LandingNavigation.astro`.

- **`src/components/features/LandingNavigation.astro`**:
  - Komponent zostanie rozbudowany o logikę warunkowego renderowania.
  - **Dla użytkownika niezalogowanego (non-auth):** Wyświetli przyciski "Zaloguj się" i "Zarejestruj się".
  - **Dla użytkownika zalogowanego (auth):** Zamiast przycisków logowania/rejestracji, wyświetli proste menu z linkiem do "/generate" oraz przycisk "Wyloguj". Przycisk "Wyloguj" będzie formularzem POST kierującym do endpointu API wylogowującego.

#### 1.4. Scenariusze i obsługa błędów

- **Walidacja:**
  - Pola e-mail muszą być w poprawnym formacie.
  - Hasło musi spełniać minimalne wymagania bezpieczeństwa (np. 8 znaków, mała/wielka litera, cyfra - zgodnie z konfiguracją Supabase).
  - Pola "hasło" i "powtórz hasło" muszą być identyczne.
  - Komunikaty walidacyjne będą wyświetlane pod odpowiednimi polami formularza.
- **Błędy API:**
  - Nieprawidłowe dane logowania: "Nieprawidłowy e-mail lub hasło."
  - Użytkownik już istnieje: "Użytkownik o tym adresie e-mail już istnieje."
  - Błędy serwera/sieci: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."
  - Komunikaty będą wyświetlane globalnie dla formularza (np. za pomocą `sonner`).

### 2. Logika backendowa

#### 2.1. Endpointy API (Astro)

Endpointy będą zlokalizowane w `src/pages/api/v1/auth`:

- `src/pages/api/v1/auth/register.ts` (POST):
  - Przyjmuje `email` i `password`.
  - Wykorzystuje `supabase.auth.signUp()` z `supabase.server.ts` do utworzenia nowego użytkownika, z opcją wyłączenia potwierdzenia e-maila dla natychmiastowego logowania.
  - Zwraca sesję użytkownika w przypadku sukcesu lub błąd w przypadku niepowodzenia.
- `src/pages/api/v1/auth/login.ts` (POST):
  - Przyjmuje `email` i `password`.
  - Wykorzystuje `supabase.auth.signInWithPassword()` do zalogowania użytkownika.
  - Zwraca sesję w przypadku sukcesu lub błąd.
- `src/pages/logout.astro`:
  - Wykorzystuje `supabase.auth.signOut()` do unieważnienia sesji.
  - Usuwa cookie sesji i przekierowuje na stronę główną.

#### 2.2. Middleware

Kluczowym elementem ochrony tras będzie middleware w Astro.

- **`src/middleware/index.ts`**:
  - Plik zostanie rozbudowany, aby na podstawie `Astro.url.pathname` sprawdzać, czy użytkownik próbuje uzyskać dostęp do chronionej ścieżki (np. `/generate`, `/account`).
  - Dla każdej przychodzącej prośby, middleware będzie tworzyć serwerowego klienta Supabase i próbować odczytać sesję z ciasteczek.
  - Dane sesji i użytkownika będą umieszczane w `Astro.locals`, co udostępni je w layoutach i stronach (`Astro.locals.session`).
  - Jeśli użytkownik nie jest zalogowany i próbuje wejść na chronioną stronę, zostanie przekierowany na `/login` z `status: 302`.
  - Jeśli zalogowany użytkownik spróbuje wejść na `/login` lub `/register`, zostanie przekierowany do `/`.

#### 2.3. Modele danych i walidacja

- Supabase Auth zarządza tabelą `auth.users`.
- Walidacja danych wejściowych w endpointach API będzie realizowana przy użyciu biblioteki Zod, aby zapewnić integralność i bezpieczeństwo danych.

### 3. System autentykacji (Supabase Auth)

#### 3.1. Konfiguracja

- Wykorzystamy bibliotekę `@supabase/ssr` do obsługi autentykacji po stronie serwera w środowisku Astro.
- Klucze API Supabase będą przechowywane w zmiennych środowiskowych (`.env`).
- Zostaną utworzone dwa klienty Supabase:
  - `src/db/supabase.client.ts`: Klient do użytku w komponentach klienckich (React).
  - `src/db/supabase.server.ts`: Klient do użytku po stronie serwera (endpointy API, middleware).
- W konfiguracji Supabase, potwierdzenie e-maila zostanie wyłączone, aby użytkownicy mogli być natychmiast zalogowani po rejestracji.

#### 3.2. Przepływ sesji

1. Użytkownik loguje się lub rejestruje poprzez formularz React.
2. Formularz wywołuje odpowiednią metodę z klienckiego SDK Supabase (`supabase.auth.signInWithPassword` lub `signUp`).
3. SDK Supabase komunikuje się z API Supabase, które w odpowiedzi zwraca token i ustawia go w ciasteczku przeglądarki (`sb-access-token`, `sb-refresh-token`).
4. Przy każdej kolejnej nawigacji (przejście na inną stronę), middleware Astro odczytuje ciasteczko.
5. Używając serwerowego klienta Supabase i tokena z ciasteczka, middleware weryfikuje sesję i pobiera dane użytkownika, udostępniając je w `Astro.locals`.
6. Strony i layouty renderują się warunkowo w zależności od obecności sesji w `Astro.locals`.
7. Wylogowanie (przez endpoint API) wywołuje `supabase.auth.signOut()` po stronie serwera, co unieważnia tokeny i usuwa ciasteczka.
