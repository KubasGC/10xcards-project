# Plan Testów dla 10xCards

## 1. Przegląd Projektu

### Opis Funkcjonalności

10xCards to aplikacja webowa do tworzenia, organizacji i nauki fiszek przy użyciu sztucznej inteligencji i metody spaced repetition. Aplikacja składa się z następujących głównych funkcjonalności:

#### Funkcjonalności Kluczowe (zaimplementowane w MVP)

- **Autentykacja użytkowników** - rejestracja, logowanie, wylogowanie z wykorzystaniem Supabase Auth
- **Generowanie fiszek przez AI** - OpenRouter.ai generuje kandydatury fiszek z tekstu źródłowego z opcjonalną wskazówką
- **Zarządzanie oczekującymi fiszkami** - przeglądanie, edycja, akceptacja i odrzucanie kandydatur AI
- **Zarządzanie zestawami** - tworzenie, edycja, usuwanie i przeglądanie zestawów fiszek
- **Zarządzanie fiszkami** - ręczne tworzenie, edycja, usuwanie i przeglądanie fiszek w zestawach
- **Limity generacji** - 10 generacji na użytkownika dziennie z resetem o północy UTC
- **Analityka AI** - zbieranie anonimowych metadanych (model, tokeny, czas, koszt) bez treści promptów

#### Funkcjonalności Planowane (poza MVP)

- **Spaced repetition** - system powtórek z wykorzystaniem biblioteki open-source
- **Automatyczna kategoryzacja** - AI kategoryzuje zestawy dla celów analitycznych

### Główne Komponenty Systemu

#### Frontend

- **Framework**: Astro 5 z React 19 dla komponentów interaktywnych
- **Styling**: Tailwind CSS 4 + Shadcn/ui
- **Zarządzanie stanem**: React Hooks (useState, useCallback, useEffect)
- **Formularze**: react-hook-form z walidacją Zod
- **Komponenty**:
  - Strony publiczne: Landing, Login, Register
  - Strony chronione: Generate, Pending, Dashboard, Set Details
  - Komponenty React: AuthForm, GenerateFlashcardsForm, PendingFlashcardCard, SetManagement

#### Backend

- **Runtime**: Astro API Routes (Node.js/Cloudflare Workers)
- **Baza danych**: PostgreSQL przez Supabase
- **Autentykacja**: Supabase Auth (cookie-based sessions)
- **Middleware**: Core (inicjalizacja Supabase) + Auth (sprawdzanie sesji)
- **API**: RESTful endpoints w `/api/v1/*`

#### Integracje Zewnętrzne

- **Supabase**: Auth, PostgreSQL, RLS (Row Level Security)
- **OpenRouter.ai**: Generowanie fiszek z wykorzystaniem różnych modeli AI

#### Baza Danych

- **sets** - zestawy fiszek użytkownika
- **flashcards** - zaakceptowane fiszki w zestawach
- **pending_flashcards** - kandydatury AI oczekujące na akceptację
- **ai_generation_analytics** - anonimowe metadane generacji
- **auth.users** - użytkownicy (zarządzane przez Supabase)

---

## 2. Strategia Testowania

### Podejście Ogólne

Strategia testowania dla 10xCards opiera się na piramidzie testów, z naciskiem na testy jednostkowe jako fundament, wsparte testami integracyjnymi i uzupełnione testami E2E dla krytycznych przepływów użytkownika.

### Zasady Testowania

1. **Test-Driven Development (TDD) dla nowych funkcji** - pisanie testów przed implementacją
2. **Pokrycie kodu minimum 80%** dla logiki biznesowej i serwisów
3. **Continuous Integration** - wszystkie testy muszą przechodzić przed merge
4. **Izolacja testów** - każdy test działa niezależnie, bez skutków ubocznych
5. **Testy jako dokumentacja** - testy opisują oczekiwane zachowanie systemu
6. **Mock zewnętrznych zależności** - izolacja od Supabase, OpenRouter w testach jednostkowych
7. **Testy E2E dla happy paths** - weryfikacja kluczowych przepływów użytkownika

### Priorytetyzacja

**Priorytet 1 - Krytyczne (must have):**

- Autentykacja i autoryzacja
- Generowanie fiszek przez AI
- Limity generacji (quota)
- Podstawowe CRUD dla fiszek i zestawów

**Priorytet 2 - Ważne (should have):**

- Walidacja danych wejściowych
- Obsługa błędów API
- Middleware autoryzacyjny
- Row Level Security w Supabase

**Priorytet 3 - Nice to have:**

- Optymalizacja wydajności
- Testy dostępności (accessibility)
- Testy wydajnościowe pod obciążeniem

---

## 3. Typy Testów

### 3.1. Testy Jednostkowe (Unit Tests)

Testy jednostkowe weryfikują pojedyncze funkcje, metody i komponenty w izolacji.

#### Zakres

**Serwisy:**

- `ai-generation.service.ts` - checkDailyQuota, savePendingFlashcards, recordAnalytics, calculateCost
- `openrouter.service.ts` - generateFlashcards, _buildPayload,_parseResponse
- Helpery: api-error.helper.ts

**Schematy walidacji:**

- `auth.schema.ts` - walidacja logowania i rejestracji
- `generate-flashcards.schema.ts` - walidacja żądania generowania

**Hooki React:**

- `useGenerateFlashcards.ts` - zarządzanie stanem generowania
- `usePendingFlashcards.ts` - zarządzanie stanem oczekujących fiszek

**Komponenty React:**

- `AuthForm.tsx`, `LoginForm.tsx`, `RegisterForm.tsx`
- `GenerateFlashcardsForm.tsx`
- `PendingFlashcardCard.tsx`
- Komponenty UI z shadcn (Button, Input, Dialog, etc.)

**Funkcje pomocnicze:**

- `calculateCost()` - obliczanie kosztu generacji
- `getNextMidnightUTC()` - obliczanie resetu limitu
- `transformQuotaDTO()` - transformacja DTO na ViewModel

#### Metryki

- **Pokrycie kodu**: minimum 80% dla serwisów i logiki biznesowej
- **Czas wykonania**: < 5 sekund dla wszystkich testów jednostkowych

---

### 3.2. Testy Integracyjne (Integration Tests)

Testy integracyjne weryfikują współpracę między warstwami aplikacji.

#### Zakres

**API Endpoints:**

- POST `/api/v1/auth/login` - logowanie użytkownika
- POST `/api/v1/auth/register` - rejestracja użytkownika
- GET `/api/v1/users/me/generation-quota` - pobieranie limitu
- POST `/api/v1/flashcards/generate` - generowanie fiszek przez AI
- GET `/api/v1/pending-flashcards` - lista oczekujących fiszek
- POST `/api/v1/pending-flashcards/:id/accept` - akceptacja fiszki
- POST `/api/v1/pending-flashcards/bulk-accept` - masowa akceptacja
- POST `/api/v1/pending-flashcards/bulk-delete` - masowe usuwanie
- GET/POST `/api/v1/sets` - lista i tworzenie zestawów
- GET/PATCH/DELETE `/api/v1/sets/:id` - operacje na zestawie
- GET `/api/v1/sets/:id/flashcards` - fiszki w zestawie

**Middleware:**

