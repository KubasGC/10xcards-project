# API Endpoint Implementation Plan: POST /api/v1/flashcards/generate

## 1. Przegląd punktu końcowego

Endpoint generuje kandydatów fiszek z tekstu źródłowego dostarczonego przez użytkownika za pomocą modelu AI (dostępnego przez OpenRouter.ai). Wygenerowane kandydaty są zapisywane jako oczekujące fiszki w tabeli `pending_flashcards` i zwracane użytkownikowi do akceptacji lub odrzucenia. Endpoint egzekwuje dzienny limit 50 generacji na użytkownika i rejestruje metadane użycia AI w celach analitycznych.

**Główne funkcjonalności:**
- Walidacja długości tekstu źródłowego (1000-20000 znaków)
- Sprawdzanie dziennego limitu generacji AI (50/dzień)
- Generowanie fiszek przez OpenRouter API
- Zapis kandydatów do bazy danych
- Rejestracja analityki wykorzystania AI
- Zachowanie prywatności - tekst źródłowy nie jest zapisywany

## 2. Szczegóły żądania

**Metoda HTTP:** POST

**Struktura URL:** `/api/v1/flashcards/generate`

**Parametry:**
- Wymagane: Brak (wszystkie parametry w request body)
- Opcjonalne: Brak

**Request Body:**
```typescript
{
  source_text: string;  // 1000-20000 znaków
  hint?: string;        // max 500 znaków (opcjonalnie)
}
```

**Headers:**
- `Content-Type: application/json`
- Cookies z sesją Supabase (automatyczne przez middleware)

**Przykład request body:**
```json
{
  "source_text": "Closures are an important concept in JavaScript. A closure is created when a function is defined inside another function, allowing the inner function to access variables from the outer function's scope even after the outer function has returned.",
  "hint": "Focus on the definition and key characteristics"
}
```

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

**Request:**
- `GenerateFlashcardsCommand` (src/types.ts:221-224)
  ```typescript
  interface GenerateFlashcardsCommand {
    source_text: string;
    hint?: string;
  }
  ```

**Response:**
- `GenerateFlashcardsResponseDTO` (src/types.ts:240-245)
  ```typescript
  interface GenerateFlashcardsResponseDTO {
    generation_id: string;
    candidates: PendingFlashcardDTO[];
    metadata: GenerationMetadataDTO;
    quota_remaining: number;
  }
  ```

- `PendingFlashcardDTO` (src/types.ts:142-145)
  ```typescript
  type PendingFlashcardDTO = Pick<
    PendingFlashcardEntity,
    "id" | "front_draft" | "back_draft" | "created_at" | "updated_at"
  >;
  ```

- `GenerationMetadataDTO` (src/types.ts:230-234)
  ```typescript
  interface GenerationMetadataDTO {
    model: string;
    generation_time_ms: number;
    tokens_used: number;
  }
  ```

**Error Response:**
- `ErrorResponseDTO` (src/types.ts:342-349)
  ```typescript
  interface ErrorResponseDTO {
    error: {
      id: string;
      code: ErrorCode;
      message: string;
      details?: ErrorDetailDTO[];
    };
  }
  ```

### Database Insert Types

- `PendingFlashcardInsert` (src/types.ts:437-438)
- `AIGenerationAnalyticsInsert` (src/types.ts:441-443)

## 4. Szczegóły odpowiedzi

### Success Response (201 Created)

```json
{
  "generation_id": "550e8400-e29b-41d4-a716-446655440000",
  "candidates": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "front_draft": "What is a closure in JavaScript?",
      "back_draft": "A closure is created when a function is defined inside another function, allowing the inner function to access variables from the outer function's scope even after the outer function has returned.",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "front_draft": "When is a closure created in JavaScript?",
      "back_draft": "A closure is created when a function is defined inside another function.",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "metadata": {
    "model": "openai/gpt-4-turbo",
    "generation_time_ms": 2500,
    "tokens_used": 450
  },
  "quota_remaining": 26
}
```

### Error Responses

