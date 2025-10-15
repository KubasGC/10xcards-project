# Services Documentation

## OpenRouter Service

The `OpenRouterService` is responsible for generating flashcards from source text using AI models via the OpenRouter API.

### Configuration

The service requires two environment variables:

- `OPENROUTER_API_KEY` - Your OpenRouter API key (get it at https://openrouter.ai/keys)
- `OPENROUTER_MODEL` - The model to use for generation (configured in `wrangler.toml`)

### Usage

```typescript
import { OpenRouterService } from "@/lib/services/openrouter.service";
import { FlashcardsResponseSchema } from "@/lib/schemas/generate-flashcards.schema";

// Initialize the service
const service = new OpenRouterService();

// Generate flashcards
const result = await service.generateFlashcards({
  sourceText: "Your educational text here...",
  hint: "Focus on key definitions", // Optional
  responseSchema: FlashcardsResponseSchema,
  modelParams: {
    temperature: 0.7, // Optional: control randomness (0-1)
    max_tokens: 2000, // Optional: limit response length
  },
});

// Result contains: { flashcards: [{ front: string, back: string }] }
```

### Features

1. **Hard-coded Prompts**: The service has built-in system and user prompts optimized for flashcard generation
2. **Language Detection**: Automatically generates flashcards in the same language as the source text
3. **Structured Output**: Uses OpenRouter's `json_schema` response format for reliable JSON responses
4. **Type Safety**: Full TypeScript support with Zod schema validation
5. **Error Handling**: Comprehensive error handling with custom error types:
   - `OpenRouterConfigurationError` - Missing API key or model configuration
   - `OpenRouterAPIError` - API returned an error (includes status code and body)
   - `OpenRouterResponseError` - Response parsing or validation failed

### Response Schema

The service validates AI responses against the `FlashcardsResponseSchema`:

```typescript
{
  flashcards: [
    {
      front: string,  // 1-500 characters
      back: string,   // 1-1000 characters
    }
  ]  // 1-20 flashcards per generation
}
```

### Error Handling Example

```typescript
try {
  const result = await service.generateFlashcards({...});
} catch (error) {
  if (error instanceof OpenRouterConfigurationError) {
    // Handle configuration issues
  } else if (error instanceof OpenRouterAPIError) {
    // Handle API errors (service unavailable, rate limits, etc.)
    console.error("Status:", error.statusCode);
    console.error("Body:", error.responseBody);
  } else if (error instanceof OpenRouterResponseError) {
    // Handle invalid responses
  }
}
```

## AI Generation Service

The `ai-generation.service` provides helper functions for managing flashcard generation:

### Functions

- `checkDailyQuota(supabase, userId)` - Check how many generations user has used today
- `savePendingFlashcards(supabase, userId, candidates)` - Save generated flashcards as pending
- `recordAnalytics(supabase, userId, metadata)` - Record generation analytics (non-blocking)
- `getNextMidnightUTC()` - Get timestamp for next quota reset

### Example

```typescript
import {
  checkDailyQuota,
  savePendingFlashcards,
  recordAnalytics,
} from "@/lib/services/ai-generation.service";

// Check if user has quota remaining
const used = await checkDailyQuota(supabase, userId);
if (used >= DAILY_LIMIT) {
  throw new Error("Quota exceeded");
}

// Generate flashcards...
const aiResult = await service.generateFlashcards({...});

// Save to database
const saved = await savePendingFlashcards(
  supabase, 
  userId, 
  aiResult.flashcards
);

// Record analytics (non-blocking)
recordAnalytics(supabase, userId, {
  model: "google/gemini-2.5-flash-lite",
  input_tokens: 0,
  output_tokens: 0,
  generation_time_ms: 1500,
}).catch(console.warn);
```