- `coreMiddleware` - inicjalizacja klienta Supabase
- `authMiddleware` - weryfikacja sesji i przekierowania

**Baza danych:**

- Row Level Security (RLS) policies
- Constrainty walidacyjne (długość pól, unique constraints)
- Kaskadowe usuwanie (cascade deletes)
- Triggery (auto-update timestamps)

**Integracja z Supabase:**

- Autentykacja (signUp, signIn, signOut)
- Operacje CRUD z uwzględnieniem RLS
- Transakcje bazodanowe

#### Środowisko

- **Test Database**: Osobna instancja Supabase dla testów (lub Supabase local)
- **Test API Keys**: Dedykowane klucze dla środowiska testowego
- **Cleanup**: Automatyczne czyszczenie danych po każdym teście

#### Metryki

- **Pokrycie**: wszystkie endpointy API
- **Czas wykonania**: < 30 sekund dla całego zestawu

---

### 3.3. Testy End-to-End (E2E Tests)

Testy E2E weryfikują kompletne przepływy użytkownika w rzeczywistym środowisku przeglądarki.

#### Zakres

**Krytyczne przepływy użytkownika:**

1. **Przepływ rejestracji i pierwszego generowania:**
   - Otwarcie strony głównej
   - Kliknięcie "Zarejestruj się"
   - Wypełnienie formularza rejestracji
   - Przekierowanie na `/generate`
   - Wklejenie tekstu źródłowego
   - Generowanie fiszek
   - Weryfikacja wyświetlenia kandydatur

2. **Przepływ logowania:**
   - Otwarcie `/login`
   - Wypełnienie formularza
   - Weryfikacja przekierowania
   - Sprawdzenie sesji użytkownika

3. **Przepływ generowania i akceptacji:**
   - Logowanie użytkownika
   - Przejście do `/generate`
   - Generowanie fiszek
   - Przejście do `/pending`
   - Edycja kandydatury
   - Akceptacja do nowego zestawu
   - Weryfikacja fiszki w zestawie

4. **Przepływ zarządzania zestawami:**
   - Tworzenie nowego zestawu
   - Dodanie fiszki manualnie
   - Edycja fiszki
   - Usunięcie fiszki
   - Usunięcie zestawu

5. **Przepływ limitów generacji:**
   - Generowanie fiszek do osiągnięcia limitu
   - Weryfikacja komunikatu o przekroczeniu
   - Sprawdzenie czasu resetu

6. **Przepływ masowej akceptacji:**
   - Generowanie wielu kandydatur
   - Zaznaczenie wszystkich
   - Bulk accept do zestawu
   - Weryfikacja wszystkich fiszek

#### Środowisko

- **Framework**: Playwright (rekomendowany dla Astro)
- **Przeglądarki**: Chromium, Firefox, WebKit
- **Rozdzielczości**: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
- **Test Environment**: Dedykowane środowisko testowe z testową bazą danych

#### Metryki

- **Pokrycie**: wszystkie krytyczne happy paths
- **Czas wykonania**: < 5 minut dla całego zestawu

---

### 3.4. Testy Wydajnościowe (Performance Tests)

Testy wydajnościowe weryfikują czas odpowiedzi i stabilność pod obciążeniem.

#### Zakres

**Load Testing:**

- Generowanie fiszek przez 100 równoczesnych użytkowników
- Pobieranie list zestawów dla 1000 użytkowników
- Masowa akceptacja 50 fiszek jednocześnie

**Stress Testing:**

- Testowanie limitów bazy danych (max connections)
- Testowanie API OpenRouter pod obciążeniem
- Testowanie cache'owania sesji

**Performance Benchmarks:**

- Czas odpowiedzi API < 200ms dla 95% żądań
- Czas generowania fiszek < 5s
- Czas ładowania strony < 2s (First Contentful Paint)

#### Narzędzia

- **k6** lub **Artillery** dla testów obciążeniowych API
- **Lighthouse** dla performance metrics frontendu
- **PostgreSQL EXPLAIN ANALYZE** dla optymalizacji zapytań

---

### 3.5. Testy Bezpieczeństwa (Security Tests)

#### Zakres

**Authentication & Authorization:**

- Próby dostępu do chronionych endpointów bez sesji
- Próby dostępu do zasobów innych użytkowników
- Weryfikacja Row Level Security
- SQL injection prevention (przez Supabase)

**Input Validation:**

- XSS prevention w polach tekstowych
- CSRF protection (cookies SameSite)
- Walidacja długości pól (overflow attempts)

**Rate Limiting:**

- Respektowanie limitów generacji
- Protection przed brute-force na login

**Data Privacy:**

- Brak logowania wrażliwych danych (hasła, tokeny)
- Brak przechowywania tekstów źródłowych
- Anonimizacja metadanych AI

---

### 3.6. Testy Dostępności (Accessibility Tests)

#### Zakres

**WCAG 2.1 Level AA Compliance:**

- Nawigacja klawiaturą (Tab, Enter, Escape)
- Screen reader compatibility (ARIA labels)
- Kontrast kolorów (minimum 4.5:1)
- Focus indicators
- Semantic HTML

**Narzędzia:**

- **axe-core** - automatyczne testy dostępności
- **jest-axe** - integracja z testami jednostkowymi
- **Lighthouse Accessibility Score** > 90

---

## 4. Narzędzia Testowe

### 4.1. Testy Jednostkowe i Integracyjne

**Framework testowy:** **Vitest**

**Uzasadnienie:**

- Natywna integracja z Vite (używany przez Astro)
- Bardzo szybkie wykonanie testów (dzięki ESM i hot reloading)
- Kompatybilne API z Jest
- Wbudowane wsparcie dla TypeScript
- Doskonałe dla testowania kodu TypeScript i React

**Biblioteki pomocnicze:**

```json
{
  "vitest": "^2.1.0",
  "@vitest/ui": "^2.1.0",
  "@testing-library/react": "^16.0.0",
  "@testing-library/user-event": "^14.5.0",
  "@testing-library/jest-dom": "^6.5.0",
  "msw": "^2.6.0"
}
```

**Konfiguracja:**

- `vitest.config.ts` - konfiguracja główna
- `setup-tests.ts` - setup dla @testing-library
- Mock Service Worker (MSW) dla mockowania API

---

### 4.2. Testy E2E

**Framework testowy:** **Playwright**

**Uzasadnienie:**

- Rekomendowany przez Astro
- Wsparcie dla wielu przeglądarek (Chromium, Firefox, WebKit)
- Auto-waiting dla elementów
- Wbudowane narzędzia deweloperskie (trace viewer, inspector)
- Doskonałe wsparcie dla testów mobilnych

**Konfiguracja:**

```json
{
  "@playwright/test": "^1.48.0"
}
```

**Konfiguracja:**

- `playwright.config.ts` - konfiguracja projektów (desktop, mobile)
- Separate test database connection
- Fixtures dla authenticated users

---

### 4.3. Testy Wydajnościowe

**Narzędzia:**

**k6** - load testing

```javascript
// k6 script example
import http from 'k6/http';

export default function() {
  http.post('http://localhost:4321/api/v1/flashcards/generate', {...});
}
```

**Lighthouse CI** - frontend performance

```json
{
  "@lhci/cli": "^0.14.0"
}
```

---

### 4.4. Mock i Test Data

