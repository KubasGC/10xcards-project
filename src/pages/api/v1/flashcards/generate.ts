/**
 * POST /api/v1/flashcards/generate
 *
 * Generates flashcard candidates from source text using AI.
 * Requires authentication and enforces daily quota limits.
 */

import type { APIRoute } from "astro";
import type { GenerateFlashcardsResponseDTO } from "../../../../types";

import { validateGenerateFlashcardsInput } from "../../../../lib/schemas/generate-flashcards.schema";
import { error400, error401, error429, error500, error503 } from "../../../../lib/helpers/api-error.helper";
import {
  checkDailyQuota,
  savePendingFlashcards,
  recordAnalytics,
  getNextMidnightUTC,
} from "../../../../lib/services/ai-generation.service";
import { generateFlashcards, NetworkError, TimeoutError } from "../../../../lib/services/openrouter.service";

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
    let aiResponse;
    try {
      aiResponse = await generateFlashcards(source_text, hint, {
        timeout: 30000, // 30 seconds
      });
    } catch (error) {
      console.error("AI generation failed:", error);

      // Handle specific error types
      if (error instanceof TimeoutError) {
        const response = error503("AI generation timed out. Please try again with shorter text or try again later.");
        return new Response(JSON.stringify(response.body), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error instanceof NetworkError) {
        const response = error503("Unable to reach AI service. Please try again in a few moments.");
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

    // Step 5: Save pending flashcards to database
    let savedFlashcards;
    try {
      savedFlashcards = await savePendingFlashcards(supabase, userId, aiResponse.candidates);
    } catch (error) {
      console.error("Error saving flashcards:", error);
      const response = error500("Failed to save generated flashcards");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 6: Record analytics (non-blocking, returns generation_id)
    const generationId = crypto.randomUUID();
    recordAnalytics(supabase, userId, aiResponse.metadata).catch((error) => {
      console.warn("Failed to record analytics (non-blocking):", error);
    });

    // Step 7: Format and return success response
    const responseBody: GenerateFlashcardsResponseDTO = {
      generation_id: generationId,
      candidates: savedFlashcards,
      metadata: {
        model: aiResponse.metadata.model,
        tokens_used: aiResponse.metadata.tokens_used,
        generation_time_ms: aiResponse.metadata.generation_time_ms,
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
