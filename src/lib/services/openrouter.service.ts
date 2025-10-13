/**
 * OpenRouter Service
 * Handles communication with OpenRouter API for AI flashcard generation
 */

interface FlashcardCandidate {
  front: string;
  back: string;
}

interface GenerationMetadata {
  model: string;
  input_tokens: number;
  output_tokens: number;
  generation_time_ms: number;
  tokens_used: number;
}

interface OpenRouterResponse {
  candidates: FlashcardCandidate[];
  metadata: GenerationMetadata;
}

/**
 * Custom error for network-related issues
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * Custom error for timeout issues
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * System prompt that instructs the AI model how to generate flashcards
 */
const SYSTEM_PROMPT = `You are a flashcard generation expert. Your task is to create high-quality flashcards from source text.

Rules:
1. Generate as many flashcards as you want/can (but no more than 25) from the provided text
2. Each flashcard should focus on a single concept or fact
3. Front (question) should be clear and concise (1-200 characters)
4. Back (answer) should be complete but not too verbose (1-600 characters)
5. Avoid trivial questions
6. Ensure questions test understanding, not just memorization
7. Use the hint if provided to focus on specific aspects

Response format (JSON):
{
  "candidates": [
    {"front": "question text", "back": "answer text"},
    ...
  ]
}`;

/**
 * Generates flashcards from source text using OpenRouter API
 *
 * @param sourceText - The source text to generate flashcards from (1000-20000 chars)
 * @param hint - Optional hint to guide AI generation (max 500 chars)
 * @param options - Optional configuration (timeout in ms)
 * @returns Promise with generated flashcard candidates and metadata
 * @throws {NetworkError} When network connection fails
 * @throws {TimeoutError} When request exceeds timeout limit
 * @throws {Error} For other API or parsing errors
 */
export async function generateFlashcards(
  sourceText: string,
  hint?: string,
  options: { timeout?: number } = {}
): Promise<OpenRouterResponse> {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  const model = import.meta.env.OPENROUTER_MODEL || "openai/gpt-4-turbo";
  const timeout = options.timeout || 30000; // 30 seconds default

  // Validate API key
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  // Build user prompt
  let userPrompt = `Generate flashcards from the following text:\n\n${sourceText}`;
  if (hint) {
    userPrompt += `\n\nHint: ${hint}`;
  }

  const startTime = Date.now();

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://10xcards.app", // Optional: for OpenRouter analytics
        "X-Title": "10xCards Flashcard Generator", // Optional: for OpenRouter analytics
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-200 responses
    if (!response.ok) {
      if (response.status === 503) {
        throw new NetworkError("OpenRouter API is temporarily unavailable");
      }
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    // Parse response
    const data = await response.json();
    const generationTimeMs = Date.now() - startTime;

    // Extract content from OpenRouter response
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI returned no content");
    }

    // Parse the JSON content
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      throw new Error("AI returned invalid JSON format");
    }

    // Validate structure
    if (!parsedContent.candidates || !Array.isArray(parsedContent.candidates)) {
      throw new Error("AI response missing candidates array");
    }

    if (parsedContent.candidates.length === 0) {
      throw new Error("AI returned no candidates");
    }

    // Validate each candidate
    for (const candidate of parsedContent.candidates) {
      if (!candidate.front || !candidate.back) {
        throw new Error("AI returned candidate with missing front or back");
      }
      if (typeof candidate.front !== "string" || typeof candidate.back !== "string") {
        throw new Error("AI returned candidate with invalid types");
      }
      if (candidate.front.length < 1 || candidate.front.length > 200) {
        throw new Error("AI returned candidate with invalid front length");
      }
      if (candidate.back.length < 1 || candidate.back.length > 600) {
        throw new Error("AI returned candidate with invalid back length");
      }
    }

    // Extract token usage
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    const totalTokens = data.usage?.total_tokens || inputTokens + outputTokens;

    return {
      candidates: parsedContent.candidates,
      metadata: {
        model: data.model || model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        generation_time_ms: generationTimeMs,
        tokens_used: totalTokens,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort (timeout)
    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError(`Request timed out after ${timeout}ms`);
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new NetworkError("Failed to connect to OpenRouter API");
    }

    // Re-throw custom errors
    if (error instanceof NetworkError || error instanceof TimeoutError) {
      throw error;
    }

    // Re-throw other errors
    throw error;
  }
}