**Mock Service Worker (MSW)** - mockowanie API w testach jednostkowych

```typescript
// handlers.ts
export const handlers = [
  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({ user: {...} })
  })
]
```

**Test Data Builders** - generowanie danych testowych

```typescript
// test-builders.ts
export const buildUser = (overrides = {}) => ({
  id: uuid(),
  email: 'test@example.com',
  ...overrides
})
```

**Supabase Test Helpers** - utilities dla testów integracyjnych

```typescript
// supabase-test-helpers.ts
export const createTestUser = async () => {...}
export const cleanupTestData = async () => {...}
```

---

## 5. Struktura Katalogów Testowych

```
10xcards-project/
├── src/
│   ├── lib/
│   │   ├── services/
│   │   │   ├── ai-generation.service.ts
│   │   │   └── ai-generation.service.test.ts
│   │   │   ├── openrouter.service.ts
│   │   │   └── openrouter.service.test.ts
│   │   ├── schemas/
│   │   │   ├── auth.schema.ts
│   │   │   └── auth.schema.test.ts
│   │   ├── helpers/
│   │   │   ├── api-error.helper.ts
│   │   │   └── api-error.helper.test.ts
│   ├── hooks/
│   │   ├── useGenerateFlashcards.ts
│   │   └── useGenerateFlashcards.test.ts
│   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── AuthForm.tsx
│   │   │   │   └── AuthForm.test.tsx
│   │   │   ├── GenerateFlashcardsForm.tsx
│   │   │   └── GenerateFlashcardsForm.test.tsx
│   ├── pages/
│   │   └── api/
│   │       └── v1/
│   │           ├── auth/
│   │           │   ├── login.ts
│   │           │   └── login.test.ts
│   │           ├── flashcards/
│   │           │   ├── generate.ts
│   │           │   └── generate.test.ts
├── tests/
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── generate-flashcards.spec.ts
│   │   ├── pending-flashcards.spec.ts
│   │   ├── sets-management.spec.ts
│   │   └── fixtures/
│   │       └── authenticated-user.ts
│   ├── integration/
│   │   ├── api/
│   │   │   ├── auth.integration.test.ts
│   │   │   ├── generate.integration.test.ts
│   │   │   └── sets.integration.test.ts
│   │   ├── middleware/
│   │   │   └── auth.integration.test.ts
│   │   └── database/
│   │       ├── rls-policies.test.ts
│   │       └── constraints.test.ts
│   ├── performance/
│   │   ├── k6/
│   │   │   ├── generate-load.js
│   │   │   └── api-stress.js
│   │   └── lighthouse/
│   │       └── config.js
│   ├── helpers/
│   │   ├── test-builders.ts
│   │   ├── supabase-test-helpers.ts
│   │   ├── mock-handlers.ts
│   │   └── test-utils.tsx
│   └── setup/
│       ├── vitest.setup.ts
│       ├── playwright.setup.ts
│       └── test-db.ts
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

### Konwencje Nazewnictwa

- **Unit tests**: `*.test.ts` lub `*.test.tsx` (obok pliku źródłowego)
- **Integration tests**: `*.integration.test.ts`
- **E2E tests**: `*.spec.ts` (w katalogu `tests/e2e`)
- **Test helpers**: `*.helper.ts` lub `*-helpers.ts`
- **Mock data**: `*.mock.ts` lub `*.fixture.ts`

---

## 6. Przykłady Testów

### 6.1. Test Jednostkowy - Serwis AI Generation

```typescript
// src/lib/services/ai-generation.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkDailyQuota, calculateCost, getNextMidnightUTC } from './ai-generation.service'
import { createMockSupabaseClient } from '../../../tests/helpers/supabase-test-helpers'

describe('AI Generation Service', () => {
  describe('checkDailyQuota', () => {
    it('should return 0 when user has no generations today', async () => {
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: 0, error: null })
      })

      const result = await checkDailyQuota(mockSupabase, 'user-123')

      expect(result).toBe(0)
    })

    it('should return correct count when user has generations today', async () => {
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: 5, error: null })
      })

      const result = await checkDailyQuota(mockSupabase, 'user-123')

      expect(result).toBe(5)
    })

    it('should throw error when database query fails', async () => {
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ 
          count: null, 
          error: { message: 'Database error' } 
        })
      })

      await expect(checkDailyQuota(mockSupabase, 'user-123'))
        .rejects.toThrow('Failed to check daily quota')
    })
  })

  describe('calculateCost', () => {
    it('should calculate correct cost for GPT-4 Turbo', () => {
      const cost = calculateCost(1000, 'gpt-4-turbo')
      expect(cost).toBe(0.02) // $0.02 per 1K tokens
    })

    it('should calculate correct cost for GPT-3.5 Turbo', () => {
      const cost = calculateCost(1000, 'gpt-3.5-turbo')
      expect(cost).toBe(0.001) // $0.001 per 1K tokens
    })

    it('should use default cost for unknown models', () => {
      const cost = calculateCost(1000, 'unknown-model')
      expect(cost).toBe(0.01) // Default $0.01 per 1K tokens
    })

    it('should scale cost linearly with token count', () => {
      const cost1 = calculateCost(1000, 'gpt-4-turbo')
      const cost2 = calculateCost(2000, 'gpt-4-turbo')
      expect(cost2).toBe(cost1 * 2)
    })
  })

  describe('getNextMidnightUTC', () => {
    it('should return tomorrow midnight UTC', () => {
      const result = getNextMidnightUTC()
      const resultDate = new Date(result)

      expect(resultDate.getUTCHours()).toBe(0)
      expect(resultDate.getUTCMinutes()).toBe(0)
      expect(resultDate.getUTCSeconds()).toBe(0)
      expect(resultDate.getUTCMilliseconds()).toBe(0)
      
      // Should be in the future
      expect(resultDate.getTime()).toBeGreaterThan(Date.now())
    })
  })
})
```

---

### 6.2. Test Jednostkowy - OpenRouter Service

```typescript
// src/lib/services/openrouter.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenRouterService } from './openrouter.service'
import { z } from 'zod'
import { OpenRouterConfigurationError, OpenRouterAPIError } from './openrouter.types'

// Mock environment variables
vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key')
vi.stubEnv('OPENROUTER_MODEL', 'test-model')

const FlashcardsSchema = z.object({
  flashcards: z.array(z.object({
    front: z.string(),
    back: z.string()
  }))
})