**400 Bad Request - Validation Error:**
```json
{
  "error": {
    "id": "uuid",
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "source_text",
        "message": "Source text must be between 1000 and 20,000 characters"
      }
    ]
  }
}
```

**401 Unauthorized:**
```json
{
  "error": {
    "id": "uuid",
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**429 Too Many Requests - Generation Limit Exceeded:**
```json
{
  "error": {
    "id": "uuid",
    "code": "GENERATION_LIMIT_EXCEEDED",
    "message": "Daily generation limit of 50 has been reached",
    "details": {
      "daily_limit": 50,
      "used_today": 50,
      "resets_at": "2025-01-16T00:00:00Z"
    }
  }
}
```

**500 Internal Server Error - AI Service Error:**
```json
{
  "error": {
    "id": "uuid",
    "code": "AI_SERVICE_ERROR",
    "message": "Failed to generate flashcards. Please try again."
  }
}
```

**503 Service Unavailable - AI Service Unavailable:**
```json
{
  "error": {
    "id": "uuid",
    "code": "AI_SERVICE_UNAVAILABLE",
    "message": "AI service is temporarily unavailable. Please try again later."
  }
}
```

## 5. Przepływ danych

### Diagram przepływu

```
1. Client Request
   ↓
2. Astro Middleware (Authentication)
   ↓
3. API Route Handler (/api/v1/flashcards/generate.ts)
   ↓
4. Request Body Validation (Zod)
   ↓
5. Check Daily Quota (ai-generation.service.ts)
   ↓ [if quota available]
6. Generate Flashcards (openrouter.service.ts)
   ↓
7. Parse AI Response
   ↓
8. Save Pending Flashcards (Supabase batch insert)
   ↓
9. Record Analytics (ai_generation_analytics)
   ↓
