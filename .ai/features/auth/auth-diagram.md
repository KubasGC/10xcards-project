# Diagram przepływu procesu uwierzytelniania

## Opis diagramu

Diagram przedstawia kompletny przepływ procesu uwierzytelniania w aplikacji 10xCards, obejmujący:

1. **Rejestrację użytkownika** - proces tworzenia nowego konta
2. **Logowanie** - proces uwierzytelniania istniejącego użytkownika
3. **Middleware autoryzacji** - sprawdzanie dostępu do chronionych zasobów
4. **Wylogowanie** - zakończenie sesji użytkownika

### Kluczowe komponenty systemu

- **Frontend** - Komponenty React (LoginForm, RegisterForm) i strony Astro (login.astro, register.astro)
- **Backend** - Endpointy API Astro (/api/v1/auth/*)
- **Middleware** - Core middleware (inicjalizacja Supabase) i Auth middleware (sprawdzanie sesji)
- **Supabase Auth** - Zarządzanie użytkownikami, sesjami i tokenami
- **Cookies** - Przechowywanie tokenów sesji po stronie klienta

### Przepływy

#### Rejestracja

Użytkownik → RegisterForm → API /register → Supabase Auth → Sesja → Cookies → Przekierowanie

#### Logowanie

Użytkownik → LoginForm → API /login → Supabase Auth → Sesja → Cookies → Przekierowanie

#### Dostęp do chronionych zasobów

Żądanie → Core Middleware → Auth Middleware → Sprawdzenie sesji → Dostęp lub przekierowanie

#### Wylogowanie

Użytkownik → Logout → API /logout → Supabase Auth → Usunięcie cookies → Przekierowanie

## Szczegółowy opis przepływów

### 1. Przepływ rejestracji

1. Użytkownik klika przycisk "Zarejestruj się" w `LandingNavigation.astro`
2. Przechodzi na stronę `/register.astro` zawierającą `RegisterForm` component
3. Wypełnia formularz (email, hasło, powtórz hasło) z walidacją po stronie klienta
4. Formularz wysyła POST do `/api/v1/auth/register`
5. Endpoint używa `supabase.auth.signUp()` z wyłączonym potwierdzeniem email
6. Supabase tworzy użytkownika i zwraca sesję
7. Cookies są ustawiane automatycznie przez `@supabase/ssr`
8. Użytkownik zostaje przekierowany na `/generate`

### 2. Przepływ logowania

1. Użytkownik klika przycisk "Zaloguj się" w `LandingNavigation.astro`
2. Przechodzi na stronę `/login.astro` zawierającą `LoginForm` component
3. Wypełnia formularz (email, hasło) z walidacją
4. Formularz wysyła POST do `/api/v1/auth/login`
5. Endpoint używa `supabase.auth.signInWithPassword()`
6. Supabase weryfikuje dane i zwraca sesję
7. Cookies są ustawiane
8. Użytkownik zostaje przekierowany na `/generate`

### 3. Przepływ autoryzacji (Middleware)

1. Każde żądanie przechodzi przez sekwencję middleware: `coreMiddleware` → `authMiddleware`
2. `coreMiddleware` inicjalizuje klienta Supabase server z obsługą cookies
3. `authMiddleware` sprawdza czy ścieżka jest publiczna
4. Dla ścieżek chronionych sprawdza sesję poprzez `supabase.auth.getSession()`
5. Jeśli sesja istnieje - ustawia `context.locals.session` i kontynuuje
6. Jeśli brak sesji - przekierowuje na stronę główną

### 4. Przepływ wylogowania

1. Użytkownik klika przycisk "Wyloguj" w nawigacji
2. Wysyłany jest POST do `/logout`
3. Endpoint wywołuje `supabase.auth.signOut()`
4. Supabase unieważnia sesję i usuwa cookies
5. Użytkownik zostaje przekierowany na stronę główną

## Techniczne szczegóły implementacji

### Middleware

- `coreMiddleware`: Inicjalizuje `context.locals.supabase` używając `createSupabaseServerClient`
- `authMiddleware`: Sprawdza sesję dla chronionych ścieżek, przekierowuje niezalogowanych

### API Endpoints

- Używają `supabase.server.ts` klienta
- Walidacja danych wejściowych przy użyciu Zod
- Obsługa błędów z odpowiednimi komunikatami

### Komponenty React

- `AuthForm`: Wspólny komponent bazowy dla formularzy
- `LoginForm`/`RegisterForm`: Specyficzne implementacje z walidacją
- Używają `react-hook-form` + `zod` dla walidacji
- Wyświetlają błędy przy użyciu `sonner`

### Supabase Auth

- Wyłączone potwierdzenie email dla natychmiastowego dostępu
- Automatyczna obsługa cookies przez `@supabase/ssr`
- Sesje zarządzane po stronie serwera

## Diagram Mermaid

```mermaid
flowchart TD
    %% Użytkownik i interfejs
    U[Użytkownik] -->|Kliknięcie Zarejestruj się| RF[RegisterForm<br/>React Component]
    U -->|Kliknięcie Zaloguj się| LF[LoginForm<br/>React Component]
    U -->|Żądanie chronionej strony| MW[Middleware<br/>Sequence]

    %% Formularze rejestracji i logowania
    RF -->|POST /api/v1/auth/register| ARE[API Register<br/>register.ts]
    LF -->|POST /api/v1/auth/login| ALI[API Login<br/>login.ts]

    %% API Endpoints
    ARE -->|supabase.auth.signUp| SA[Supabase Auth<br/>signUp]
    ALI -->|supabase.auth.signInWithPassword| SAL[Supabase Auth<br/>signInWithPassword]

    %% Supabase Auth
    SA -->|Sukces| SESS[Tworzenie sesji<br/>i tokenów]
    SAL -->|Sukces| SESS
    SA -->|Błąd| ERR_R[Błąd rejestracji<br/>np. użytkownik istnieje]
    SAL -->|Błąd| ERR_L[Błąd logowania<br/>np. błędne dane]

    %% Middleware sekwencja
    MW --> CM[Core Middleware<br/>core.ts]
    CM --> AM[Auth Middleware<br/>auth.ts]

    AM -->|Publiczna ścieżka?| PUB{Public Routes?<br/>/, /login, /register}
    PUB -->|Tak| NEXT[Next<br/>kontynuuj]
    PUB -->|Nie| CHK[Sprawdź sesję<br/>supabase.auth.getSession]

    CHK -->|Sesja istnieje| AUTH_OK[Sesja OK<br/>context.locals.session]
    CHK -->|Brak sesji| REDIR_HOME[Przekieruj na /<br/>302]

    %% Obsługa błędów i sukcesów
    ERR_R --> RF
    ERR_L --> LF
    AUTH_OK --> NEXT
    NEXT --> PAGE[Render strony<br/>z dostępem do session]

    %% Sesja i cookies
    SESS --> COOKIES[Ustaw cookies<br/>sb-access-token<br/>sb-refresh-token]
    COOKIES --> REDIR_GEN[Przekieruj na /generate<br/>po rejestracji/logowaniu]

    %% Wylogowanie
    U -->|Kliknięcie Wyloguj| LOGOUT[Logout Form<br/>POST /logout]
    LOGOUT --> ALO[API Logout<br/>logout.astro]
    ALO -->|supabase.auth.signOut| SAO[Supabase Auth<br/>signOut]
    SAO --> CLR[Usuń cookies<br/>sesji]
    CLR --> REDIR_ROOT[Przekieruj na /]

    %% Style dla lepszej czytelności
    classDef frontend fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef backend fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef middleware fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef auth fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef error fill:#ffebee,stroke:#b71c1c,stroke-width:2px
    classDef success fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class RF,LF,LOGOUT frontend
    class ARE,ALI,ALO backend
    class CM,AM middleware
    class SA,SAL,SAO,SESS auth
    class ERR_R,ERR_L,REDIR_HOME error
    class AUTH_OK,COOKIES,REDIR_GEN,REDIR_ROOT success
```
