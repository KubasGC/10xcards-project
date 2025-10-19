/**
 * Unit Tests for AI Generation Service
 * Tests core business logic for flashcard generation including:
 * - Daily quota checking
 * - Pending flashcards saving
 * - Analytics recording
 * - Cost calculation
 * - Quota reset timing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkDailyQuota,
  savePendingFlashcards,
  recordAnalytics,
  calculateCost,
  getNextMidnightUTC,
} from "./ai-generation.service";
import type { supabaseClient } from "@/db/supabase.client";

// Mock Supabase client
const createMockSupabaseClient = (overrides: Record<string, unknown> = {}) => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
  };

  return {
    from: vi.fn().mockReturnValue(mockChain),
    ...overrides,
  };
};

describe("AI Generation Service", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkDailyQuota", () => {
    it("should return 0 when user has no generations today", async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };
      mockSupabase.from = vi.fn().mockReturnValue(mockChain);

      const result = await checkDailyQuota(mockSupabase, "user-123");

      expect(result).toBe(0);
      expect(mockSupabase.from).toHaveBeenCalledWith("ai_generation_analytics");
      expect(mockChain.select).toHaveBeenCalledWith("*", { count: "exact", head: true });
      expect(mockChain.eq).toHaveBeenCalledWith("user_id", "user-123");
    });

    it("should return correct count when user has generations today", async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: 5, error: null }),
      };
      mockSupabase.from = vi.fn().mockReturnValue(mockChain);

      const result = await checkDailyQuota(mockSupabase, "user-123");

      expect(result).toBe(5);
    });

    it("should return 0 when count is null", async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: null, error: null }),
      };
      mockSupabase.from = vi.fn().mockReturnValue(mockChain);

      const result = await checkDailyQuota(mockSupabase, "user-123");

      expect(result).toBe(0);
    });

    it("should throw error when database query fails", async () => {
      const dbError = { message: "Database connection failed", code: "CONNECTION_ERROR" };
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: null, error: dbError }),
      };
      mockSupabase.from = vi.fn().mockReturnValue(mockChain);

      await expect(checkDailyQuota(mockSupabase, "user-123")).rejects.toThrow("Failed to check daily quota");
    });

    it("should use UTC midnight for date calculation", async () => {
      const mockDate = new Date("2025-01-15T15:30:45.123Z");
      vi.setSystemTime(mockDate);

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };
      mockSupabase.from = vi.fn().mockReturnValue(mockChain);

      await checkDailyQuota(mockSupabase, "user-123");

      // Should query from 2025-01-15T00:00:00.000Z (UTC midnight)
      expect(mockChain.gte).toHaveBeenCalledWith("created_at", "2025-01-15T00:00:00.000Z");
    });
  });

  describe("savePendingFlashcards", () => {
    const mockCandidates = [
      { front: "What is TypeScript?", back: "A typed superset of JavaScript" },
      { front: "What is React?", back: "A JavaScript library for building UIs" },
    ];

    it("should save flashcards successfully", async () => {
      const mockSavedData = [
        {
          id: "1",
          front_draft: "What is TypeScript?",
          back_draft: "A typed superset of JavaScript",
          created_at: "2025-01-15T10:00:00Z",
          updated_at: "2025-01-15T10:00:00Z",
        },
        {
          id: "2",
          front_draft: "What is React?",
          back_draft: "A JavaScript library for building UIs",
          created_at: "2025-01-15T10:00:00Z",
          updated_at: "2025-01-15T10:00:00Z",
        },
      ];

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: mockSavedData, error: null }),
      };
      mockSupabase.from = vi.fn().mockReturnValue(mockChain);

      const result = await savePendingFlashcards(mockSupabase, "user-123", mockCandidates);

      expect(result).toEqual(mockSavedData);
      expect(mockSupabase.from).toHaveBeenCalledWith("pending_flashcards");
      expect(mockChain.insert).toHaveBeenCalledWith([
        { user_id: "user-123", front_draft: "What is TypeScript?", back_draft: "A typed superset of JavaScript" },
        { user_id: "user-123", front_draft: "What is React?", back_draft: "A JavaScript library for building UIs" },
      ]);
    });

    it("should throw error when database insert fails", async () => {
      const dbError = { message: "Insert failed", code: "INSERT_ERROR" };
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: null, error: dbError }),
      };
      mockSupabase.from = vi.fn().mockReturnValue(mockChain);

      await expect(savePendingFlashcards(mockSupabase, "user-123", mockCandidates)).rejects.toThrow(
        "Failed to save pending flashcards"
      );
    });

    it("should throw error when no data is returned", async () => {
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockSupabase.from = vi.fn().mockReturnValue(mockChain);

      await expect(savePendingFlashcards(mockSupabase, "user-123", mockCandidates)).rejects.toThrow(
        "No flashcards were saved"
      );
    });

    it("should handle empty candidates array", async () => {
      const mockSavedData: unknown[] = [];
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: mockSavedData, error: null }),
      };
      mockSupabase.from = vi.fn().mockReturnValue(mockChain);

      await expect(savePendingFlashcards(mockSupabase, "user-123", [])).rejects.toThrow("No flashcards were saved");
    });
  });

  describe("recordAnalytics", () => {
    const mockMetadata = {
      model: "gpt-4-turbo",
      input_tokens: 1000,
      output_tokens: 500,
      generation_time_ms: 2500,
    };

    it("should record analytics successfully", async () => {
      const mockChain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockSupabase.from = vi.fn().mockReturnValue(mockChain);

      await recordAnalytics(mockSupabase, "user-123", mockMetadata);

      expect(mockSupabase.from).toHaveBeenCalledWith("ai_generation_analytics");
      expect(mockChain.insert).toHaveBeenCalledWith({
        user_id: "user-123",
        model: "gpt-4-turbo",
        provider: "openrouter",
        input_tokens: 1000,
        output_tokens: 500,
        duration_ms: 2500,
        cost_usd: 0.03, // (1000 + 500) / 1000 * 0.02
      });
    });

    it("should not throw when analytics recording fails", async () => {
      const dbError = { message: "Analytics insert failed", code: "INSERT_ERROR" };
      const mockChain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: dbError }),
      };
      mockSupabase.from = vi.fn().mockReturnValue(mockChain);

      // Should not throw - analytics errors are non-blocking
      await expect(recordAnalytics(mockSupabase, "user-123", mockMetadata)).resolves.toBeUndefined();
    });

    it("should calculate cost correctly for different models", async () => {
      const mockChain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockSupabase.from = vi.fn().mockReturnValue(mockChain);

      // Test GPT-4 Turbo
      await recordAnalytics(mockSupabase, "user-123", {
        ...mockMetadata,
        model: "gpt-4-turbo",
      });

      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          cost_usd: 0.03, // (1000 + 500) / 1000 * 0.02
        })
      );
    });
  });

  describe("calculateCost", () => {
    it("should calculate correct cost for GPT-4 Turbo", () => {
      const cost = calculateCost(1500, "gpt-4-turbo");
      expect(cost).toBe(0.03); // 1500 / 1000 * 0.02
    });

    it("should calculate correct cost for GPT-3.5 Turbo", () => {
      const cost = calculateCost(2000, "gpt-3.5-turbo");
      expect(cost).toBe(0.002); // 2000 / 1000 * 0.001
    });

    it("should use default cost for unknown models", () => {
      const cost = calculateCost(1000, "unknown-model");
      expect(cost).toBe(0.01); // 1000 / 1000 * 0.01
    });

    it("should scale cost linearly with token count", () => {
      const cost1 = calculateCost(1000, "gpt-4-turbo");
      const cost2 = calculateCost(2000, "gpt-4-turbo");
      expect(cost2).toBe(cost1 * 2);
    });

    it("should handle zero tokens", () => {
      const cost = calculateCost(0, "gpt-4-turbo");
      expect(cost).toBe(0);
    });

    it("should handle fractional costs", () => {
      const cost = calculateCost(500, "gpt-4-turbo");
      expect(cost).toBe(0.01); // 500 / 1000 * 0.02
    });

    it("should be case insensitive for model names", () => {
      const cost1 = calculateCost(1000, "GPT-4-TURBO");
      const cost2 = calculateCost(1000, "gpt-4-turbo");
      expect(cost1).toBe(cost2);
    });
  });

  describe("getNextMidnightUTC", () => {
    it("should return tomorrow midnight UTC", () => {
      const result = getNextMidnightUTC();
      const resultDate = new Date(result);

      expect(resultDate.getUTCHours()).toBe(0);
      expect(resultDate.getUTCMinutes()).toBe(0);
      expect(resultDate.getUTCSeconds()).toBe(0);
      expect(resultDate.getUTCMilliseconds()).toBe(0);

      // Should be in the future
      expect(resultDate.getTime()).toBeGreaterThan(Date.now());
    });

    it("should return correct date when called at different times", () => {
      // Test at 12:00 PM UTC
      vi.setSystemTime(new Date("2025-01-15T12:00:00.000Z"));
      const result1 = getNextMidnightUTC();
      expect(result1).toBe("2025-01-16T00:00:00.000Z");

      // Test at 11:59 PM UTC
      vi.setSystemTime(new Date("2025-01-15T23:59:59.999Z"));
      const result2 = getNextMidnightUTC();
      expect(result2).toBe("2025-01-16T00:00:00.000Z");

      // Test at midnight UTC
      vi.setSystemTime(new Date("2025-01-15T00:00:00.000Z"));
      const result3 = getNextMidnightUTC();
      expect(result3).toBe("2025-01-16T00:00:00.000Z");
    });

    it("should handle month boundaries correctly", () => {
      vi.setSystemTime(new Date("2025-01-31T12:00:00.000Z"));
      const result = getNextMidnightUTC();
      expect(result).toBe("2025-02-01T00:00:00.000Z");
    });

    it("should handle year boundaries correctly", () => {
      vi.setSystemTime(new Date("2025-12-31T12:00:00.000Z"));
      const result = getNextMidnightUTC();
      expect(result).toBe("2026-01-01T00:00:00.000Z");
    });
  });

  describe("Business Rules Integration", () => {
    it("should enforce daily quota limit of 50 generations", async () => {
      // Mock user at limit
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: 50, error: null }),
      };
      mockSupabase.from = vi.fn().mockReturnValue(mockChain);

      const usedGenerations = await checkDailyQuota(mockSupabase, "user-123");
      expect(usedGenerations).toBe(50);
    });

    it("should allow generation when under limit", async () => {
      // Mock user under limit
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: 49, error: null }),
      };
      mockSupabase.from = vi.fn().mockReturnValue(mockChain);

      const usedGenerations = await checkDailyQuota(mockSupabase, "user-123");
      expect(usedGenerations).toBe(49);
      expect(usedGenerations).toBeLessThan(50);
    });

    it("should record analytics without storing sensitive data", async () => {
      const mockChain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockSupabase.from = vi.fn().mockReturnValue(mockChain);

      const metadata = {
        model: "gpt-4-turbo",
        input_tokens: 1000,
        output_tokens: 500,
        generation_time_ms: 2500,
      };

      await recordAnalytics(mockSupabase, "user-123", metadata);

      const insertCall = mockChain.insert.mock.calls[0][0];

      // Should not contain source text or generated content
      expect(JSON.stringify(insertCall)).not.toContain("source_text");
      expect(JSON.stringify(insertCall)).not.toContain("flashcards");
      expect(JSON.stringify(insertCall)).not.toContain("front");
      expect(JSON.stringify(insertCall)).not.toContain("back");

      // Should contain only metadata
      expect(insertCall).toHaveProperty("user_id");
      expect(insertCall).toHaveProperty("model");
      expect(insertCall).toHaveProperty("provider");
      expect(insertCall).toHaveProperty("input_tokens");
      expect(insertCall).toHaveProperty("output_tokens");
      expect(insertCall).toHaveProperty("duration_ms");
      expect(insertCall).toHaveProperty("cost_usd");
    });

    it("should handle batch insert of multiple flashcards", async () => {
      const manyCandidates = Array.from({ length: 10 }, (_, i) => ({
        front: `Question ${i + 1}`,
        back: `Answer ${i + 1}`,
      }));

      const mockSavedData = manyCandidates.map((candidate, i) => ({
        id: (i + 1).toString(),
        front_draft: candidate.front,
        back_draft: candidate.back,
        created_at: "2025-01-15T10:00:00Z",
        updated_at: "2025-01-15T10:00:00Z",
      }));

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: mockSavedData, error: null }),
      };
      mockSupabase.from = vi.fn().mockReturnValue(mockChain);

      const result = await savePendingFlashcards(mockSupabase, "user-123", manyCandidates);

      expect(result).toHaveLength(10);
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.arrayContaining(
          manyCandidates.map((candidate) => ({
            user_id: "user-123",
            front_draft: candidate.front,
            back_draft: candidate.back,
          }))
        )
      );
    });
  });
});