10. Return Response (201 Created)
```

### Szczegółowy opis przepływu

**Krok 1-2: Autentykacja**
- Request trafia do Astro middleware
- Middleware weryfikuje sesję Supabase z cookies
- Użytkownik jest identyfikowany przez `context.locals.user`
- Jeśli brak sesji → 401 Unauthorized

**Krok 3: Routing**
- Request trafia do handlera `src/pages/api/v1/flashcards/generate.ts`
- Handler eksportuje funkcję `POST`
- Ustawia `export const prerender = false`

**Krok 4: Walidacja**
- Parse request body jako JSON
- Walidacja przez Zod schema:
  - `source_text`: min 1000, max 20000 znaków
  - `hint`: max 500 znaków (opcjonalnie)
- Jeśli walidacja niepoprawna → 400 Bad Request z details

**Krok 5: Sprawdzenie limitu**
- Wywołanie `checkDailyQuota(userId)` z serwisu
- Query do `ai_generation_analytics`:
  ```sql
  SELECT COUNT(*) 
  FROM ai_generation_analytics 
  WHERE user_id = $1 
    AND created_at >= current_date
  ```
- Jeśli count >= 50 → 429 Too Many Requests
- Kalkulacja `resets_at` (następna północ UTC)

**Krok 6: Generowanie przez AI**
- Wywołanie `openrouter.service.generateFlashcards(sourceText, hint)`
- Formatowanie promptu dla AI:
  - System prompt: instrukcje dla modelu
  - User prompt: source_text + hint (jeśli podany)
- HTTP POST do OpenRouter API
- Timeout: 30 sekund
- Jeśli błąd połączenia → 503 Service Unavailable
- Jeśli błąd API → 500 AI Service Error

**Krok 7: Parsowanie odpowiedzi**
- Walidacja struktury odpowiedzi AI
- Ekstrakcja:
  - Lista kandydatów (front/back pairs)
  - Metadata (model, tokens, duration)
- Walidacja długości front (1-200) i back (1-600)
- Jeśli nieprawidłowa struktura → 500 AI Service Error

**Krok 8: Zapis kandydatów**
- Generacja UUID dla generation_id
- Przygotowanie batch insert:
  ```typescript
  const inserts: PendingFlashcardInsert[] = candidates.map(c => ({
    user_id: userId,
    front_draft: c.front,
    back_draft: c.back
  }));
  ```
- Supabase batch insert do `pending_flashcards`
- RLS automatycznie zapewnia user_id
- Jeśli błąd DB → 500 Internal Error

**Krok 9: Zapis analityki**
- Insert do `ai_generation_analytics`:
  ```typescript
  {
    user_id: userId,
    model: metadata.model,
    provider: "openrouter",
    input_tokens: metadata.input_tokens,
    output_tokens: metadata.output_tokens,
    duration_ms: metadata.generation_time_ms,
    cost_usd: calculateCost(metadata)
  }
  ```
- Błędy analityki nie blokują response (log warning)

**Krok 10: Response**
- Zwrot 201 Created z:
  - generation_id
  - candidates (PendingFlashcardDTO[])
  - metadata
  - quota_remaining (49 - used_today)

### Interakcje z bazą danych

**Tabele zaangażowane:**
1. `pending_flashcards` - zapis kandydatów
2. `ai_generation_analytics` - zapis metadanych
3. Query do analytics dla sprawdzenia limitu

**RLS (Row Level Security):**
- Automatyczne filtrowanie przez `user_id = auth.uid()`
- Zapewnia izolację danych między użytkownikami

### Interakcje z zewnętrznymi serwisami

**OpenRouter API:**
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Authentication: Bearer token (env: `OPENROUTER_API_KEY`)
- Model: Konfigurowalny (domyślnie `openai/gpt-4-turbo`)
- Request format: OpenAI-compatible
- Response format: Structured JSON z fiszkami

## 6. Względy bezpieczeństwa

### Autentykacja i autoryzacja

**Cookie-based Authentication:**
- Sesja Supabase przechowywana w secure HTTP-only cookies
- Middleware automatycznie waliduje sesję
- User ID ekstrahowany z `context.locals.user`
- Brak potrzeby manualnego handleru JWT

**Row Level Security (RLS):**
- Postgres RLS enforce na wszystkich tabelach
- Policy: `user_id = auth.uid()`
- Automatyczne filtrowanie i izolacja danych
- Zabezpieczenie przed unauthorized access

### Walidacja danych

**Zod Schema Validation:**
```typescript
import { z } from 'zod';

const GenerateFlashcardsSchema = z.object({
  source_text: z.string()
    .min(1000, "Source text must be at least 1000 characters")
    .max(20000, "Source text must not exceed 20,000 characters")
    .refine(text => text.trim().length > 0, "Source text cannot be only whitespace"),
  hint: z.string()
    .max(500, "Hint must not exceed 500 characters")
    .optional()
});
```

**Database constraints:**
- CHECK constraints w Postgres dla długości pól
- NOT NULL constraints gdzie wymagane
- Foreign key integrity dla user_id

### Prywatność danych (GDPR/Privacy)

**KRYTYCZNE: Source text nie może być zapisywany**
- ❌ NIE zapisywać `source_text` w bazie danych
- ❌ NIE logować `source_text` w application logs
- ❌ NIE przesyłać `source_text` do analytics
- ✅ Tylko wygenerowane kandydaty są przechowywane
- ✅ Kandydaty mogą być trwale usunięte przez użytkownika

**Implementacja:**
```typescript
// ❌ NIGDY nie rób tego:
console.log('Generating from:', sourceText);
await db.insert({ source_text: sourceText });