describe('OpenRouterService', () => {
  describe('constructor', () => {
    it('should throw error when API key is missing', () => {
      vi.stubEnv('OPENROUTER_API_KEY', '')
      
      expect(() => new OpenRouterService())
        .toThrow(OpenRouterConfigurationError)
    })

    it('should throw error when model is missing', () => {
      vi.stubEnv('OPENROUTER_MODEL', '')
      
      expect(() => new OpenRouterService({ apiKey: 'test-key' }))
        .toThrow(OpenRouterConfigurationError)
    })

    it('should initialize with config parameters', () => {
      const service = new OpenRouterService({
        apiKey: 'custom-key',
        model: 'custom-model'
      })
      
      expect(service).toBeInstanceOf(OpenRouterService)
    })
  })

  describe('generateFlashcards', () => {
    it('should successfully generate flashcards', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                flashcards: [
                  { front: 'Question 1', back: 'Answer 1' },
                  { front: 'Question 2', back: 'Answer 2' }
                ]
              })
            }
          }]
        })
      })

      const service = new OpenRouterService()
      const result = await service.generateFlashcards({
        sourceText: 'Test source text',
        responseSchema: FlashcardsSchema
      })

      expect(result.flashcards).toHaveLength(2)
      expect(result.flashcards[0].front).toBe('Question 1')
    })

    it('should include hint in user prompt when provided', async () => {
      let capturedPayload: any

      global.fetch = vi.fn().mockImplementation(async (url, options) => {
        capturedPayload = JSON.parse(options.body)
        return {
          ok: true,
          json: async () => ({
            choices: [{
              message: { content: JSON.stringify({ flashcards: [] }) }
            }]
          })
        }
      })

      const service = new OpenRouterService()
      await service.generateFlashcards({
        sourceText: 'Test text',
        hint: 'Focus on main concepts',
        responseSchema: FlashcardsSchema
      })

      const userMessage = capturedPayload.messages.find((m: any) => m.role === 'user')
      expect(userMessage.content).toContain('Focus on main concepts')
    })

    it('should throw OpenRouterAPIError on API error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Error details'
      })

      const service = new OpenRouterService()
      
      await expect(service.generateFlashcards({
        sourceText: 'Test',
        responseSchema: FlashcardsSchema
      })).rejects.toThrow(OpenRouterAPIError)
    })

    it('should throw error on invalid response structure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: { content: 'invalid json' }
          }]
        })
      })

      const service = new OpenRouterService()
      
      await expect(service.generateFlashcards({
        sourceText: 'Test',
        responseSchema: FlashcardsSchema
      })).rejects.toThrow()
    })
  })
})
```

---

### 6.3. Test Jednostkowy - React Hook

```typescript
// src/hooks/useGenerateFlashcards.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useGenerateFlashcards } from './useGenerateFlashcards'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useGenerateFlashcards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch quota on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        daily_limit: 10,
        used_today: 3,
        remaining: 7,
        resets_at: '2025-10-16T00:00:00Z'
      })
    })

    const { result } = renderHook(() => useGenerateFlashcards())

    await waitFor(() => {
      expect(result.current.state.quota.status).toBe('idle')
    })

    expect(result.current.state.quota.data?.remaining).toBe(7)
    expect(result.current.state.quota.data?.limit).toBe(10)
    expect(result.current.state.quota.data?.percentage).toBe(30)
  })

  it('should handle quota fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: { message: 'Failed to fetch quota' }
      })
    })

    const { result } = renderHook(() => useGenerateFlashcards())

    await waitFor(() => {
      expect(result.current.state.quota.status).toBe('error')
    })

    expect(result.current.state.quota.error).toBeTruthy()
  })

  it('should generate flashcards successfully', async () => {
    // Mock quota fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        daily_limit: 10,
        used_today: 0,
        remaining: 10,
        resets_at: '2025-10-16T00:00:00Z'
      })
    })

    const { result } = renderHook(() => useGenerateFlashcards())

    await waitFor(() => {
      expect(result.current.state.quota.status).toBe('idle')
    })

    // Mock generate request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        generation_id: 'gen-123',
        candidates: [
          { id: '1', front_draft: 'Q1', back_draft: 'A1' }
        ],
        metadata: { model: 'gpt-4', generation_time_ms: 1000, tokens_used: 100 },
        quota_remaining: 9
      })
    })

    // Mock updated quota fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        daily_limit: 10,
        used_today: 1,
        remaining: 9,
        resets_at: '2025-10-16T00:00:00Z'
      })
    })

    const response = await result.current.generateFlashcards({
      source_text: 'Test text',
      hint: 'Test hint'
    })

    expect(response).toBeTruthy()
    expect(response?.candidates).toHaveLength(1)
    
    await waitFor(() => {
      expect(result.current.state.quota.data?.remaining).toBe(9)
      expect(result.current.state.generation.status).toBe('success')
    })
  })

  it('should disable submit when quota is exhausted', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        daily_limit: 10,
        used_today: 10,
        remaining: 0,
        resets_at: '2025-10-16T00:00:00Z'
      })
    })

    const { result } = renderHook(() => useGenerateFlashcards())

    await waitFor(() => {
      expect(result.current.isSubmitDisabled).toBe(true)
    })
  })

  it('should reset generation state', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        daily_limit: 10,
        used_today: 0,
        remaining: 10,
        resets_at: '2025-10-16T00:00:00Z'
      })
    })

    const { result } = renderHook(() => useGenerateFlashcards())

    await waitFor(() => {
      expect(result.current.state.quota.status).toBe('idle')
    })

    // Manually set error state
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'Error' } })
    })

    await result.current.generateFlashcards({
      source_text: 'Test'
    })

    await waitFor(() => {
      expect(result.current.state.generation.status).toBe('error')
    })

    // Reset
    result.current.resetGenerationState()

    expect(result.current.state.generation.status).toBe('idle')
    expect(result.current.state.generation.error).toBeNull()
  })
})
```

---

### 6.4. Test Jednostkowy - React Component

```typescript
// src/components/features/auth/LoginForm.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /zaloguj/i })).toBeInTheDocument()
  })

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: /zaloguj/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email jest wymagany/i)).toBeInTheDocument()
      expect(screen.getByText(/hasło jest wymagane/i)).toBeInTheDocument()
    })
  })

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    await user.tab() // Trigger blur validation

    await waitFor(() => {
      expect(screen.getByText(/nieprawidłowy adres email/i)).toBeInTheDocument()
    })
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: '123', email: 'test@example.com' } })
    })

    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/hasło/i), 'password123')
    await user.click(screen.getByRole('button', { name: /zaloguj/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      })
    })
  })

  it('should display error toast on login failure', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: { message: 'Invalid credentials' }
      })
    })

    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/hasło/i), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /zaloguj/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid credentials')
      )
    })
  })

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({})
      }), 100))
    )

    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/hasło/i), 'password123')
    
    const submitButton = screen.getByRole('button', { name: /zaloguj/i })
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
  })
})
```

---

### 6.5. Test Integracyjny - API Endpoint

```typescript
// src/pages/api/v1/flashcards/generate.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { POST } from './generate'
import { createTestUser, cleanupTestData, createTestSupabaseClient } from '../../../../../tests/helpers/supabase-test-helpers'
import { vi } from 'vitest'

