/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { POST } from "./register";
import {
  createMockSupabaseClient,
  createMockAstroContext,
  createMockRequest,
  createMockAuthSuccessResponse,
  createMockAuthErrorResponse,
  parseResponseBody,
} from "@/test/helpers/supabase-test-helpers";

describe("POST /api/v1/auth/register - API Endpoint", () => {
  describe("Happy path - Successful registration", () => {
    it("should register successfully with valid credentials", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signUp: createMockAuthSuccessResponse({
          email: "newuser@example.com",
        }),
      });

      const context = createMockAstroContext({
        supabase: mockSupabase,
      });

      const request = createMockRequest({
        email: "newuser@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toContain("pomyślnie");
      expect(body.user.email).toBe("newuser@example.com");
      expect(body.user.id).toBeDefined();
    });

    it("should return user object with id and email only", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signUp: createMockAuthSuccessResponse({
          email: "test@example.com",
        }),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(body.user).toHaveProperty("id");
      expect(body.user).toHaveProperty("email");
      expect(body.user).not.toHaveProperty("password");
      expect(body.user).not.toHaveProperty("confirmPassword");
    });

    it("should set proper Content-Type header", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signUp: createMockAuthSuccessResponse({
          email: "test@example.com",
        }),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);

      // Assert
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("Validation errors - Invalid input", () => {
    it("should reject invalid JSON in request body", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });

      const invalidRequest = new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json {",
      });

      // Act
      const response = await POST({ request: invalidRequest, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject missing email field", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });

      const request = createMockRequest({
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "email",
          }),
        ])
      );
    });

    it("should reject missing password field", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });

      const request = createMockRequest({
        email: "test@example.com",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
          }),
        ])
      );
    });

    it("should reject missing confirmPassword field", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });

      const request = createMockRequest({
        email: "test@example.com",
        password: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "confirmPassword",
          }),
        ])
      );
    });

    it("should reject invalid email format", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });

      const request = createMockRequest({
        email: "not-an-email",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "email",
            message: expect.stringContaining("prawidłowy"),
          }),
        ])
      );
    });

    it("should reject password shorter than 8 characters", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });

      const request = createMockRequest({
        email: "test@example.com",
        password: "Pass1",
        confirmPassword: "Pass1",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject password without uppercase letter", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });

      const request = createMockRequest({
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
            message: expect.stringContaining("dużą"),
          }),
        ])
      );
    });

    it("should reject password without lowercase letter", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });

      const request = createMockRequest({
        email: "test@example.com",
        password: "PASSWORD123",
        confirmPassword: "PASSWORD123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
            message: expect.stringContaining("małą"),
          }),
        ])
      );
    });

    it("should reject password without digit", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });

      const request = createMockRequest({
        email: "test@example.com",
        password: "PasswordTest",
        confirmPassword: "PasswordTest",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
            message: expect.stringContaining("cyfrę"),
          }),
        ])
      );
    });

    it("should reject mismatched passwords", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });

      const request = createMockRequest({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password456",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "confirmPassword",
            message: expect.stringContaining("identyczne"),
          }),
        ])
      );
    });
  });

  describe("Authentication errors - Supabase errors", () => {
    it("should handle User already registered error", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signUp: createMockAuthErrorResponse("User already registered"),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "existing@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(401);
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(body.error.message).toContain("już istnieje");
    });

    it("should handle Password should be at least error", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signUp: createMockAuthErrorResponse("Password should be at least 8 characters"),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(401);
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(body.error.message).toMatch(/co najmniej 8 znaków/);
    });

    it("should handle Invalid email error", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signUp: createMockAuthErrorResponse("Invalid email"),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(401);
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(body.error.message).toContain("prawidłowy");
    });

    it("should handle Password is too weak error", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signUp: createMockAuthErrorResponse("Password is too weak"),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(401);
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(body.error.message).toContain("zbyt słabe");
    });

    it("should handle Signup is disabled error", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signUp: createMockAuthErrorResponse("Signup is disabled"),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(401);
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(body.error.message).toContain("tymczasowo");
    });

    it("should handle generic Supabase error with default message", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signUp: createMockAuthErrorResponse("Unknown error from Supabase"),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(401);
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(body.error.message).toBe("Błąd rejestracji");
    });

    it("should handle null user in response", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signUp: createMockAuthSuccessResponse({ id: "test-id", email: "test@example.com" }),
      });
      // Override to create scenario where data exists but user is null
      mockSupabase.auth.signUp = vi.fn().mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(401);
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(body.error.message).toBe("Błąd rejestracji");
    });
  });

  describe("Exception handling", () => {
    it("should catch and handle JSON parsing error", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });

      const invalidRequest = new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{broken json",
      });

      // Act
      const response = await POST({ request: invalidRequest, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should catch and handle Supabase client error", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      mockSupabase.auth.signUp = vi.fn().mockRejectedValueOnce(new Error("Network error"));

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(500);
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });

    it("should handle malformed response from Supabase", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      mockSupabase.auth.signUp = vi.fn().mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(401);
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(body.error.message).toBe("Błąd rejestracji");
    });
  });

  describe("Edge cases", () => {
    it("should handle very long email address", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signUp: createMockAuthSuccessResponse({ email: "a".repeat(200) + "@example.com" }),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const longEmail = "a".repeat(200) + "@example.com";
      const request = createMockRequest({
        email: longEmail,
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("should handle very long password (up to reasonable limit)", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signUp: createMockAuthSuccessResponse({ email: "test@example.com" }),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const longPassword = "A" + "a".repeat(250) + "1";
      const request = createMockRequest({
        email: "test@example.com",
        password: longPassword,
        confirmPassword: longPassword,
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("should handle email with plus addressing", async () => {
      // Arrange
      const emailWithPlus = "user+test@example.com";
      const mockSupabase = createMockSupabaseClient({
        signUp: createMockAuthSuccessResponse({ email: emailWithPlus }),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: emailWithPlus,
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(200);
      expect(body.user.email).toBe(emailWithPlus);
    });

    it("should handle email with unicode domain", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });

      const request = createMockRequest({
        email: "test@tëst.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      // Email format validation will reject this
      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should verify signUp is called with correct parameters", async () => {
      // Arrange
      const signUpMock = vi.fn().mockResolvedValueOnce({
        data: { user: { id: "test-id", email: "test@example.com" } },
        error: null,
      });

      const mockSupabase = {
        auth: {
          signUp: signUpMock,
          signInWithPassword: vi.fn(),
          signOut: vi.fn(),
          getUser: vi.fn(),
        },
      };

      const context = createMockAstroContext({ supabase: mockSupabase as any });
      const request = createMockRequest({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      await POST({ request, locals: context.locals } as any);

      // Assert
      expect(signUpMock).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "Password123",
        options: {
          emailRedirectTo: undefined,
        },
      });
    });

    it("should not expose confirmPassword in response", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signUp: createMockAuthSuccessResponse({ email: "test@example.com" }),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const responseText = await response.clone().text();

      // Assert
      expect(responseText).not.toContain("confirmPassword");
    });

    it("should handle extra fields in request body gracefully", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signUp: createMockAuthSuccessResponse({ email: "test@example.com" }),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });

      const requestWithExtra = new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "Password123",
          confirmPassword: "Password123",
          maliciousField: "should be ignored",
          anotherField: 123,
        }),
      });

      // Act
      const response = await POST({ request: requestWithExtra, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      // Extra fields should not be included in response
      expect(body).not.toHaveProperty("maliciousField");
    });
  });
});
