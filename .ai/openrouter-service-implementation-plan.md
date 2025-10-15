# Przewodnik Implementacji Usługi OpenRouter

## 1. Opis usługi

`OpenRouterService` to klasa TypeScript, która enkapsuluje logikę komunikacji z API OpenRouter.ai. Jej głównym zadaniem jest wysyłanie promptów do modeli językowych (LLM) i otrzymywanie ustrukturyzowanych odpowiedzi w formacie JSON. Usługa ta będzie fundamentem dla funkcji opartych na AI w aplikacji, takich jak generowanie fiszek.

Usługa będzie odpowiedzialna za:

- Bezpieczne zarządzanie kluczem API.
- Konstruowanie poprawnych zapytań do API, włączając w to komunikaty systemowe, promptu użytkownika oraz dynamiczne schematy odpowiedzi.
- Obsługę komunikacji HTTP.
- Parsowanie i walidację odpowiedzi.
- Centralizację obsługi błędów.

## 2. Opis konstruktora

Konstruktor klasy `OpenRouterService` inicjalizuje usługę, konfigurując ją do komunikacji z API.

```typescript
interface OpenRouterServiceConfig {
  apiKey?: string;
  defaultModel?: string;
}

class OpenRouterService {
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly baseUrl = "https://openrouter.ai/api/v1";

  constructor(config: OpenRouterServiceConfig = {}) {
    // ... implementacja ...
  }
}
```

- **`config`**: Opcjonalny obiekt konfiguracyjny.
  - **`apiKey`**: Klucz API OpenRouter. Jeśli nie zostanie podany, usługa spróbuje pobrać go ze zmiennej środowiskowej `OPENROUTER_API_KEY`. Rzuci błędem, jeśli klucz nie będzie dostępny.
  - **`defaultModel`**: Opcjonalna nazwa domyślnego modelu do użycia (np. `"anthropic/claude-3.5-sonnet"`). Może zostać nadpisana w wywołaniach poszczególnych metod.

## 3. Publiczne metody i pola

### `generateStructuredResponse<T extends z.ZodTypeAny>(params: GenerateParams<T>): Promise<z.infer<T>>`

Główna metoda publiczna, która wysyła zapytanie do modelu i zwraca odpowiedź sparsowaną i zwalidowaną zgodnie z podanym schematem Zod.

- **`params`**: Obiekt z parametrami zapytania.
  - **`systemPrompt`**: `string` - Komunikat systemowy ustawiający kontekst dla modelu.
  - **`userPrompt`**: `string` - Prompt od użytkownika.
  - **`responseSchema`**: `T` - Schemat Zod definiujący oczekiwaną strukturę odpowiedzi JSON.
  - **`model`**: `string` (opcjonalnie) - Nazwa modelu do użycia, nadpisuje domyślną.
  - **`modelParams`**: `object` (opcjonalnie) - Dodatkowe parametry modelu, takie jak `temperature`, `max_tokens` itp.

- **Zwraca**: `Promise<z.infer<T>>` - Obietnicę, która rozwiązuje się do obiektu JavaScript zgodnego ze schematem `responseSchema`.

## 4. Prywatne metody i pola

- `private readonly apiKey: string;` - Przechowuje klucz API.
- `private readonly defaultModel: string;` - Domyślna nazwa modelu.
- `private readonly baseUrl: string;` - Bazowy URL do API OpenRouter.

### `private _buildPayload<T extends z.ZodTypeAny>(params: GenerateParams<T>): object`

Tworzy ciało żądania (payload) do wysłania do API na podstawie parametrów. Konwertuje schemat Zod na JSON Schema i formatuje wiadomości.

### `private async _sendRequest(payload: object): Promise<any>`

Wysyła żądanie HTTP POST do API OpenRouter, dołączając nagłówki autoryzacyjne. Obsługuje podstawowe błędy odpowiedzi HTTP.

### `private _parseResponse<T extends z.ZodTypeAny>(apiResponse: any, schema: T): z.infer<T>`

Parsuje odpowiedź JSON z API, wyodrębnia argumenty z `tool_calls` i waliduje je za pomocą podanego schematu Zod.

## 5. Obsługa błędów

Usługa będzie implementować niestandardowe klasy błędów, aby zapewnić spójną i przewidywalną obsługę problemów.

- **`OpenRouterConfigurationError`**: Rzucany przez konstruktor, jeśli brakuje klucza API.
- **`OpenRouterAPIError`**: Rzucany, gdy API OpenRouter zwróci błąd (np. kod statusu 4xx, 5xx). Będzie zawierał kod statusu i treść błędu z API.
- **`OpenRouterResponseError`**: Rzucany, gdy odpowiedź z API ma nieoczekiwaną strukturę lub nie przechodzi walidacji schematu Zod.
- Błędy sieciowe (np. brak połączenia) będą obsługiwane i mogą być opakowane w niestandardowy błąd dla spójności.

## 6. Kwestie bezpieczeństwa

1. **Zarządzanie kluczem API**: Klucz API **nigdy** nie może być umieszczony bezpośrednio w kodzie. Musi być ładowany ze zmiennych środowiskowych (`process.env.OPENROUTER_API_KEY`) po stronie serwera (w endpointach API Astro lub middleware).
2. **Walidacja wejścia**: Wszystkie dane wejściowe pochodzące od użytkownika (np. zawartość promptu) powinny być walidowane i/lub sanitizowane przed przekazaniem do usługi, aby zapobiec atakom typu prompt injection.
3. **Ograniczenie zasobów**: Należy zaimplementować mechanizmy rate limitingu i/lub quota na endpointach API aplikacji, które korzystają z `OpenRouterService`, aby chronić przed nadużyciami i kontrolować koszty.