describe('POST /api/v1/flashcards/generate', () => {
  let testUser: any
  let authToken: string
  let supabaseClient: any

  beforeEach(async () => {
    // Create test user
    const { user, session } = await createTestUser()
    testUser = user
    authToken = session.access_token
    supabaseClient = createTestSupabaseClient(session)

    // Mock OpenRouter API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              flashcards: [
                { front: 'Question 1', back: 'Answer 1' },
                { front: 'Question 2', back: 'Answer 2' }
              ]
            })
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50
        }
      })
    })
  })

  afterEach(async () => {
    await cleanupTestData(testUser.id)
  })

  it('should generate flashcards successfully', async () => {
    const request = new Request('http://localhost/api/v1/flashcards/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        source_text: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.',
        hint: 'Focus on main concepts'
      })
    })

    const locals = {
      supabase: supabaseClient,
      user: testUser
    }

    const response = await POST({ request, locals } as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.candidates).toHaveLength(2)
    expect(data.candidates[0]).toHaveProperty('id')
    expect(data.candidates[0]).toHaveProperty('front_draft')
    expect(data.candidates[0]).toHaveProperty('back_draft')
    expect(data.metadata).toHaveProperty('model')
    expect(data.metadata).toHaveProperty('generation_time_ms')
    expect(data.quota_remaining).toBeLessThanOrEqual(10)
  })

  it('should return 401 when user is not authenticated', async () => {
    const request = new Request('http://localhost/api/v1/flashcards/generate', {
      method: 'POST',
      body: JSON.stringify({
        source_text: 'Test content'
      })
    })

    const locals = {
      supabase: supabaseClient,
      user: null
    }

    const response = await POST({ request, locals } as any)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('should return 400 for validation errors', async () => {
    const request = new Request('http://localhost/api/v1/flashcards/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        source_text: 'Too short', // < 1000 characters
        hint: 'Test'
      })
    })

    const locals = {
      supabase: supabaseClient,
      user: testUser
    }

    const response = await POST({ request, locals } as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('VALIDATION_ERROR')
    expect(data.error.details).toBeDefined()
    expect(data.error.details[0].field).toBe('source_text')
  })

  it('should return 429 when daily quota is exceeded', async () => {
    // Generate 10 times to exhaust quota
    for (let i = 0; i < 10; i++) {
      const request = new Request('http://localhost/api/v1/flashcards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          source_text: 'A'.repeat(1000)
        })
      })

      const locals = {
        supabase: supabaseClient,
        user: testUser
      }

      await POST({ request, locals } as any)
    }

    // 11th request should fail
    const request = new Request('http://localhost/api/v1/flashcards/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        source_text: 'A'.repeat(1000)
      })
    })

    const locals = {
      supabase: supabaseClient,
      user: testUser
    }

    const response = await POST({ request, locals } as any)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error.code).toBe('GENERATION_LIMIT_EXCEEDED')
  })

  it('should save pending flashcards to database', async () => {
    const request = new Request('http://localhost/api/v1/flashcards/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        source_text: 'A'.repeat(1000)
      })
    })

    const locals = {
      supabase: supabaseClient,
      user: testUser
    }

    const response = await POST({ request, locals } as any)
    const data = await response.json()

    // Verify data was saved to database
    const { data: pendingFlashcards, error } = await supabaseClient
      .from('pending_flashcards')
      .select('*')
      .eq('user_id', testUser.id)

    expect(error).toBeNull()
    expect(pendingFlashcards).toHaveLength(2)
    expect(pendingFlashcards[0].front_draft).toBe(data.candidates[0].front_draft)
  })

  it('should record analytics without storing source text', async () => {
    const sourceText = 'Very sensitive user data that should not be stored'
    
    const request = new Request('http://localhost/api/v1/flashcards/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        source_text: sourceText.repeat(20) // Make it long enough
      })
    })

    const locals = {
      supabase: supabaseClient,
      user: testUser
    }

    await POST({ request, locals } as any)

    // Verify analytics was recorded
    const { data: analytics, error } = await supabaseClient
      .from('ai_generation_analytics')
      .select('*')
      .eq('user_id', testUser.id)

    expect(error).toBeNull()
    expect(analytics).toHaveLength(1)
    expect(analytics[0]).toHaveProperty('model')
    expect(analytics[0]).toHaveProperty('input_tokens')
    expect(analytics[0]).toHaveProperty('output_tokens')
    expect(analytics[0]).toHaveProperty('cost_usd')
    
    // Verify source text was NOT stored
    const analyticsString = JSON.stringify(analytics)
    expect(analyticsString).not.toContain(sourceText)
  })
})
```

---

### 6.6. Test Integracyjny - Middleware

```typescript
// tests/integration/middleware/auth.integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { authMiddleware } from '../../../src/middleware/auth'
import { createTestUser, createTestSupabaseClient } from '../../helpers/supabase-test-helpers'

describe('Auth Middleware Integration', () => {
  let testUser: any
  let authToken: string
  let supabaseClient: any

  beforeEach(async () => {
    const { user, session } = await createTestUser()
    testUser = user
    authToken = session.access_token
    supabaseClient = createTestSupabaseClient(session)
  })

  it('should allow access to public routes without authentication', async () => {
    const context = {
      url: new URL('http://localhost:4321/'),
      locals: {
        supabase: supabaseClient
      }
    }

    const next = vi.fn().mockResolvedValue(new Response('OK'))
    
    const response = await authMiddleware(context as any, next)

    expect(next).toHaveBeenCalled()
    expect(response.status).toBe(200)
  })

  it('should allow authenticated users to access protected routes', async () => {
    const context = {
      url: new URL('http://localhost:4321/generate'),
      locals: {
        supabase: supabaseClient
      }
    }

    const next = vi.fn().mockResolvedValue(new Response('OK'))
    
    const response = await authMiddleware(context as any, next)

    expect(context.locals.user).toBeDefined()
    expect(context.locals.user.id).toBe(testUser.id)
    expect(next).toHaveBeenCalled()
  })

  it('should redirect unauthenticated users from protected routes', async () => {
    const unauthenticatedSupabase = createTestSupabaseClient(null)
    
    const context = {
      url: new URL('http://localhost:4321/generate'),
      locals: {
        supabase: unauthenticatedSupabase
      }
    }

    const next = vi.fn()
    
    const response = await authMiddleware(context as any, next)

    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('/login')
    expect(next).not.toHaveBeenCalled()
  })

  it('should allow authenticated users to access API endpoints', async () => {
    const context = {
      url: new URL('http://localhost:4321/api/v1/sets'),
      locals: {
        supabase: supabaseClient
      }
    }

    const next = vi.fn().mockResolvedValue(new Response('OK'))
    
    const response = await authMiddleware(context as any, next)

    expect(context.locals.user).toBeDefined()
    expect(next).toHaveBeenCalled()
  })
})
```

---

### 6.7. Test E2E - Przepływ Rejestracji i Generowania

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('User Registration and First Generation Flow', () => {
  test('should register new user and generate first flashcards', async ({ page }) => {
    const randomEmail = `test-${Date.now()}@example.com`
    const password = 'TestPassword123!'

    // Navigate to landing page
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /10xCards/i })).toBeVisible()

    // Click register button
    await page.getByRole('link', { name: /zarejestruj się/i }).click()
    await expect(page).toHaveURL('/register')

    // Fill registration form
    await page.getByLabel(/email/i).fill(randomEmail)
    await page.getByLabel(/^hasło/i).fill(password)
    await page.getByLabel(/powtórz hasło/i).fill(password)

    // Submit form
    await page.getByRole('button', { name: /zarejestruj/i }).click()

    // Should redirect to generate page
    await expect(page).toHaveURL('/generate', { timeout: 10000 })

    // Verify user is on generate page
    await expect(page.getByRole('heading', { name: /generuj fiszki/i })).toBeVisible()

    // Check quota indicator is visible
    await expect(page.getByText(/pozostało.*10/i)).toBeVisible()

    // Fill generation form
    const sourceText = `
      TypeScript is a strongly typed programming language that builds on JavaScript.
      It adds optional static typing to JavaScript, which can help catch errors early.
      TypeScript code is transpiled to JavaScript, making it compatible with any browser.
      The type system in TypeScript helps with code documentation and IDE support.
    `.trim()

    await page.getByLabel(/tekst źródłowy/i).fill(sourceText)
    await page.getByLabel(/wskazówka/i).fill('Focus on key concepts of TypeScript')

    // Submit generation form
    await page.getByRole('button', { name: /generuj/i }).click()

    // Wait for generation to complete and redirect to pending
    await expect(page).toHaveURL(/\/pending/, { timeout: 15000 })

    // Verify flashcard candidates are displayed
    await expect(page.getByTestId('pending-flashcard-card')).toHaveCount(2, { 
      timeout: 5000 
    })

    // Verify quota was decremented
    await page.goto('/generate')
    await expect(page.getByText(/pozostało.*9/i)).toBeVisible()
  })

  test('should show validation errors on invalid registration', async ({ page }) => {
    await page.goto('/register')

    // Try to submit empty form
    await page.getByRole('button', { name: /zarejestruj/i }).click()

    // Should show validation errors
    await expect(page.getByText(/email jest wymagany/i)).toBeVisible()
    await expect(page.getByText(/hasło jest wymagane/i)).toBeVisible()

    // Try with mismatched passwords
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/^hasło/i).fill('password123')
    await page.getByLabel(/powtórz hasło/i).fill('different-password')
    await page.getByRole('button', { name: /zarejestruj/i }).click()

    await expect(page.getByText(/hasła muszą być identyczne/i)).toBeVisible()
  })
})
```

