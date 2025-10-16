/**
 * AI Generation Service
 * Handles operations related to AI flashcard generation:
 * - Daily quota checking
 * - Saving pending flashcards
 * - Recording analytics
 */

import type { supabaseClient } from "@/db/supabase.client";
import type { PendingFlashcardInsert, PendingFlashcardDTO, AIGenerationAnalyticsInsert } from "@/types";

interface FlashcardCandidate {
  front: string;
  back: string;
}

interface GenerationMetadata {
  model: string;
  input_tokens: number;
  output_tokens: number;
  generation_time_ms: number;
}

/**
 * Checks how many AI generations the user has used today
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to check quota for
 * @returns Number of generations used today
 * @throws {Error} If database query fails
 */
export async function checkDailyQuota(supabase: typeof supabaseClient, userId: string): Promise<number> {
  // Get today's date at midnight UTC
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const { count, error } = await supabase
    .from("ai_generation_analytics")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayIso);

  if (error) {
    if (import.meta.env.DEV) {
      console.error("Error checking daily quota:", { error, userId });
    }
    throw new Error("Failed to check daily quota");
  }

  return count || 0;
}

/**
 * Saves generated flashcard candidates as pending flashcards
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID who owns the flashcards
 * @param candidates - Array of flashcard candidates to save
 * @returns Array of saved pending flashcards with IDs
 * @throws {Error} If database insert fails
 */
export async function savePendingFlashcards(
  supabase: typeof supabaseClient,
  userId: string,
  candidates: FlashcardCandidate[]
): Promise<PendingFlashcardDTO[]> {
  // Prepare batch insert
  const inserts: PendingFlashcardInsert[] = candidates.map((candidate) => ({
    user_id: userId,
    front_draft: candidate.front,
    back_draft: candidate.back,
  }));

  // Batch insert to database
  const { data, error } = await supabase
    .from("pending_flashcards")
    .insert(inserts)
    .select("id, front_draft, back_draft, created_at, updated_at");

  if (error) {
    if (import.meta.env.DEV) {
      console.error("Error saving pending flashcards:", { error, userId, count: inserts.length });
    }
    throw new Error("Failed to save pending flashcards");
  }

  if (!data || data.length === 0) {
    throw new Error("No flashcards were saved");
  }

  return data;
}

/**
 * Records analytics for an AI generation request
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID who made the generation request
 * @param metadata - Metadata about the generation (model, tokens, duration)
 * @returns void
 * @throws Never throws - logs errors but doesn't block response
 */
export async function recordAnalytics(
  supabase: typeof supabaseClient,
  userId: string,
  metadata: GenerationMetadata
): Promise<void> {
  const cost = calculateCost(metadata.input_tokens + metadata.output_tokens, metadata.model);

  const analyticsData: AIGenerationAnalyticsInsert = {
    user_id: userId,
    model: metadata.model,
    provider: "openrouter",
    input_tokens: metadata.input_tokens,
    output_tokens: metadata.output_tokens,
    duration_ms: metadata.generation_time_ms,
    cost_usd: cost,
  };

  const { error } = await supabase.from("ai_generation_analytics").insert(analyticsData);

  // Don't throw - analytics errors shouldn't block the response
  if (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to record analytics (non-blocking):", { error, userId });
    }
  }
}

/**
 * Calculates the cost of an AI generation based on token usage
 *
 * @param totalTokens - Total number of tokens used (input + output)
 * @param model - Model name used for generation
 * @returns Estimated cost in USD
 *
 * Note: This is a simplified calculation. Actual costs may vary.
 * Prices are approximate as of implementation date.
 */
export function calculateCost(totalTokens: number, model: string): number {
  // Simplified cost calculation
  // Real-world: should fetch actual pricing from config or API

  // Default: ~$0.01 per 1K tokens (averaged input/output for GPT-4 Turbo)
  const costPer1kTokens = 0.01;

  // Some models have different pricing
  if (model.includes("gpt-4-turbo")) {
    // GPT-4 Turbo: ~$0.01 input, ~$0.03 output per 1K (averaged)
    return (totalTokens / 1000) * 0.02;
  } else if (model.includes("gpt-3.5-turbo")) {
    // GPT-3.5 Turbo: ~$0.0005 input, ~$0.0015 output per 1K (averaged)
    return (totalTokens / 1000) * 0.001;
  }

  // Default fallback
  return (totalTokens / 1000) * costPer1kTokens;
}

/**
 * Gets the next midnight UTC timestamp for quota reset calculation
 *
 * @returns ISO string of next midnight UTC
 */
export function getNextMidnightUTC(): string {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}
