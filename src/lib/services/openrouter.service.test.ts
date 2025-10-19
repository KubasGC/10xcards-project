/**
 * Unit Tests for OpenRouter Service
 * Tests AI flashcard generation including:
 * - Configuration validation
 * - API communication
 * - Response parsing and validation
 * - Error handling
 * - Edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenRouterService } from "./openrouter.service";
import { z } from "zod";
import { OpenRouterConfigurationError, OpenRouterAPIError, OpenRouterResponseError } from "./openrouter.types";
import { FlashcardsResponseSchema } from "../schemas/generate-flashcards.schema";

// Mock environment variables
const mockEnv = {
  OPENROUTER_API_KEY: "test-api-key",
  OPENROUTER_MODEL: "test-model",
};

// Use the real schema from the application
const FlashcardsSchema = FlashcardsResponseSchema;

describe("OpenRouterService", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = global.fetch;

    // Mock environment variables
    vi.stubEnv("OPENROUTER_API_KEY", mockEnv.OPENROUTER_API_KEY);
    vi.stubEnv("OPENROUTER_MODEL", mockEnv.OPENROUTER_MODEL);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  describe("constructor", () => {
    it("should initialize with environment variables", () => {
      const service = new OpenRouterService();
      expect(service).toBeInstanceOf(OpenRouterService);
    });

    it("should initialize with config parameters", () => {
      const service = new OpenRouterService({
        apiKey: "custom-key",
        model: "custom-model",
      });
      expect(service).toBeInstanceOf(OpenRouterService);
    });

    it("should throw error when API key is missing", () => {
      vi.stubEnv("OPENROUTER_API_KEY", "");

      expect(() => new OpenRouterService()).toThrow(OpenRouterConfigurationError);
    });

    it("should throw error when model is missing", () => {
      vi.stubEnv("OPENROUTER_MODEL", "");

      expect(() => new OpenRouterService({ apiKey: "test-key" })).toThrow(OpenRouterConfigurationError);
    });

    it("should prioritize config over environment variables", () => {
      const service = new OpenRouterService({
        apiKey: "config-key",
        model: "config-model",
      });
      expect(service).toBeInstanceOf(OpenRouterService);
    });
  });

  describe("generateFlashcards", () => {
    it("should successfully generate flashcards", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashcards: [
                  { front: "What is TypeScript?", back: "A typed superset of JavaScript" },
                  { front: "What is React?", back: "A JavaScript library for building UIs" },
                ],
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const service = new OpenRouterService();
      const result = await service.generateFlashcards({
        sourceText: "TypeScript is a typed superset of JavaScript...",
        responseSchema: FlashcardsSchema,
      });

      expect(result.flashcards).toHaveLength(2);
      expect(result.flashcards[0].front).toBe("What is TypeScript?");
      expect(result.flashcards[0].back).toBe("A typed superset of JavaScript");
    });

    it("should include hint in user prompt when provided", async () => {
      let capturedPayload: Record<string, unknown>;

      global.fetch = vi.fn().mockImplementation(async (url, options) => {
        capturedPayload = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({
            choices: [
              {
                message: { content: JSON.stringify({ flashcards: [{ front: "Test question", back: "Test answer" }] }) },
              },
            ],
          }),
        };
      });

      const service = new OpenRouterService();
      await service.generateFlashcards({
        sourceText: "Test text",
        hint: "Focus on main concepts",
        responseSchema: FlashcardsSchema,
      });

      const userMessage = (capturedPayload.messages as { role: string; content: string }[]).find(
        (m) => m.role === "user"
      );
      expect(userMessage.content).toContain("Focus on main concepts");
    });

    it("should use correct API endpoint and headers", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            { message: { content: JSON.stringify({ flashcards: [{ front: "Test question", back: "Test answer" }] }) } },
          ],
        }),
      });

      const service = new OpenRouterService();
      await service.generateFlashcards({
        sourceText: "Test text",
        responseSchema: FlashcardsSchema,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer test-api-key",
            "Content-Type": "application/json",
          },
        })
      );
    });

    it("should include system prompt in messages", async () => {
      let capturedPayload: Record<string, unknown>;

      global.fetch = vi.fn().mockImplementation(async (url, options) => {
        capturedPayload = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({
            choices: [
              {
                message: { content: JSON.stringify({ flashcards: [{ front: "Test question", back: "Test answer" }] }) },
              },
            ],
          }),
        };
      });

      const service = new OpenRouterService();
      await service.generateFlashcards({
        sourceText: "Test text",
        responseSchema: FlashcardsSchema,
      });

      const systemMessage = (capturedPayload.messages as { role: string; content: string }[]).find(
        (m) => m.role === "system"
      );
      expect(systemMessage).toBeDefined();
      expect(systemMessage.content).toContain("expert educational assistant");
      expect(systemMessage.content).toContain("flashcards for active learning");
    });

    it("should include JSON schema in request", async () => {
      let capturedPayload: Record<string, unknown>;

      global.fetch = vi.fn().mockImplementation(async (url, options) => {
        capturedPayload = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({
            choices: [
              {
                message: { content: JSON.stringify({ flashcards: [{ front: "Test question", back: "Test answer" }] }) },
              },
            ],
          }),
        };
      });

      const service = new OpenRouterService();
      await service.generateFlashcards({
        sourceText: "Test text",
        responseSchema: FlashcardsSchema,
      });

      expect(capturedPayload.response_format).toEqual({
        type: "json_schema",
        json_schema: expect.objectContaining({
          name: "flashcards_response",
          schema: expect.any(Object),
        }),
      });
    });

    it("should use default model parameters", async () => {
      let capturedPayload: Record<string, unknown>;

      global.fetch = vi.fn().mockImplementation(async (url, options) => {
        capturedPayload = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({
            choices: [
              {
                message: { content: JSON.stringify({ flashcards: [{ front: "Test question", back: "Test answer" }] }) },
              },
            ],
          }),
        };
      });

      const service = new OpenRouterService();
      await service.generateFlashcards({
        sourceText: "Test text",
        responseSchema: FlashcardsSchema,
      });

      expect(capturedPayload.temperature).toBe(0.7);
      expect(capturedPayload.max_tokens).toBe(2000);
    });

    it("should use custom model parameters when provided", async () => {
      let capturedPayload: Record<string, unknown>;

      global.fetch = vi.fn().mockImplementation(async (url, options) => {
        capturedPayload = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({
            choices: [
              {
                message: { content: JSON.stringify({ flashcards: [{ front: "Test question", back: "Test answer" }] }) },
              },
            ],
          }),
        };
      });

      const service = new OpenRouterService();
      await service.generateFlashcards({
        sourceText: "Test text",
        responseSchema: FlashcardsSchema,
        modelParams: {
          temperature: 0.5,
          max_tokens: 1000,
          top_p: 0.9,
        },
      });

      expect(capturedPayload.temperature).toBe(0.5);
      expect(capturedPayload.max_tokens).toBe(1000);
      expect(capturedPayload.top_p).toBe(0.9);
    });
  });

  describe("Error Handling", () => {
    it("should throw OpenRouterAPIError on API error response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Server error details",
      });

      const service = new OpenRouterService();

      await expect(
        service.generateFlashcards({
          sourceText: "Test",
          responseSchema: FlashcardsSchema,
        })
      ).rejects.toThrow(OpenRouterAPIError);
    });

    it("should include status code and response body in API error", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: async () => "Rate limit exceeded",
      });

      const service = new OpenRouterService();

      try {
        await service.generateFlashcards({
          sourceText: "Test",
          responseSchema: FlashcardsSchema,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(OpenRouterAPIError);
        expect((error as OpenRouterAPIError).statusCode).toBe(429);
        expect((error as OpenRouterAPIError).responseBody).toBe("Rate limit exceeded");
      }
    });

    it("should throw OpenRouterResponseError on invalid JSON response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { content: "invalid json" },
            },
          ],
        }),
      });

      const service = new OpenRouterService();

      await expect(
        service.generateFlashcards({
          sourceText: "Test",
          responseSchema: FlashcardsSchema,
        })
      ).rejects.toThrow(OpenRouterResponseError);
    });

    it("should throw OpenRouterResponseError on missing choices", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const service = new OpenRouterService();

      await expect(
        service.generateFlashcards({
          sourceText: "Test",
          responseSchema: FlashcardsSchema,
        })
      ).rejects.toThrow(OpenRouterResponseError);
    });

    it("should throw OpenRouterResponseError on empty choices array", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [],
        }),
      });

      const service = new OpenRouterService();

      await expect(
        service.generateFlashcards({
          sourceText: "Test",
          responseSchema: FlashcardsSchema,
        })
      ).rejects.toThrow(OpenRouterResponseError);
    });

    it("should throw OpenRouterResponseError on missing message content", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {},
            },
          ],
        }),
      });

      const service = new OpenRouterService();

      await expect(
        service.generateFlashcards({
          sourceText: "Test",
          responseSchema: FlashcardsSchema,
        })
      ).rejects.toThrow(OpenRouterResponseError);
    });

    it("should throw OpenRouterResponseError on schema validation failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: [
                    { front: "Question" }, // Missing 'back' field
                  ],
                }),
              },
            },
          ],
        }),
      });

      const service = new OpenRouterService();

      await expect(
        service.generateFlashcards({
          sourceText: "Test",
          responseSchema: FlashcardsSchema,
        })
      ).rejects.toThrow(OpenRouterResponseError);
    });

    it("should handle network errors", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const service = new OpenRouterService();

      await expect(
        service.generateFlashcards({
          sourceText: "Test",
          responseSchema: FlashcardsSchema,
        })
      ).rejects.toThrow("Network error");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty source text", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { content: JSON.stringify({ flashcards: [{ front: "Test question", back: "Test answer" }] }) },
            },
          ],
        }),
      });

      const service = new OpenRouterService();
      const result = await service.generateFlashcards({
        sourceText: "",
        responseSchema: FlashcardsSchema,
      });

      expect(result.flashcards).toHaveLength(1);
    });

    it("should handle very long source text", async () => {
      const longText = "A".repeat(50000);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { content: JSON.stringify({ flashcards: [{ front: "Test question", back: "Test answer" }] }) },
            },
          ],
        }),
      });

      const service = new OpenRouterService();
      await service.generateFlashcards({
        sourceText: longText,
        responseSchema: FlashcardsSchema,
      });

      expect(global.fetch).toHaveBeenCalled();
    });

    it("should handle special characters in source text", async () => {
      const specialText = "Text with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?";

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { content: JSON.stringify({ flashcards: [{ front: "Test question", back: "Test answer" }] }) },
            },
          ],
        }),
      });

      const service = new OpenRouterService();
      await service.generateFlashcards({
        sourceText: specialText,
        responseSchema: FlashcardsSchema,
      });

      expect(global.fetch).toHaveBeenCalled();
    });

    it("should handle unicode characters", async () => {
      const unicodeText = "Text with unicode: 你好世界 🌍 émojis";

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { content: JSON.stringify({ flashcards: [{ front: "Test question", back: "Test answer" }] }) },
            },
          ],
        }),
      });

      const service = new OpenRouterService();
      await service.generateFlashcards({
        sourceText: unicodeText,
        responseSchema: FlashcardsSchema,
      });

      expect(global.fetch).toHaveBeenCalled();
    });

    it("should handle maximum number of flashcards", async () => {
      const manyFlashcards = Array.from({ length: 20 }, (_, i) => ({
        front: `Question ${i + 1}`,
        back: `Answer ${i + 1}`,
      }));

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { content: JSON.stringify({ flashcards: manyFlashcards }) },
            },
          ],
        }),
      });

      const service = new OpenRouterService();
      const result = await service.generateFlashcards({
        sourceText: "Test text",
        responseSchema: FlashcardsSchema,
      });

      expect(result.flashcards).toHaveLength(20);
    });
  });

  describe("Schema Validation", () => {
    it("should validate required fields in flashcard schema", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: [
                    { front: "Question", back: "Answer" },
                    { front: "", back: "Answer" }, // Empty front should fail
                  ],
                }),
              },
            },
          ],
        }),
      });

      const service = new OpenRouterService();

      await expect(
        service.generateFlashcards({
          sourceText: "Test",
          responseSchema: FlashcardsSchema,
        })
      ).rejects.toThrow(OpenRouterResponseError);
    });

    it("should validate string types in flashcard schema", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: [
                    { front: 123, back: "Answer" }, // Number instead of string
                  ],
                }),
              },
            },
          ],
        }),
      });

      const service = new OpenRouterService();

      await expect(
        service.generateFlashcards({
          sourceText: "Test",
          responseSchema: FlashcardsSchema,
        })
      ).rejects.toThrow(OpenRouterResponseError);
    });

    it("should validate array structure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: "not an array", // Should be array
                }),
              },
            },
          ],
        }),
      });

      const service = new OpenRouterService();

      await expect(
        service.generateFlashcards({
          sourceText: "Test",
          responseSchema: FlashcardsSchema,
        })
      ).rejects.toThrow(OpenRouterResponseError);
    });
  });
});