---

### 6.8. Test E2E - Przepływ Akceptacji Fiszek

```typescript
// tests/e2e/pending-flashcards.spec.ts
import { test, expect } from '@playwright/test'
import { authenticatedUserFixture } from './fixtures/authenticated-user'

test.describe('Pending Flashcards Management', () => {
  test.use(authenticatedUserFixture)

  test('should edit and accept pending flashcard to new set', async ({ page, authenticatedUser }) => {
    // Generate some flashcards first
    await page.goto('/generate')
    
    const sourceText = 'React is a JavaScript library for building user interfaces. '.repeat(50)
    await page.getByLabel(/tekst źródłowy/i).fill(sourceText)
    await page.getByRole('button', { name: /generuj/i }).click()

    // Wait for redirect to pending page
    await expect(page).toHaveURL(/\/pending/, { timeout: 15000 })

    // Get first flashcard card
    const firstCard = page.getByTestId('pending-flashcard-card').first()
    await expect(firstCard).toBeVisible()

    // Click edit button
    await firstCard.getByRole('button', { name: /edytuj/i }).click()

    // Edit dialog should open
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Edit front and back
    const frontInput = dialog.getByLabel(/przód/i)
    const backInput = dialog.getByLabel(/tył/i)
    
    await frontInput.clear()
    await frontInput.fill('What is React?')
    
    await backInput.clear()
    await backInput.fill('A JavaScript library for building user interfaces')

    // Save changes
    await dialog.getByRole('button', { name: /zapisz/i }).click()

    // Dialog should close
    await expect(dialog).not.toBeVisible()

    // Verify changes are reflected
    await expect(firstCard).toContainText('What is React?')

    // Accept flashcard to new set
    await firstCard.getByRole('button', { name: /akceptuj/i }).click()

    // Accept dialog should open
    const acceptDialog = page.getByRole('dialog', { name: /akceptuj fiszkę/i })
    await expect(acceptDialog).toBeVisible()

    // Select "New Set" option
    await acceptDialog.getByLabel(/nowy zestaw/i).check()

    // Fill set name
    await acceptDialog.getByLabel(/nazwa zestawu/i).fill('React Basics')
    await acceptDialog.getByLabel(/opis/i).fill('Basic concepts of React library')

    // Submit acceptance
    await acceptDialog.getByRole('button', { name: /akceptuj/i }).click()

    // Should show success toast
    await expect(page.getByText(/fiszka została zaakceptowana/i)).toBeVisible()

    // Card should be removed from pending list
    await expect(firstCard).not.toBeVisible()

    // Navigate to dashboard to verify set was created
    await page.goto('/dashboard')
    await expect(page.getByText('React Basics')).toBeVisible()
    await expect(page.getByText(/1 fiszka/i)).toBeVisible()

    // Click on set to view details
    await page.getByText('React Basics').click()

    // Verify flashcard is in the set
    await expect(page.getByText('What is React?')).toBeVisible()
    await expect(page.getByText('A JavaScript library for building user interfaces')).toBeVisible()
  })

  test('should bulk accept multiple flashcards', async ({ page, authenticatedUser }) => {
    // Generate flashcards
    await page.goto('/generate')
    const sourceText = 'JavaScript is a programming language. '.repeat(50)
    await page.getByLabel(/tekst źródłowy/i).fill(sourceText)
    await page.getByRole('button', { name: /generuj/i }).click()

    await expect(page).toHaveURL(/\/pending/, { timeout: 15000 })

    // Select all checkboxes
    const checkboxes = page.getByRole('checkbox', { name: /zaznacz fiszkę/i })
    const count = await checkboxes.count()
    
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check()
    }

    // Click bulk accept button
    await page.getByRole('button', { name: /akceptuj zaznaczone/i }).click()

    // Fill bulk accept dialog
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel(/nowy zestaw/i).check()
    await dialog.getByLabel(/nazwa zestawu/i).fill('JavaScript Fundamentals')
    await dialog.getByRole('button', { name: /akceptuj wszystkie/i }).click()

    // Should show success message
    await expect(page.getByText(/zaakceptowano.*fiszki/i)).toBeVisible()

    // Pending list should be empty
    await expect(page.getByText(/brak oczekujących fiszek/i)).toBeVisible()
  })

  test('should bulk delete pending flashcards', async ({ page, authenticatedUser }) => {
    // Generate flashcards
    await page.goto('/generate')
    const sourceText = 'CSS is a styling language. '.repeat(50)
    await page.getByLabel(/tekst źródłowy/i).fill(sourceText)
    await page.getByRole('button', { name: /generuj/i }).click()

    await expect(page).toHaveURL(/\/pending/, { timeout: 15000 })

    // Count initial cards
    const initialCount = await page.getByTestId('pending-flashcard-card').count()
    expect(initialCount).toBeGreaterThan(0)

    // Select all
    const selectAllCheckbox = page.getByRole('checkbox', { name: /zaznacz wszystkie/i })
    await selectAllCheckbox.check()

    // Click delete button
    await page.getByRole('button', { name: /usuń zaznaczone/i }).click()

    // Confirm deletion in dialog
    const confirmDialog = page.getByRole('dialog')
    await confirmDialog.getByRole('button', { name: /usuń/i }).click()

    // Should show success message
    await expect(page.getByText(/usunięto.*fiszki/i)).toBeVisible()

    // List should be empty
    await expect(page.getByText(/brak oczekujących fiszek/i)).toBeVisible()
  })
})
```

---

### 6.9. Test E2E - Quota Limits

