/**
 * OpenRouter Service
 * Handles communication with OpenRouter.ai API for flashcard generation.
 * Provides structured response generation with Zod schema validation.
 */

import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { GenerateFlashcardsParams, OpenRouterServiceConfig, OpenRouterAPIResponse } from "./openrouter.types";
import { OpenRouterConfigurationError, OpenRouterAPIError, OpenRouterResponseError } from "./openrouter.types";

/**
 * System prompt for flashcard generation
 * Defines the AI's role and behavior
 */
const SYSTEM_PROMPT = `You are an expert educational assistant specialized in creating high-quality flashcards for active learning and spaced repetition.

Your task is to analyze the provided source text and generate flashcards that:
1. Focus on key concepts, definitions, and important facts
2. Use clear, concise language
3. Create questions that promote active recall
4. Ensure answers are specific and accurate
5. Avoid ambiguity - each question should have one clear answer
6. Use the hint (if provided) to focus on specific topics or adjust difficulty
7. Generate flashcards in the SAME LANGUAGE as the source text (detect the language automatically)

Guidelines for flashcard creation:
- Front: Write a clear question or prompt that tests understanding
- Back: Provide a concise, accurate answer
- Prefer atomic flashcards (one concept per card)
- Use natural language, avoid overly technical jargon unless necessary
- Make questions specific enough to have unambiguous answers
- IMPORTANT: Always use the same language as the source text for both questions and answers

Always respond in valid JSON format following the provided schema.`;

/**
 * Service for interacting with OpenRouter.ai API
 *
 * Features:
 * - Flashcard generation from source text
 * - Structured JSON response with Zod validation
 * - Automatic schema conversion to JSON Schema
 * - Comprehensive error handling
 *
 * @example
 * ```typescript
 * const service = new OpenRouterService();
 * const result = await service.generateFlashcards({
 *   sourceText: "TypeScript is a typed superset of JavaScript...",
 *   responseSchema: FlashcardsSchema,
 * });
 * ```
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string = "https://openrouter.ai/api/v1";

  /**
   * Creates a new OpenRouterService instance
   *
   * @param config - Configuration options
   * @param config.apiKey - OpenRouter API key (falls back to OPENROUTER_API_KEY env var)
   * @param config.model - Model to use (falls back to OPENROUTER_MODEL env var)
   * @throws {OpenRouterConfigurationError} If API key or model is missing
   */
  constructor(config: OpenRouterServiceConfig = {}) {
    if (import.meta.env.E2E_TESTS === "1") {
      this.apiKey = "test-api-key";
      this.model = "test-model";
      return;
    }

    // Load API key from config or environment
    this.apiKey = config.apiKey ?? import.meta.env.OPENROUTER_API_KEY;
    if (!this.apiKey) {
      throw new OpenRouterConfigurationError(
        "OpenRouter API key is missing. Provide it via config or OPENROUTER_API_KEY environment variable."
      );
    }

    // Load model from config or environment
    this.model = config.model ?? import.meta.env.OPENROUTER_MODEL;
    if (!this.model) {
      throw new OpenRouterConfigurationError(
        "OpenRouter model is missing. Provide it via config or OPENROUTER_MODEL environment variable."
      );
    }
  }

  /**
   * Generates flashcards from source text
   *
   * Sends the source text to the configured model and returns parsed, validated flashcards
   * according to the provided Zod schema.
   *
   * @param params - Generation parameters
   * @returns Promise resolving to validated flashcard data
   * @throws {OpenRouterAPIError} If API returns an error
   * @throws {OpenRouterResponseError} If response parsing/validation fails
   *
   * @example
   * ```typescript
   * const ResponseSchema = z.object({
   *   flashcards: z.array(z.object({
   *     front: z.string(),
   *     back: z.string(),
   *   }))
   * });
   *
   * const result = await service.generateFlashcards({
   *   sourceText: "The Pythagorean theorem states that...",
   *   hint: "Focus on the mathematical formula",
   *   responseSchema: ResponseSchema,
   * });
   * ```
   */
  async generateFlashcards<T extends z.ZodTypeAny>(params: GenerateFlashcardsParams<T>): Promise<z.infer<T>> {
    if (import.meta.env.E2E_TESTS === "1") {
      return {
        flashcards: [{ front: "Test question", back: "Test answer" }],
      };
    }

    const payload = this._buildPayload(params);
    const apiResponse = await this._sendRequest(payload);
    return this._parseResponse(apiResponse, params.responseSchema);
  }

  /**
   * Builds the request payload for OpenRouter API
   *
   * Converts Zod schema to JSON Schema and formats the request according to
   * OpenRouter's json_schema response format specification.
   *
   * @param params - Generation parameters
   * @returns Formatted payload object ready for API request
   */
  private _buildPayload<T extends z.ZodTypeAny>(params: GenerateFlashcardsParams<T>): object {
    const { sourceText, hint, responseSchema, modelParams } = params;

    // Build user prompt from source text and optional hint
    const userPrompt = this._buildUserPrompt(sourceText, hint);

    // Use a fixed name for the schema
    const schemaName = "flashcards_response";

    // Convert Zod schema to JSON Schema
    const jsonSchemaFull = zodToJsonSchema(responseSchema, schemaName);

    // Extract the actual schema (zod-to-json-schema wraps it in definitions)
    const schema = jsonSchemaFull.definitions?.[schemaName] ?? jsonSchemaFull;

    return {
      model: this.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: schemaName,
          strict: true,
          schema: schema,
        },
      },
      temperature: 0.7,
      max_tokens: 2000,
      ...modelParams,
    };
  }

  /**
   * Builds user prompt from source text and optional hint
   *
   * @param sourceText - Source text to generate flashcards from
   * @param hint - Optional hint to guide generation
   * @returns Formatted user prompt
   */
  private _buildUserPrompt(sourceText: string, hint?: string): string {
    let prompt = `Generate flashcards from the following source text:\n\n${sourceText}`;

    if (hint) {
      prompt += `\n\nAdditional guidance: ${hint}`;
    }

    return prompt;
  }

  /**
   * Sends HTTP request to OpenRouter API
   *
   * Handles authentication and error responses from the API.
   *
   * @param payload - Request payload object
   * @returns Promise resolving to API response data
   * @throws {OpenRouterAPIError} If API returns non-2xx status
   */
  private async _sendRequest(payload: object): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new OpenRouterAPIError(
        `OpenRouter API Error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    return response.json();
  }

  /**
   * Parses and validates API response
   *
   * Extracts the JSON content from the response and validates it against
   * the provided Zod schema.
   *
   * @param apiResponse - Raw response from OpenRouter API
   * @param schema - Zod schema to validate against
   * @returns Parsed and validated response data
   * @throws {OpenRouterResponseError} If response structure is invalid or validation fails
   */
  private _parseResponse<T extends z.ZodTypeAny>(apiResponse: unknown, schema: T): z.infer<T> {
    try {
      // Extract content from response
      const response = apiResponse as OpenRouterAPIResponse;
      const content = response.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content found in API response.");
      }

      // Parse JSON content
      const parsedContent = JSON.parse(content);

      // Validate against the Zod schema
      return schema.parse(parsedContent);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown parsing error";
      throw new OpenRouterResponseError(`Failed to parse or validate the structured response: ${message}`);
    }
  }
}
