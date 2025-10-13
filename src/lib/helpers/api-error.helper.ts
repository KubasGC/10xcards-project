/**
 * API Error Helpers
 * Provides standardized error response creation for REST API endpoints
 */

import type { ErrorCode, ErrorDetailDTO, ErrorResponseDTO } from "@/types";

/**
 * Creates a standardized error response object
 *
 * @param statusCode - HTTP status code
 * @param errorCode - Application-specific error code (e.g., "VALIDATION_ERROR")
 * @param message - User-friendly error message
 * @param details - Optional additional error details
 * @returns ErrorResponseDTO conforming to API standard
 */
export function createErrorResponse(
  statusCode: number,
  errorCode: ErrorCode,
  message: string,
  details?: ErrorDetailDTO[]
): ErrorResponseDTO {
  const response: ErrorResponseDTO = {
    error: {
      id: crypto.randomUUID(),
      code: errorCode,
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  return response;
}

/**
 * Creates a 400 Bad Request error response
 *
 * @param message - User-friendly error message
 * @param details - Optional validation error details
 * @returns 400 error response
 */
export function error400(
  message = "Invalid request data",
  details?: ErrorDetailDTO[]
): { status: number; body: ErrorResponseDTO } {
  return {
    status: 400,
    body: createErrorResponse(400, "VALIDATION_ERROR", message, details),
  };
}

/**
 * Creates a 401 Unauthorized error response
 *
 * @param message - User-friendly error message
 * @returns 401 error response
 */
export function error401(message = "Unauthorized - authentication required"): {
  status: number;
  body: ErrorResponseDTO;
} {
  return {
    status: 401,
    body: createErrorResponse(401, "UNAUTHORIZED", message),
  };
}

/**
 * Creates a 429 Too Many Requests error response
 *
 * @param message - User-friendly error message
 * @param resetTime - Optional ISO timestamp when quota resets (included in message if provided)
 * @returns 429 error response
 */
export function error429(
  message = "Rate limit exceeded",
  resetTime?: string
): { status: number; body: ErrorResponseDTO } {
  // Include reset time in message if provided
  const fullMessage = resetTime ? `${message}. Quota resets at ${resetTime}` : message;

  return {
    status: 429,
    body: createErrorResponse(429, "RATE_LIMIT_EXCEEDED", fullMessage),
  };
}

/**
 * Creates a 500 Internal Server Error response
 *
 * @param message - User-friendly error message
 * @param logContext - Optional context to log (not sent to client)
 * @returns 500 error response
 */
export function error500(
  message = "An unexpected error occurred",
  logContext?: Record<string, unknown>
): { status: number; body: ErrorResponseDTO } {
  // Log context for debugging (not sent to client)
  if (logContext) {
    console.error("Internal server error:", logContext);
  }

  return {
    status: 500,
    body: createErrorResponse(500, "INTERNAL_ERROR", message),
  };
}

/**
 * Creates a 503 Service Unavailable error response
 *
 * @param message - User-friendly error message
 * @param retryAfter - Optional retry-after delay in seconds (included in message if provided)
 * @returns 503 error response
 */
export function error503(
  message = "Service temporarily unavailable",
  retryAfter?: number
): { status: number; body: ErrorResponseDTO } {
  // Include retry-after in message if provided
  const fullMessage = retryAfter ? `${message}. Retry after ${retryAfter} seconds` : message;

  return {
    status: 503,
    body: createErrorResponse(503, "AI_SERVICE_UNAVAILABLE", fullMessage),
  };
}