## 7. Plan wdrożenia krok po kroku

### Krok 1: Utworzenie pliku usługi i zdefiniowanie typów

1. Stwórz nowy plik: `src/lib/services/openrouter.service.ts`.
2. Zainstaluj zależności: `npm install zod zod-to-json-schema`.
3. Zdefiniuj niezbędne interfejsy i niestandardowe klasy błędów na górze pliku.

```typescript
// src/lib/services/openrouter.service.ts
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Custom Errors
export class OpenRouterConfigurationError extends Error { /* ... */ }
export class OpenRouterAPIError extends Error { /* ... */ }
export class OpenRouterResponseError extends Error { /* ... */ }

// Parameter Interfaces
interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  // ...inne parametry
}

export interface GenerateParams<T extends z.ZodTypeAny> {
  systemPrompt: string;
  userPrompt: string;
  responseSchema: T;
  model?: string;
  modelParams?: ModelParameters;
}
```

### Krok 2: Implementacja szkieletu klasy i konstruktora

Stwórz klasę `OpenRouterService` i zaimplementuj konstruktor, który wczytuje konfigurację i waliduje obecność klucza API.

```typescript
// src/lib/services/openrouter.service.ts

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly defaultModel: string = "anthropic/claude-3.5-sonnet";
  private readonly baseUrl: string = "https://openrouter.ai/api/v1";

  constructor(config: { apiKey?: string; defaultModel?: string } = {}) {
    this.apiKey = config.apiKey ?? import.meta.env.OPENROUTER_API_KEY;
    if (!this.apiKey) {
      throw new OpenRouterConfigurationError("OpenRouter API key is missing.");
    }
    if (config.defaultModel) {
      this.defaultModel = config.defaultModel;
    }
  }
  // ... reszta metod
}
```

### Krok 3: Implementacja prywatnej metody `_buildPayload`

Ta metoda będzie odpowiedzialna za przygotowanie ciała żądania, w tym za transformację schematu Zod.

```typescript
// Wewnątrz klasy OpenRouterService

private _buildPayload<T extends z.ZodTypeAny>(params: GenerateParams<T>): object {
    const { systemPrompt, userPrompt, responseSchema, model, modelParams } = params;
    const schemaName = "structured_response";
    const jsonSchema = zodToJsonSchema(responseSchema, schemaName);

    return {
      model: model ?? this.defaultModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tool_choice: { type: "function", function: { name: schemaName } },
      tools: [{
        type: "function",
        function: {
          name: schemaName,
          description: "Struktura odpowiedzi, której należy użyć.",
          parameters: jsonSchema,
        },
      }],
      response_format: { type: "json_object" }, // Dodatkowe wzmocnienie
      ...modelParams,
    };
}
```

### Krok 4: Implementacja prywatnej metody `_sendRequest`

Metoda do obsługi komunikacji HTTP przy użyciu `fetch`.

```typescript
// Wewnątrz klasy OpenRouterService

private async _sendRequest(payload: object): Promise<any> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new OpenRouterAPIError(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    return response.json();
}
```

### Krok 5: Implementacja prywatnej metody `_parseResponse`

Metoda do parsowania i walidacji odpowiedzi.

```typescript
// Wewnątrz klasy OpenRouterService

private _parseResponse<T extends z.ZodTypeAny>(apiResponse: any, schema: T): z.infer<T> {
    try {
      const toolCall = apiResponse.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.type !== "function") {
        throw new Error("Expected a function tool call in the response.");
      }

      const rawArguments = toolCall.function.arguments;
      const parsedArguments = JSON.parse(rawArguments);

      return schema.parse(parsedArguments);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown parsing error";
      throw new OpenRouterResponseError(`Failed to parse or validate the structured response: ${message}`);
    }
}
```

### Krok 6: Implementacja publicznej metody `generateStructuredResponse`

Orkiestruje ona wywołania metod prywatnych, łącząc wszystko w całość.

```typescript
// Wewnątrz klasy OpenRouterService

async generateStructuredResponse<T extends z.ZodTypeAny>(params: GenerateParams<T>): Promise<z.infer<T>> {
    const payload = this._buildPayload(params);
    const apiResponse = await this._sendRequest(payload);
    return this._parseResponse(apiResponse, params.responseSchema);
}
```

### Krok 7: Użycie usługi w punkcie końcowym API

Przykład użycia usługi w istniejącym endpoincie `src/pages/api/v1/flashcards/generate.ts`.

```typescript
// src/pages/api/v1/flashcards/generate.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { OpenRouterService } from "@/lib/services/openrouter.service";
import { FlashcardsResponseSchema } from "@/lib/schemas/generate-flashcards.schema"; // Załóżmy, że schemat Zod jest tutaj

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { topic, count } = body; // Przykładowe dane z requestu

    const openrouterService = new OpenRouterService();

    const result = await openrouterService.generateStructuredResponse({
      systemPrompt: "Jesteś ekspertem w tworzeniu fiszek edukacyjnych. Zawsze odpowiadaj w formacie JSON.",
      userPrompt: `Wygeneruj ${count} fiszek na temat: "${topic}".`,
      responseSchema: FlashcardsResponseSchema,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    // Logowanie błędu
    console.error(error);
    // Zwrócenie odpowiedniego błędu do klienta
    return new Response(JSON.stringify({ message: "An error occurred" }), { status: 500 });
  }
};
```

### Krok 8: Konfiguracja zmiennej środowiskowej

Utwórz plik `.env` w głównym katalogu projektu (jeśli jeszcze nie istnieje) i dodaj klucz API.

```env
# .env
OPENROUTER_API_KEY="sk-or-v1-..."
```

Upewnij się, że plik `.env` jest dodany do `.gitignore`.