// ✅ Poprawne:
console.log('Generating flashcards for user:', userId);
await db.insert(candidates); // tylko wygenerowane drafty
```

**Analytics:**
- Tylko metadata: model, tokens, duration, cost
- Brak przechowywania treści (prompts/outputs)
- Anonimizowane dane techniczne

### Rate Limiting

**Daily Generation Limit:**
- 50 generacji na użytkownika na dzień
- Sprawdzanie przed wywołaniem AI API
- Reset o północy UTC
- Response z `quota_remaining`

**Implementacja sprawdzania:**
```typescript
const usedToday = await checkDailyQuota(userId);
if (usedToday >= 50) {
  const resetsAt = getNextMidnightUTC();
  return error429({
    code: 'GENERATION_LIMIT_EXCEEDED',
    message: 'Daily generation limit of 50 has been reached',
    details: { daily_limit: 50, used_today: usedToday, resets_at: resetsAt }
  });
}
```

### API Key Protection

**OpenRouter API Key:**
- Przechowywanie w zmiennych środowiskowych
- `OPENROUTER_API_KEY` w `.env`
- Nigdy nie eksponować w response
- Nigdy nie logować klucza
- Walidacja obecności przy starcie aplikacji

**Implementacja:**
```typescript
const apiKey = import.meta.env.OPENROUTER_API_KEY;
if (!apiKey) {
  throw new Error('OPENROUTER_API_KEY is not configured');
}
// Użycie w headers, nigdy w response
```

### Cost Control

**Financial Safeguards:**
- Daily limit per user (50 generacji)
- OpenRouter limits można ustawić w dashboard
- Monitoring kosztów w `ai_generation_analytics`
- Alert system dla przekroczenia budżetu (future)

### Input Sanitization

**Against Injection Attacks:**
- Zod walidacja zapobiega unexpected input
- Parametryzowane queries (Supabase client)
- Escaping w AI promptach jeśli potrzebne
- Validation długości przed przekazaniem do AI

## 7. Obsługa błędów

### Kategorie błędów

#### 1. Błędy walidacji (400 Bad Request)

**Kod:** `VALIDATION_ERROR`

**Scenariusze:**
- `source_text` za krótki (<1000 znaków)
- `source_text` za długi (>20000 znaków)
- `source_text` składa się tylko z whitespace
- `hint` za długi (>500 znaków)
- Nieprawidłowy format JSON w request body
- Brakujące pole `source_text`

**Implementacja:**
```typescript
try {
  const validated = GenerateFlashcardsSchema.parse(requestBody);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(JSON.stringify({
      error: {
        id: crypto.randomUUID(),
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }
    }), { status: 400 });
  }
}
```

#### 2. Błędy autentykacji (401 Unauthorized)

**Kod:** `UNAUTHORIZED`

**Scenariusze:**
- Brak sesji Supabase w cookies
- Wygasła sesja
- Nieprawidłowa/uszkodzona sesja

**Implementacja:**
```typescript
const user = context.locals.user;
if (!user) {
  return new Response(JSON.stringify({
    error: {
      id: crypto.randomUUID(),
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    }
  }), { status: 401 });
}
```

**Uwaga:** Obsługiwane przez middleware, endpoint zakłada user jest już zwalidowany

#### 3. Błędy rate limiting (429 Too Many Requests)

**Kod:** `GENERATION_LIMIT_EXCEEDED`

**Scenariusze:**
- Użytkownik przekroczył dzienny limit 50 generacji
- Próba kolejnej generacji po wyczerpaniu limitu

**Implementacja:**
```typescript
const usedToday = await aiGenerationService.checkDailyQuota(user.id);
const dailyLimit = 50;

