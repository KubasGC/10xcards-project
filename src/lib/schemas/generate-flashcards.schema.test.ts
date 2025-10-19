/**
 * Unit Tests for Generate Flashcards Schema
 * Tests validation logic for:
 * - Request input validation
 * - Response schema validation
 * - Edge cases and boundary conditions
 * - Error message formatting
 */

import { describe, it, expect } from "vitest";
import {
  GenerateFlashcardsSchema,
  FlashcardCandidateSchema,
  FlashcardsResponseSchema,
  validateGenerateFlashcardsInput,
  type GenerateFlashcardsInput,
  type FlashcardCandidate,
  type FlashcardsResponse,
} from "./generate-flashcards.schema";

describe("Generate Flashcards Schema", () => {
  describe("GenerateFlashcardsSchema", () => {
    it("should validate correct input", () => {
      const validInput = {
        source_text: "A".repeat(1000),
        hint: "Focus on key concepts",
      };

      const result = GenerateFlashcardsSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source_text).toBe("A".repeat(1000));
        expect(result.data.hint).toBe("Focus on key concepts");
      }
    });

    it("should validate input without hint", () => {
      const validInput = {
        source_text: "A".repeat(1000),
      };

      const result = GenerateFlashcardsSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source_text).toBe("A".repeat(1000));
        expect(result.data.hint).toBeUndefined();
      }
    });

    it("should trim whitespace from strings", () => {
      const input = {
        source_text: "  " + "A".repeat(1000) + "  ",
        hint: "  Focus on concepts  ",
      };

      const result = GenerateFlashcardsSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source_text).toBe("A".repeat(1000));
        expect(result.data.hint).toBe("Focus on concepts");
      }
    });

    it("should reject missing source_text", () => {
      const input = {
        hint: "Focus on concepts",
      };

      const result = GenerateFlashcardsSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("source_text is required");
      }
    });

    it("should reject source_text that is too short", () => {
      const input = {
        source_text: "A".repeat(999), // 1 character short
      };

      const result = GenerateFlashcardsSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("source_text must be at least 1000 characters");
      }
    });

    it("should reject source_text that is too long", () => {
      const input = {
        source_text: "A".repeat(100001), // 1 character over limit
      };

      const result = GenerateFlashcardsSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("source_text must not exceed 100000 characters");
      }
    });

    it("should accept source_text at minimum length", () => {
      const input = {
        source_text: "A".repeat(1000), // Exactly minimum
      };

      const result = GenerateFlashcardsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept source_text at maximum length", () => {
      const input = {
        source_text: "A".repeat(100000), // Exactly maximum
      };

      const result = GenerateFlashcardsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject hint that is too long", () => {
      const input = {
        source_text: "A".repeat(1000),
        hint: "A".repeat(501), // 1 character over limit
      };

      const result = GenerateFlashcardsSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("hint must not exceed 500 characters");
      }
    });

    it("should accept hint at maximum length", () => {
      const input = {
        source_text: "A".repeat(1000),
        hint: "A".repeat(500), // Exactly maximum
      };

      const result = GenerateFlashcardsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject non-string source_text", () => {
      const input = {
        source_text: 123,
      };

      const result = GenerateFlashcardsSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("source_text must be a string");
      }
    });

    it("should reject non-string hint", () => {
      const input = {
        source_text: "A".repeat(1000),
        hint: 123,
      };

      const result = GenerateFlashcardsSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("hint must be a string");
      }
    });

    it("should handle empty string after trimming", () => {
      const input = {
        source_text: "   ", // Only whitespace
      };

      const result = GenerateFlashcardsSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("source_text must be at least 1000 characters");
      }
    });

    it("should handle special characters and unicode", () => {
      const input = {
        source_text: "你好世界 🌍 " + "A".repeat(995) + " !@#$%^&*()",
        hint: "Focus on 中文 concepts",
      };

      const result = GenerateFlashcardsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("FlashcardCandidateSchema", () => {
    it("should validate correct flashcard candidate", () => {
      const validCandidate = {
        front: "What is TypeScript?",
        back: "A typed superset of JavaScript",
      };

      const result = FlashcardCandidateSchema.safeParse(validCandidate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.front).toBe("What is TypeScript?");
        expect(result.data.back).toBe("A typed superset of JavaScript");
      }
    });

    it("should trim whitespace from front and back", () => {
      const candidate = {
        front: "  What is TypeScript?  ",
        back: "  A typed superset of JavaScript  ",
      };

      const result = FlashcardCandidateSchema.safeParse(candidate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.front).toBe("What is TypeScript?");
        expect(result.data.back).toBe("A typed superset of JavaScript");
      }
    });

    it("should reject empty front after trimming", () => {
      const candidate = {
        front: "   ",
        back: "Answer",
      };

      const result = FlashcardCandidateSchema.safeParse(candidate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("front must not be empty");
      }
    });

    it("should reject empty back after trimming", () => {
      const candidate = {
        front: "Question",
        back: "   ",
      };

      const result = FlashcardCandidateSchema.safeParse(candidate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("back must not be empty");
      }
    });

    it("should reject front that is too long", () => {
      const candidate = {
        front: "A".repeat(501), // 1 character over limit
        back: "Answer",
      };

      const result = FlashcardCandidateSchema.safeParse(candidate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("front must not exceed 500 characters");
      }
    });

    it("should reject back that is too long", () => {
      const candidate = {
        front: "Question",
        back: "A".repeat(1001), // 1 character over limit
      };

      const result = FlashcardCandidateSchema.safeParse(candidate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("back must not exceed 1000 characters");
      }
    });

    it("should accept front at maximum length", () => {
      const candidate = {
        front: "A".repeat(500), // Exactly maximum
        back: "Answer",
      };

      const result = FlashcardCandidateSchema.safeParse(candidate);
      expect(result.success).toBe(true);
    });

    it("should accept back at maximum length", () => {
      const candidate = {
        front: "Question",
        back: "A".repeat(1000), // Exactly maximum
      };

      const result = FlashcardCandidateSchema.safeParse(candidate);
      expect(result.success).toBe(true);
    });

    it("should reject missing front", () => {
      const candidate = {
        back: "Answer",
      };

      const result = FlashcardCandidateSchema.safeParse(candidate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("front is required");
      }
    });

    it("should reject missing back", () => {
      const candidate = {
        front: "Question",
      };

      const result = FlashcardCandidateSchema.safeParse(candidate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("back is required");
      }
    });

    it("should reject non-string front", () => {
      const candidate = {
        front: 123,
        back: "Answer",
      };

      const result = FlashcardCandidateSchema.safeParse(candidate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("front must be a string");
      }
    });

    it("should reject non-string back", () => {
      const candidate = {
        front: "Question",
        back: 123,
      };

      const result = FlashcardCandidateSchema.safeParse(candidate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("back must be a string");
      }
    });
  });

  describe("FlashcardsResponseSchema", () => {
    it("should validate correct response with multiple flashcards", () => {
      const validResponse = {
        flashcards: [
          { front: "Question 1", back: "Answer 1" },
          { front: "Question 2", back: "Answer 2" },
        ],
      };

      const result = FlashcardsResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.flashcards).toHaveLength(2);
      }
    });

    it("should validate response with single flashcard", () => {
      const validResponse = {
        flashcards: [{ front: "Question", back: "Answer" }],
      };

      const result = FlashcardsResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("should reject empty flashcards array", () => {
      const response = {
        flashcards: [],
      };

      const result = FlashcardsResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("At least one flashcard must be generated");
      }
    });

    it("should reject too many flashcards", () => {
      const response = {
        flashcards: Array.from({ length: 21 }, (_, i) => ({
          front: `Question ${i + 1}`,
          back: `Answer ${i + 1}`,
        })),
      };

      const result = FlashcardsResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Maximum 20 flashcards can be generated at once");
      }
    });

    it("should accept maximum number of flashcards", () => {
      const response = {
        flashcards: Array.from({ length: 20 }, (_, i) => ({
          front: `Question ${i + 1}`,
          back: `Answer ${i + 1}`,
        })),
      };

      const result = FlashcardsResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should reject non-array flashcards", () => {
      const response = {
        flashcards: "not an array",
      };

      const result = FlashcardsResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });

    it("should reject missing flashcards field", () => {
      const response = {};

      const result = FlashcardsResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });

    it("should validate each flashcard in the array", () => {
      const response = {
        flashcards: [
          { front: "Valid Question", back: "Valid Answer" },
          { front: "", back: "Invalid Answer" }, // Empty front should fail
        ],
      };

      const result = FlashcardsResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGenerateFlashcardsInput", () => {
    it("should return success for valid input", () => {
      const input = {
        source_text: "A".repeat(1000),
        hint: "Focus on concepts",
      };

      const result = validateGenerateFlashcardsInput(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(input);
      expect(result.errors).toBeUndefined();
    });

    it("should return success for input without hint", () => {
      const input = {
        source_text: "A".repeat(1000),
      };

      const result = validateGenerateFlashcardsInput(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(input);
    });

    it("should return errors for invalid input", () => {
      const input = {
        source_text: "Too short",
        hint: "A".repeat(501),
      };

      const result = validateGenerateFlashcardsInput(input);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveProperty("source_text");
      expect(result.errors).toHaveProperty("hint");
    });

    it("should format errors correctly", () => {
      const input = {
        source_text: "Too short",
        hint: "A".repeat(501),
      };

      const result = validateGenerateFlashcardsInput(input);
      expect(result.success).toBe(false);
      expect(result.errors).toEqual({
        source_text: ["source_text must be at least 1000 characters"],
        hint: ["hint must not exceed 500 characters"],
      });
    });

    it("should handle multiple errors for same field", () => {
      const input = {
        source_text: 123, // Wrong type
        hint: 456, // Wrong type
      };

      const result = validateGenerateFlashcardsInput(input);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("source_text");
      expect(result.errors).toHaveProperty("hint");
    });

    it("should handle nested field errors", () => {
      const input = {
        source_text: "A".repeat(1000),
        hint: "Valid hint",
        extra_field: "Should be ignored",
      };

      const result = validateGenerateFlashcardsInput(input);
      expect(result.success).toBe(true);
      // Extra fields should be ignored by Zod
    });
  });

  describe("TypeScript Types", () => {
    it("should infer correct types", () => {
      // These are compile-time tests - if they compile, types are correct
      const input: GenerateFlashcardsInput = {
        source_text: "A".repeat(1000),
        hint: "Optional hint",
      };

      const candidate: FlashcardCandidate = {
        front: "Question",
        back: "Answer",
      };

      const response: FlashcardsResponse = {
        flashcards: [candidate],
      };

      expect(input).toBeDefined();
      expect(candidate).toBeDefined();
      expect(response).toBeDefined();
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle very long text with special characters", () => {
      const longText = "A".repeat(50000) + "!@#$%^&*()" + "你好世界" + "🌍".repeat(100);
      const input = {
        source_text: longText,
        hint: "Special characters test",
      };

      const result = GenerateFlashcardsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should handle newlines and tabs in text", () => {
      const textWithWhitespace = "A".repeat(500) + "\n\t\r" + "B".repeat(500);
      const input = {
        source_text: textWithWhitespace,
        hint: "Text with\nnewlines\tand\ttabs",
      };

      const result = GenerateFlashcardsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should handle JSON-like strings", () => {
      const jsonLikeText = '{"key": "value", "array": [1, 2, 3]}' + "A".repeat(1000);
      const input = {
        source_text: jsonLikeText,
      };

      const result = GenerateFlashcardsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should handle HTML-like strings", () => {
      const htmlLikeText = "<div><p>Content</p></div>" + "A".repeat(975);
      const input = {
        source_text: htmlLikeText,
      };

      const result = GenerateFlashcardsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});
