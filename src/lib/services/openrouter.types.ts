/**
 * Type definitions for OpenRouter Service
 */

import { z } from "zod";

// ============================================================================
// Custom Error Classes
// ============================================================================

/**
 * Thrown when OpenRouter service is misconfigured (e.g. missing API key)
 */
export class OpenRouterConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterConfigurationError";
  }
}

/**
 * Thrown when OpenRouter API returns an error response (4xx, 5xx)
 */
export class OpenRouterAPIError extends Error {
  public readonly statusCode: number;
  public readonly responseBody: string;

  constructor(message: string, statusCode: number, responseBody: string) {
    super(message);
    this.name = "OpenRouterAPIError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

/**
 * Thrown when API response has unexpected structure or fails validation
 */
export class OpenRouterResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterResponseError";
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Optional parameters for model behavior configuration
 */
export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * Parameters for generating flashcards
 */
export interface GenerateFlashcardsParams<T extends z.ZodTypeAny> {
  sourceText: string;
  hint?: string;
  responseSchema: T;
  modelParams?: ModelParameters;
}

/**
 * Configuration options for OpenRouterService
 */
export interface OpenRouterServiceConfig {
  apiKey?: string;
  model?: string;
}

/**
 * Structure of OpenRouter API response
 */
export interface OpenRouterAPIResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
}