if (usedToday >= dailyLimit) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  return new Response(JSON.stringify({
    error: {
      id: crypto.randomUUID(),
      code: 'GENERATION_LIMIT_EXCEEDED',
      message: `Daily generation limit of ${dailyLimit} has been reached`,
      details: {
        daily_limit: dailyLimit,
        used_today: usedToday,
        resets_at: tomorrow.toISOString()
      }
    }
  }), { status: 429 });
}
```

#### 4. Błędy AI Service (500 Internal Server Error)

**Kod:** `AI_SERVICE_ERROR`

**Scenariusze:**
- Błąd podczas parsowania odpowiedzi AI
- AI zwróciło nieprawidłową strukturę
- AI zwróciło fiszki z nieprawidłową długością
- Błąd podczas zapisu do bazy danych
- Nieoczekiwany błąd aplikacji

**Implementacja:**
```typescript
try {
  const aiResponse = await openrouterService.generateFlashcards(
    validated.source_text,
    validated.hint
  );
  
  // Walidacja struktury odpowiedzi
  if (!aiResponse.candidates || aiResponse.candidates.length === 0) {
    throw new Error('AI returned no candidates');
  }
  
  // Zapis do DB
  await aiGenerationService.savePendingFlashcards(user.id, aiResponse.candidates);
  
} catch (error) {
  console.error('AI service error:', error, { errorId: errorId });
  
  return new Response(JSON.stringify({
    error: {
      id: errorId,
      code: 'AI_SERVICE_ERROR',
      message: 'Failed to generate flashcards. Please try again.'
    }
  }), { status: 500 });
}
```

**Uwaga:** Nie ujawniać szczegółów błędu wewnętrznego w response (security)

#### 5. Błędy dostępności AI (503 Service Unavailable)

**Kod:** `AI_SERVICE_UNAVAILABLE`

**Scenariusze:**
- OpenRouter API niedostępne (network error)
- Timeout połączenia (>30s)
- OpenRouter zwraca 503
- Rate limit OpenRouter (rzadkie, ale możliwe)

**Implementacja:**
```typescript
try {
  const aiResponse = await openrouterService.generateFlashcards(
    validated.source_text,
    validated.hint,
    { timeout: 30000 } // 30 sekund
  );
} catch (error) {
  if (error instanceof NetworkError || error instanceof TimeoutError) {
    console.error('AI service unavailable:', error, { errorId: errorId });
    
    return new Response(JSON.stringify({
      error: {
        id: errorId,
        code: 'AI_SERVICE_UNAVAILABLE',
        message: 'AI service is temporarily unavailable. Please try again later.'
      }
    }), { status: 503 });
  }
  throw error; // Inne błędy jako 500
}
```

### Error Logging Strategy

**Co logować:**
- UUID błędu (dla korelacji z klientem)
- User ID (dla debugowania)
- Typ błędu i stack trace
- Timestamp
- Request metadata (bez wrażliwych danych)

**Czego NIE logować:**
- `source_text` (prywatność)
- API keys
- Session tokens
- Pełny request body (może zawierać wrażliwe dane)

**Implementacja:**
```typescript
const errorId = crypto.randomUUID();
console.error('Error during flashcard generation', {
  errorId,
  userId: user.id,
  errorType: error.constructor.name,
  errorMessage: error.message,
  // NIE logować source_text!
});
```

### Centralized Error Handler (Helper)

**Lokalizacja:** `src/lib/helpers/api-error.helper.ts`

**Funkcje:**
```typescript
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  details?: any
): Response {
  const errorId = crypto.randomUUID();
  
  const body: ErrorResponseDTO = {
    error: {
      id: errorId,
      code,
      message,
      details
    }
  };
  
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export const error400 = (code: ErrorCode, message: string, details?: any) =>
  createErrorResponse(code, message, 400, details);

export const error401 = () =>
  createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);

export const error429 = (details: any) =>
  createErrorResponse('GENERATION_LIMIT_EXCEEDED', 
    `Daily generation limit of ${details.daily_limit} has been reached`, 429, details);

export const error500 = (message: string = 'Internal server error') =>
  createErrorResponse('AI_SERVICE_ERROR', message, 500);

export const error503 = () =>
  createErrorResponse('AI_SERVICE_UNAVAILABLE', 
    'AI service is temporarily unavailable. Please try again later.', 503);
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

#### 1. Latencja AI API
**Problem:**
- Wywołanie OpenRouter może trwać 2-5 sekund
- User czeka na response
- Timeout risk

**Mitigation:**
- Ustawienie timeout na 30 sekund
- Loading state w UI
- Opcjonalnie: async job queue (future enhancement)

#### 2. Database inserts
**Problem:**
- Batch insert wielu kandydatów (5-10 fiszek)
- Dwa inserty (pending_flashcards + analytics)

**Mitigation:**
- Używanie batch insert zamiast pojedynczych
- Supabase optymalizuje batch operations
- Indeksy na user_id

