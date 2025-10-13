/**
 * Zod Validation Schema for Generate Flashcards Endpoint
 * Validates POST /api/v1/flashcards/generate request body
 */

import { z } from "zod";

/**
 * Schema for validating flashcard generation request
 */
export const GenerateFlashcardsSchema = z.object({
  source_text: z
    .string({
      required_error: "source_text is required",
      invalid_type_error: "source_text must be a string",
    })
    .min(1000, "source_text must be at least 1000 characters")
    .max(20000, "source_text must not exceed 20000 characters")
    .trim(),

  hint: z
    .string({
      invalid_type_error: "hint must be a string",
    })
    .max(500, "hint must not exceed 500 characters")
    .trim()
    .optional(),
});

/**
 * TypeScript type inferred from schema
 */
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsSchema>;

/**
 * Validates request body for flashcard generation
 *
 * @param data - Unknown data from request body
 * @returns Parsed and validated data or validation errors
 */
export function validateGenerateFlashcardsInput(data: unknown): {
  success: boolean;
  data?: GenerateFlashcardsInput;
  errors?: Record<string, string[]>;
} {
  const result = GenerateFlashcardsSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  // Format Zod errors into a user-friendly structure
  const errors: Record<string, string[]> = {};

  for (const issue of result.error.issues) {
    const field = issue.path.join(".");
    if (!errors[field]) {
      errors[field] = [];
    }
    errors[field].push(issue.message);
  }

  return {
    success: false,
    errors,
  };
}
