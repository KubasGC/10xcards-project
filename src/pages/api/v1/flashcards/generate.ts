/**
 * POST /api/v1/flashcards/generate
 *
 * Generates flashcard candidates from source text using AI.
 * Requires authentication and enforces daily quota limits.
 */

import type { APIRoute } from "astro";
import type { GenerateFlashcardsResponseDTO } from "../../../../types";

import {
  validateGenerateFlashcardsInput,
  FlashcardsResponseSchema,
} from "../../../../lib/schemas/generate-flashcards.schema";
import { error400, error401, error429, error500, error503 } from "../../../../lib/helpers/api-error.helper";
import {
  checkDailyQuota,
  savePendingFlashcards,
  recordAnalytics,
  getNextMidnightUTC,
} from "../../../../lib/services/ai-generation.service";
import { OpenRouterService } from "../../../../lib/services/openrouter.service";
import {
  OpenRouterAPIError,
  OpenRouterResponseError,
  OpenRouterConfigurationError,
} from "../../../../lib/services/openrouter.types";

// Daily quota limit per user
const DAILY_QUOTA_LIMIT = 10;

/**
 * POST handler for flashcard generation
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authentication check
    const supabase = locals.supabase;

    // Get authenticated user from Supabase session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const response = error401("You must be logged in to generate flashcards");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Step 2: Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      const response = error400("Invalid JSON in request body");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validation = validateGenerateFlashcardsInput(requestBody);

    if (!validation.success) {
      // Convert validation errors to ErrorDetailDTO[] format
      const validationErrors = validation.errors || {};
      const errorDetails = Object.entries(validationErrors).flatMap(([field, messages]) =>
        messages.map((message) => ({ field, message }))
      );

      const response = error400("Validation failed", errorDetails);
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // At this point, validation.success is true, so validation.data is guaranteed to exist
    if (!validation.data) {
      const response = error500("Validation succeeded but data is missing");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { source_text, hint } = validation.data;

    // Step 3: Check daily quota
    let usedGenerations: number;
    try {
      usedGenerations = await checkDailyQuota(supabase, userId);
    } catch (error) {
      console.error("Error checking quota:", error);
      const response = error500("Failed to check daily quota");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (usedGenerations >= DAILY_QUOTA_LIMIT) {
      const resetTime = getNextMidnightUTC();
      const response = error429(`Daily quota limit reached (${DAILY_QUOTA_LIMIT} generations per day)`, resetTime);
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Generate flashcards using AI
    const startTime = Date.now();
    let aiResponse;

    try {
      // Initialize OpenRouter service
      const openRouterService = new OpenRouterService();

      // Generate flashcards
      aiResponse = await openRouterService.generateFlashcards({
        sourceText: source_text,
        hint: hint,
        responseSchema: FlashcardsResponseSchema,
        modelParams: {
          temperature: 0.7,
          max_tokens: 2000,
        },
      });
    } catch (error) {
      console.error("AI generation failed:", error);

      // Handle specific error types
      if (error instanceof OpenRouterConfigurationError) {
        const response = error500("AI service configuration error. Please contact support.");
        return new Response(JSON.stringify(response.body), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error instanceof OpenRouterAPIError) {
        console.error("OpenRouter API Error:", {
          statusCode: error.statusCode,
          responseBody: error.responseBody,
        });
        const response = error503("AI service is temporarily unavailable. Please try again later.");
        return new Response(JSON.stringify(response.body), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error instanceof OpenRouterResponseError) {
        console.error("OpenRouter Response Error:", error.message);
        const response = error500("Failed to parse AI response. Please try again.");
        return new Response(JSON.stringify(response.body), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Generic error
      const response = error500("Failed to generate flashcards");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const generationTime = Date.now() - startTime;

    // Step 5: Save pending flashcards to database
    let savedFlashcards;
    try {
      savedFlashcards = await savePendingFlashcards(supabase, userId, aiResponse.flashcards);
    } catch (error) {
      console.error("Error saving flashcards:", error);
      const response = error500("Failed to save generated flashcards");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 6: Record analytics (non-blocking)
    const generationId = crypto.randomUUID();
    recordAnalytics(supabase, userId, {
      model: import.meta.env.OPENROUTER_MODEL,
      input_tokens: 0, // OpenRouter doesn't provide token counts in response with json_schema
      output_tokens: 0,
      generation_time_ms: generationTime,
    }).catch((error) => {
      console.warn("Failed to record analytics (non-blocking):", error);
    });

    // Step 7: Format and return success response
    const responseBody: GenerateFlashcardsResponseDTO = {
      generation_id: generationId,
      candidates: savedFlashcards,
      metadata: {
        model: import.meta.env.OPENROUTER_MODEL,
        tokens_used: 0, // Not available with json_schema response format
        generation_time_ms: generationTime,
      },
      quota_remaining: DAILY_QUOTA_LIMIT - usedGenerations - 1,
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in generate endpoint:", error);
    const response = error500("An unexpected error occurred");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