#### 3. Daily quota check
**Problem:**
- Query COUNT(*) przy każdym request
- Może być wolny dla użytkowników z dużą historią

**Mitigation:**
- Index na (user_id, created_at) w `ai_generation_analytics`
- Query filtrowany przez `created_at >= current_date`
- Opcjonalnie: cache w Redis (future)

#### 4. Concurrent requests
**Problem:**
- Race condition przy sprawdzaniu limitu
- Użytkownik może wysłać 2 requesty jednocześnie

**Mitigation:**
- Database transaction dla quota check + increment
- Opcjonalnie: distributed lock (future)

### Strategie optymalizacji

#### Database Query Optimization

**Index dla quota check:**
```sql
CREATE INDEX idx_ai_gen_analytics_user_created 
ON ai_generation_analytics(user_id, created_at DESC);
```

**Optimized quota query:**
```typescript
// Efektywne query z WHERE na indexed kolumnach
const { count } = await supabase
  .from('ai_generation_analytics')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .gte('created_at', getTodayMidnightUTC());
```

#### Batch Operations

**Pending flashcards insert:**
```typescript
// Batch insert zamiast loop
const { data, error } = await supabase
  .from('pending_flashcards')
  .insert(candidates) // array insert
  .select();
```

#### Response Streaming (Future Enhancement)

**Dla dużych odpowiedzi:**
- Rozważyć streaming response z AI
- Progressive loading w UI
- Server-Sent Events (SSE) dla real-time updates

#### Caching Strategy (Future)

**Cache daily quota:**
- Redis cache z TTL do końca dnia
- Invalidation po każdej generacji
- Reduce database load

**Implementation example (future):**
```typescript
const cacheKey = `quota:${userId}:${getTodayDate()}`;
let usedToday = await redis.get(cacheKey);

if (usedToday === null) {
  usedToday = await queryDatabase();
  await redis.set(cacheKey, usedToday, { expiresAt: getEndOfDay() });
}
```

### Monitoring Recommendations

**Metryki do monitorowania:**
- Średni czas response
- AI API latency (p50, p95, p99)
- Success rate generacji
- Quota hit rate (ile requestów blokowanych przez limit)
- Database query performance
- Cost per generation

**Tooling:**
- Application logs (console.log z timestampami)
- Opcjonalnie: APM tool (Sentry, DataDog)
- Database performance insights (Supabase dashboard)

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie środowiska

**1.1. Zmienne środowiskowe**
- [ ] Dodać `OPENROUTER_API_KEY` do `.env`
- [ ] Dodać `OPENROUTER_MODEL` do `.env` (domyślnie: `openai/gpt-4-turbo`)
- [ ] Walidować obecność zmiennych przy starcie aplikacji

**1.2. Zależności npm**
- [ ] Sprawdzić czy `zod` jest w dependencies
- [ ] Sprawdzić czy `@supabase/supabase-js` jest zainstalowany

### Krok 2: Implementacja serwisu OpenRouter

**Lokalizacja:** `src/lib/services/openrouter.service.ts`

**Funkcjonalności:**
- [ ] `generateFlashcards(sourceText: string, hint?: string)` - główna funkcja
- [ ] Formatowanie promptu systemowego (instrukcje dla AI)
- [ ] Formatowanie promptu użytkownika (source_text + hint)
- [ ] HTTP POST do OpenRouter API
- [ ] Obsługa timeout (30s)
- [ ] Parsowanie odpowiedzi JSON
- [ ] Walidacja struktury odpowiedzi
- [ ] Error handling (NetworkError, TimeoutError, ApiError)
- [ ] Ekstrakcja metadanych (model, tokens, duration)

**Struktura odpowiedzi AI (expected):**
```json
{
  "candidates": [
    { "front": "string", "back": "string" },
    ...
  ],
  "metadata": {
    "model": "string",
    "input_tokens": number,
    "output_tokens": number,
    "generation_time_ms": number
  }
}
```

### Krok 3: Implementacja serwisu AI Generation