```typescript
// tests/e2e/generation-quota.spec.ts
import { test, expect } from '@playwright/test'
import { authenticatedUserFixture } from './fixtures/authenticated-user'

test.describe('Generation Quota Limits', () => {
  test.use(authenticatedUserFixture)

  test('should enforce daily generation limit', async ({ page }) => {
    const sourceText = 'Test content for generation. '.repeat(50)

    // Generate 10 times (the daily limit)
    for (let i = 0; i < 10; i++) {
      await page.goto('/generate')
      
      await page.getByLabel(/tekst źródłowy/i).fill(sourceText)
      await page.getByRole('button', { name: /generuj/i }).click()

      // Wait for redirect
      await expect(page).toHaveURL(/\/pending/, { timeout: 15000 })

      // Verify quota decreases
      await page.goto('/generate')
      const remaining = 10 - (i + 1)
      if (remaining > 0) {
        await expect(page.getByText(new RegExp(`pozostało.*${remaining}`, 'i'))).toBeVisible()
      }
    }

    // 11th attempt should be blocked
    await page.goto('/generate')
    await expect(page.getByText(/wykorzystano dzienny limit/i)).toBeVisible()
    
    const generateButton = page.getByRole('button', { name: /generuj/i })
    await expect(generateButton).toBeDisabled()

    // Try to generate anyway (button should be disabled)
    await page.getByLabel(/tekst źródłowy/i).fill(sourceText)
    await expect(generateButton).toBeDisabled()

    // Should show reset time
    await expect(page.getByText(/limit zostanie odnowiony/i)).toBeVisible()
  })

  test('should show correct quota after page reload', async ({ page }) => {
    // Generate once
    await page.goto('/generate')
    const sourceText = 'Test content. '.repeat(50)
    await page.getByLabel(/tekst źródłowy/i).fill(sourceText)
    await page.getByRole('button', { name: /generuj/i }).click()

    await expect(page).toHaveURL(/\/pending/, { timeout: 15000 })

    // Reload page
    await page.reload()

    // Navigate back to generate
    await page.goto('/generate')

    // Quota should be 9
    await expect(page.getByText(/pozostało.*9/i)).toBeVisible()
  })
})
```

---

## 7. Konfiguracja CI/CD

### 7.1. GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Check formatting
        run: npm run format -- --check

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
        env:
          OPENROUTER_API_KEY: ${{ secrets.TEST_OPENROUTER_API_KEY }}
          OPENROUTER_MODEL: test-model
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
          flags: unit

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: supabase/postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Start Supabase local
        run: supabase start
      
      - name: Run database migrations
        run: supabase db push
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          OPENROUTER_API_KEY: ${{ secrets.TEST_OPENROUTER_API_KEY }}
          OPENROUTER_MODEL: test-model
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
          flags: integration

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Build application
        run: npm run build
        env:
          SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          OPENROUTER_API_KEY: ${{ secrets.TEST_OPENROUTER_API_KEY }}
          OPENROUTER_MODEL: test-model
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:4321
          SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
      
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  coverage-report:
    name: Coverage Report
    needs: [unit-tests, integration-tests]
    runs-on: ubuntu-latest
    steps:
      - name: Download coverage reports
        uses: actions/download-artifact@v4
      
      - name: Generate combined report
        run: |
          npx nyc merge coverage coverage/coverage-final.json
          npx nyc report --reporter=html --reporter=lcov
      
      - name: Comment PR with coverage
        if: github.event_name == 'pull_request'
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

---

### 7.2. Pre-commit Hooks (Husky + lint-staged)

```json
// package.json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:watch": "vitest watch",
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx,astro}": [
      "eslint --fix",
      "vitest related --run"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

```bash
# .husky/pre-push
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run test
```

---

## 8. Metryki i Pokrycie Kodu

### 8.1. Cele Pokrycia (Coverage Goals)

**Ogólne cele:**

- **Statements**: ≥ 80%
- **Branches**: ≥ 75%
- **Functions**: ≥ 80%
- **Lines**: ≥ 80%

**Priorytety pokrycia według modułów:**

| Moduł | Target Coverage | Priorytet |
|-------|----------------|-----------|
| Services (AI, OpenRouter) | ≥ 90% | Krytyczny |
| API Endpoints | ≥ 85% | Krytyczny |
| Schematy walidacji | 100% | Krytyczny |
| Middleware | ≥ 90% | Wysoki |
| React Hooks | ≥ 85% | Wysoki |
| React Components | ≥ 75% | Średni |
| Utility Functions | ≥ 85% | Średni |

**Wyłączenia z pokrycia:**

- Pliki konfiguracyjne (`*.config.ts`)
- Definicje typów (`types.ts`, `*.types.ts`)
- Pliki testowe (`*.test.ts`, `*.spec.ts`)
- Mock data i fixtures

---

### 8.2. Konfiguracja Vitest Coverage

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.ts',
        '**/*.types.ts',
        '**/types.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        'dist/',
        '.astro/'
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      },
      // Per-file thresholds for critical modules
      perFile: true,
      watermarks: {
        statements: [70, 90],
        functions: [70, 90],
        branches: [65, 85],
        lines: [70, 90]
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
```

---

### 8.3. Monitoring i Raportowanie

**Narzędzia:**

- **Codecov** - wizualizacja pokrycia kodu w PR
- **SonarQube** (opcjonalnie) - analiza jakości kodu
- **GitHub Actions** - automatyczne sprawdzanie progów

**Raporty:**

- HTML coverage report generowany lokalnie
- LCOV report dla Codecov
- JSON report dla dalszej analizy
- Text summary w konsoli

**Dashboard metryk:**

- Trend pokrycia w czasie
- Pokrycie per moduł
- Niepokryte linie w critical paths
- Statystyki testów (czas wykonania, flaky tests)

---

## 9. Strategia Testowania dla Przyszłych Funkcji

### 9.1. Spaced Repetition System

Gdy zostanie zaimplementowany system powtórek, należy dodać:

**Testy jednostkowe:**

- Algorytm obliczania następnej daty powtórki (SM-2 lub podobny)
- Aktualizacja ease factor na podstawie quality rating
- Obliczanie interwału między powtórkami

**Testy integracyjne:**

- POST `/api/v1/flashcards/:id/reviews` - rejestracja powtórki
- GET `/api/v1/sets/:id/due-cards` - pobranie fiszek do powtórki
- Transakcje bazodanowe dla review state

**Testy E2E:**

- Rozpoczęcie sesji nauki
- Ocena fiszek (quality ratings 0-5)
- Weryfikacja poprawnego harmonogramu następnych powtórek

---

### 9.2. Automatyczna Kategoryzacja Zestawów

**Testy jednostkowe:**

- Funkcja concatenacji fiszek z zestawu (max 2000 znaków)
- Parser odpowiedzi AI z kategorią

**Testy integracyjne:**

- Trigger kategoryzacji po akceptacji 5. fiszki
- Async job processing (jeśli implementowane)
- Aktualizacja `sets.category`

**Testy E2E:**

- Weryfikacja automatycznego przypisania kategorii
- Filtrowanie zestawów po kategorii na dashboard

---

## 10. Best Practices i Wytyczne

### 10.1. Zasady Pisania Testów

1. **AAA Pattern (Arrange-Act-Assert)**

   ```typescript
   it('should do something', () => {
     // Arrange: Setup test data
     const input = 'test'
     
     // Act: Execute function
     const result = someFunction(input)
     
     // Assert: Verify result
     expect(result).toBe('expected')
   })
   ```

