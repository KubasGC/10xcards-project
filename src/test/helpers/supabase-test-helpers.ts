/**
 * Supabase Test Helpers
 * Provides mock objects and utilities for testing Supabase integration
 */

import { vi } from "vitest";

export interface MockUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface MockSupabaseAuthSuccessResponse {
  data: { user: MockUser; session: { access_token: string; refresh_token?: string } };
  error: null;
}

export interface MockSupabaseAuthErrorResponse {
  data: null;
  error: { message: string; status?: number };
}

export type MockSupabaseAuthResponse = MockSupabaseAuthSuccessResponse | MockSupabaseAuthErrorResponse;

/**
 * Creates a mock Supabase user object
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: "test-user-123",
    email: "test@example.com",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock successful authentication response
 */
export function createMockAuthSuccessResponse(user: Partial<MockUser> = {}): MockSupabaseAuthSuccessResponse {
  return {
    data: {
      user: createMockUser(user),
      session: {
        access_token: "mock-access-token-123",
        refresh_token: "mock-refresh-token-456",
      },
    },
    error: null,
  };
}

/**
 * Creates a mock failed authentication response
 */
export function createMockAuthErrorResponse(message: string): MockSupabaseAuthErrorResponse {
  return {
    data: null,
    error: {
      message,
      status: 401,
    },
  };
}

/**
 * Creates a mock Supabase client with auth methods
 */
export function createMockSupabaseClient(mockResponses?: {
  signInWithPassword?: MockSupabaseAuthResponse;
  signUp?: MockSupabaseAuthResponse;
  signOut?: { error: null | { message: string } };
  getUser?: { data: { user: MockUser | null }; error: null | { message: string } };
}) {
  const defaultSignInResponse = createMockAuthSuccessResponse();
  const defaultSignUpResponse = createMockAuthSuccessResponse();
  const defaultSignOutResponse = { error: null };
  const defaultGetUserResponse = { data: { user: null }, error: null };

  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue(mockResponses?.signInWithPassword || defaultSignInResponse),
      signUp: vi.fn().mockResolvedValue(mockResponses?.signUp || defaultSignUpResponse),
      signOut: vi.fn().mockResolvedValue(mockResponses?.signOut || defaultSignOutResponse),
      getUser: vi.fn().mockResolvedValue(mockResponses?.getUser || defaultGetUserResponse),
    },
  };
}

/**
 * Creates a mock Astro context for API routes
 */
export function createMockAstroContext(overrides?: {
  supabase?: ReturnType<typeof createMockSupabaseClient>;
  user?: MockUser | null;
}) {
  return {
    locals: {
      supabase: overrides?.supabase || createMockSupabaseClient(),
      user: overrides?.user || null,
    },
  };
}

/**
 * Creates a mock Request object for API testing
 */
export function createMockRequest(body: Record<string, unknown>, method = "POST"): Request {
  return new Request("http://localhost:3000/api/v1/auth", {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

/**
 * Helper to parse Response body
 */
export async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