**Lokalizacja:** `src/lib/services/ai-generation.service.ts`

**Funkcjonalności:**
- [ ] `checkDailyQuota(userId: string): Promise<number>` - zwraca liczbę użyć dzisiaj
- [ ] `savePendingFlashcards(userId: string, candidates: Candidate[]): Promise<PendingFlashcardDTO[]>`
- [ ] `recordAnalytics(userId: string, metadata: GenerationMetadata): Promise<void>`
- [ ] `calculateCost(tokens: number, model: string): number` - helper do kalkulacji kosztów

**Query quota:**
```typescript
const { count } = await supabase
  .from('ai_generation_analytics')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .gte('created_at', new Date().toISOString().split('T')[0]); // today's date
```

**Batch insert pending:**
```typescript
const inserts = candidates.map(c => ({
  user_id: userId,
  front_draft: c.front,
  back_draft: c.back
}));

const { data, error } = await supabase
  .from('pending_flashcards')
  .insert(inserts)
  .select();
```

### Krok 4: Implementacja API error helpers

**Lokalizacja:** `src/lib/helpers/api-error.helper.ts`

**Funkcjonalności:**
- [ ] `createErrorResponse(code, message, status, details?)` - generyczna funkcja
- [ ] `error400(code, message, details?)` - validation errors
- [ ] `error401()` - unauthorized
- [ ] `error429(details)` - rate limit exceeded
- [ ] `error500(message?)` - internal error
- [ ] `error503()` - service unavailable
- [ ] UUID generation dla każdego błędu
- [ ] Zgodność z `ErrorResponseDTO`

### Krok 5: Implementacja Zod validation schema

**Lokalizacja:** `src/lib/schemas/generate-flashcards.schema.ts`

**Schema:**
```typescript
import { z } from 'zod';

export const GenerateFlashcardsSchema = z.object({
  source_text: z.string()
    .min(1000, "Source text must be at least 1000 characters")
    .max(20000, "Source text must not exceed 20,000 characters")
    .refine(
      text => text.trim().length > 0,
      "Source text cannot be only whitespace"
    ),
  hint: z.string()
    .max(500, "Hint must not exceed 500 characters")
    .optional()
});

export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsSchema>;
```

### Krok 6: Implementacja API endpoint

**Lokalizacja:** `src/pages/api/v1/flashcards/generate.ts`

**Struktura pliku:**
```typescript
import type { APIRoute } from 'astro';
import { GenerateFlashcardsSchema } from '@/lib/schemas/generate-flashcards.schema';
import { openrouterService } from '@/lib/services/openrouter.service';
import { aiGenerationService } from '@/lib/services/ai-generation.service';
import { error400, error401, error429, error500, error503 } from '@/lib/helpers/api-error.helper';
import type { GenerateFlashcardsResponseDTO } from '@/types';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // Implementacja (patrz szczegóły poniżej)
};
```