2. **Jeden koncept per test**
   - Każdy test weryfikuje jedno zachowanie
   - Unikaj testowania wielu rzeczy w jednym teście

3. **Opisowe nazwy testów**

   ```typescript
   // ✅ Good
   it('should return 401 when user is not authenticated')
   
   // ❌ Bad
   it('test auth')
   ```

4. **Izolacja testów**
   - Każdy test działa niezależnie
   - Cleanup po każdym teście
   - Brak współdzielonego stanu między testami

5. **Mock tylko zewnętrzne zależności**
   - Mock: API zewnętrzne (OpenRouter, zewnętrzne HTTP)
   - Nie mockuj: własna logika biznesowa

---

### 10.2. Testowanie Komponentów React

**Prefer Testing Library queries:**

```typescript
// ✅ Good: Testuj jak użytkownik
screen.getByRole('button', { name: /zaloguj/i })
screen.getByLabelText(/email/i)

// ❌ Bad: Testuj implementację
screen.getByTestId('login-button')
screen.getByClassName('email-input')
```

**Testuj zachowanie, nie implementację:**

```typescript
// ✅ Good
it('should show error message when login fails', async () => {
  // Setup mock
  global.fetch = vi.fn().mockRejectedValue(new Error('Invalid credentials'))
  
  // User action
  await user.click(screen.getByRole('button', { name: /zaloguj/i }))
  
  // Verify result
  expect(screen.getByText(/nieprawidłowe dane/i)).toBeVisible()
})

// ❌ Bad
it('should call handleLogin function', () => {
  expect(mockHandleLogin).toHaveBeenCalled()
})
```

---

### 10.3. Testowanie API Endpoints

**Zawsze testuj:**

1. Happy path (200/201)
2. Authentication (401)
3. Validation errors (400)
4. Not found (404)
5. Server errors (500)

**Przykład kompletnego testu endpointu:**

```typescript
describe('POST /api/v1/sets', () => {
  it('should create set successfully', async () => { /* ... */ })
  it('should return 401 when not authenticated', async () => { /* ... */ })
  it('should return 400 for invalid name', async () => { /* ... */ })
  it('should return 400 for duplicate set name', async () => { /* ... */ })
  it('should save set to database', async () => { /* ... */ })
})
```

---

### 10.4. Performance Testing Guidelines

**Load Test Scenarios:**

- Baseline: 10 RPS (requests per second)
- Normal load: 50 RPS
- Peak load: 100 RPS
- Stress test: 200+ RPS

**Acceptance Criteria:**

- p95 response time < 200ms (normal load)
- p99 response time < 500ms (normal load)
- Error rate < 0.1% (normal load)
- No memory leaks during 1h stress test

---

## 11. Narzędzia Developerskie

### 11.1. VS Code Extensions

Rekomendowane rozszerzenia dla testowania:

- **Vitest** - uruchamianie testów z poziomu edytora
- **Playwright Test for VSCode** - debugowanie testów E2E
- **Coverage Gutters** - wizualizacja pokrycia w edytorze
- **Error Lens** - inline wyświetlanie błędów testów

### 11.2. Komendy NPM Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:unit": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:performance": "k6 run tests/performance/k6/generate-load.js"
  }
}
```

---

## 12. Harmonogram Implementacji

### Faza 1: Fundament (Tydzień 1-2)

- [ ] Konfiguracja Vitest
- [ ] Setup @testing-library/react
- [ ] Konfiguracja Playwright
- [ ] Test helpers i utilities
- [ ] Pierwsze testy jednostkowe dla serwisów
- [ ] CI/CD pipeline (podstawowy)

### Faza 2: Core Functionality (Tydzień 3-4)

- [ ] Testy dla AI generation service
- [ ] Testy dla OpenRouter service
- [ ] Testy API endpoints (auth, generate)
- [ ] Testy middleware
- [ ] Testy integracyjne z Supabase
- [ ] Coverage monitoring

### Faza 3: Frontend (Tydzień 5-6)

- [ ] Testy React hooks
- [ ] Testy formularzy (Auth, Generate)
- [ ] Testy komponentów UI
- [ ] Pierwsze testy E2E (auth flow)
- [ ] E2E testy dla generate flow

### Faza 4: Rozszerzenie (Tydzień 7-8)

- [ ] Testy dla pending flashcards
- [ ] Testy dla sets management
- [ ] Testy dla quota limits
- [ ] Testy wydajnościowe (k6)
- [ ] Testy bezpieczeństwa
- [ ] Testy dostępności

### Faza 5: Optymalizacja (Tydzień 9-10)

- [ ] Refaktoring testów
- [ ] Poprawa coverage do 80%+
- [ ] Dokumentacja testów
- [ ] Performance benchmarks
- [ ] Test utilities refactoring

---

## 13. Zasoby i Dokumentacja

### Dokumentacja Frameworków

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW (Mock Service Worker)](https://mswjs.io/)

### Best Practices

- [Testing Best Practices (Kent C. Dodds)](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

### Kursy i Tutoriale

- [Epic React - Testing](https://epicreact.dev/modules/testing)
- [Test Automation University](https://testautomationu.applitools.com/)

---

## 14. FAQ i Rozwiązywanie Problemów

### Q: Kiedy używać testów jednostkowych vs integracyjnych?

**A:** Testy jednostkowe dla izolowanej logiki (obliczenia, transformacje, walidacje). Testy integracyjne dla przepływów między warstwami (API + DB, middleware + auth).

### Q: Czy testować komponenty UI z Shadcn?

**A:** Nie testować komponentów z biblioteki. Testować tylko własne komponenty, które używają Shadcn jako building blocks.

### Q: Jak testować kod z Supabase?

**A:** W testach jednostkowych - mockować klienta Supabase. W testach integracyjnych - używać prawdziwej bazy testowej (Supabase local).

### Q: Jak długo powinny trwać testy E2E?

**A:** Całość < 5 minut. Pojedynczy test < 30 sekund. Używać parallel execution w Playwright.

### Q: Co zrobić z flaky tests?

**A:**

1. Dodać explicit waits (waitFor, expect.poll)
2. Unikać hard-coded timeouts
3. Używać Playwright auto-waiting
4. Izolować test data (unique IDs)

---

## 15. Podsumowanie

Ten plan testów zapewnia kompleksowe pokrycie aplikacji 10xCards na wszystkich poziomach:

✅ **Testy jednostkowe** - szybka weryfikacja logiki biznesowej
✅ **Testy integracyjne** - pewność współpracy komponentów
✅ **Testy E2E** - walidacja kluczowych przepływów użytkownika
✅ **Testy wydajnościowe** - stabilność pod obciążeniem
✅ **CI/CD integration** - automatyczna weryfikacja każdej zmiany
✅ **Coverage monitoring** - utrzymanie wysokiej jakości kodu

**Kluczowe priorytety:**

1. Pokrycie krytycznych ścieżek (auth, generation, quota)
2. Automatyzacja w CI/CD
3. Szybkie feedback loop (< 5 min dla wszystkich testów)
4. Dokumentacja przez testy (testy jako specyfikacja)

**Metryki sukcesu:**

- Coverage > 80%
- Wszystkie testy przechodzą w CI
- Czas wykonania testów < 5 minut
- Zero flaky tests w ciągu miesiąca