**Implementacja POST handler:**

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Check authentication
  const user = locals.user;
  if (!user) {
    return error401();
  }

  // 2. Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch {
    return error400('VALIDATION_ERROR', 'Invalid JSON in request body');
  }

  const validation = GenerateFlashcardsSchema.safeParse(body);
  if (!validation.success) {
    return error400(
      'VALIDATION_ERROR',
      'Validation failed',
      validation.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    );
  }

  const { source_text, hint } = validation.data;

  // 3. Check daily quota
  try {
    const usedToday = await aiGenerationService.checkDailyQuota(user.id);
    const dailyLimit = 50;

    if (usedToday >= dailyLimit) {
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);

      return error429({
        daily_limit: dailyLimit,
        used_today: usedToday,
        resets_at: tomorrow.toISOString()
      });
    }

    // 4. Generate flashcards via AI
    const aiResponse = await openrouterService.generateFlashcards(
      source_text,
      hint
    );

    // 5. Save pending flashcards
    const pendingFlashcards = await aiGenerationService.savePendingFlashcards(
      user.id,
      aiResponse.candidates
    );

    // 6. Record analytics
    await aiGenerationService.recordAnalytics(user.id, aiResponse.metadata);

    // 7. Calculate remaining quota
    const quotaRemaining = dailyLimit - (usedToday + 1);

    // 8. Return success response
    const response: GenerateFlashcardsResponseDTO = {
      generation_id: crypto.randomUUID(),
      candidates: pendingFlashcards,
      metadata: {
        model: aiResponse.metadata.model,
        generation_time_ms: aiResponse.metadata.generation_time_ms,
        tokens_used: aiResponse.metadata.tokens_used
      },
      quota_remaining: quotaRemaining
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Network/timeout errors → 503
    if (error instanceof NetworkError || error instanceof TimeoutError) {
      console.error('AI service unavailable', { error, userId: user.id });
      return error503();
    }

    // All other errors → 500
    console.error('Error generating flashcards', { error, userId: user.id });
    return error500('Failed to generate flashcards. Please try again.');
  }
};
```

### Krok 7: Testowanie manualne

**7.1. Test walidacji:**
- [ ] Request bez `source_text` → 400 z details
- [ ] Request z `source_text` <1000 znaków → 400
- [ ] Request z `source_text` >20000 znaków → 400
- [ ] Request z `hint` >500 znaków → 400
- [ ] Request z nieprawidłowym JSON → 400

**7.2. Test autentykacji:**
- [ ] Request bez cookies sesji → 401
- [ ] Request z wygasłą sesją → 401

**7.3. Test happy path:**
- [ ] Request z prawidłowymi danymi → 201
- [ ] Sprawdzenie struktury response
- [ ] Sprawdzenie zapisu w `pending_flashcards`
- [ ] Sprawdzenie zapisu w `ai_generation_analytics`
- [ ] Sprawdzenie `quota_remaining`

**7.4. Test limitu:**
- [ ] Wykonanie 50 requestów → ostatni sukces
- [ ] Wykonanie 51. requestu → 429 z `resets_at`

**7.5. Test błędów AI:**
- [ ] Symulacja błędu OpenRouter → 500 lub 503
- [ ] Sprawdzenie czy source_text NIE jest logowany

### Krok 8: Dokumentacja

**8.1. Code comments:**
- [ ] JSDoc dla wszystkich publicznych funkcji
- [ ] Komentarze dla skomplikowanej logiki
- [ ] TODO comments dla future enhancements

**8.2. README updates (opcjonalne):**
- [ ] Dodanie sekcji o zmiennych środowiskowych
- [ ] Dodanie przykładów użycia API
- [ ] Dodanie informacji o limitach

### Krok 9: Finalizacja

**9.1. Linting:**
- [ ] Uruchomienie `npm run lint`
- [ ] Naprawa wszystkich błędów ESLint

**9.2. Type checking:**
- [ ] Uruchomienie `npm run type-check` (jeśli dostępne)
- [ ] Naprawa wszystkich błędów TypeScript

**9.3. Code review checklist:**
- [ ] Wszystkie typy z `src/types.ts` są używane prawidłowo
- [ ] Żadne wrażliwe dane nie są logowane
- [ ] Wszystkie błędy mają proper handling
- [ ] Response format zgodny ze specyfikacją
- [ ] Security best practices są przestrzegane

**9.4. Deployment readiness:**
- [ ] Zmienne środowiskowe są skonfigurowane w production
- [ ] Database migrations są applied (jeśli potrzebne)
- [ ] Monitoring/logging jest skonfigurowany

---

## Podsumowanie

Ten endpoint jest kluczowy dla funkcjonalności AI w aplikacji. Najważniejsze punkty do zapamiętania:

1. **Prywatność first**: Nigdy nie zapisywać `source_text`
2. **Rate limiting**: Egzekwować dzienny limit 50 generacji
3. **Error handling**: Proper HTTP status codes i informacyjne messages
4. **Security**: Walidacja input, RLS, API key protection
5. **Performance**: Batch operations, indexed queries, monitoring

Implementation estimate: **4-6 godzin** dla doświadczonego developera, włączając testowanie.

