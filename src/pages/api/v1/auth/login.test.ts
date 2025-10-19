/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { POST } from "./login";
import {
  createMockSupabaseClient,
  createMockAstroContext,
  createMockRequest,
  createMockAuthSuccessResponse,
  createMockAuthErrorResponse,
  parseResponseBody,
} from "@/test/helpers/supabase-test-helpers";

describe("POST /api/v1/auth/login - API Endpoint", () => {
  describe("Happy path - Successful login", () => {
    it("should login successfully with valid credentials", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signInWithPassword: createMockAuthSuccessResponse({
          email: "user@example.com",
        }),
      });

      const context = createMockAstroContext({
        supabase: mockSupabase,
      });

      const request = createMockRequest({
        email: "user@example.com",
        password: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toContain("pomyślnie");
      expect(body.user.email).toBe("user@example.com");
      expect(body.user.id).toBeDefined();
    });

    it("should return user object with id and email", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "user@example.com",
        password: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(body.user).toHaveProperty("id");
      expect(body.user).toHaveProperty("email");
      expect(body.user).not.toHaveProperty("password");
    });

    it("should set proper Content-Type header", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "user@example.com",
        password: "Password123",
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

      const invalidRequest = new Request("http://localhost/api/v1/auth/login", {
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

    it("should reject empty email", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "",
        password: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toBeDefined();
      expect(body.error.details.some((d: any) => d.field === "email")).toBe(true);
    });

    it("should reject invalid email format", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "not-an-email",
        password: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(400);
      expect(body.error.details).toBeDefined();
    });

    it("should reject empty password", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "user@example.com",
        password: "",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(400);
      expect(body.error.details.some((d: any) => d.field === "password")).toBe(true);
    });

    it("should reject password shorter than 8 characters", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "user@example.com",
        password: "Pass123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);

      // Assert
      expect(response.status).toBe(400);
    });

    it("should reject missing email field", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({ password: "Password123" });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(400);
      expect(body.error.details.some((d: any) => d.field === "email")).toBe(true);
    });

    it("should reject missing password field", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({ email: "user@example.com" });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(400);
      expect(body.error.details.some((d: any) => d.field === "password")).toBe(true);
    });

    it("should return validation error details array", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "invalid",
        password: "short",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(body.error.details).toBeInstanceOf(Array);
      expect(body.error.details.length).toBeGreaterThan(0);
      expect(body.error.details[0]).toHaveProperty("field");
      expect(body.error.details[0]).toHaveProperty("message");
    });
  });

  describe("Authentication errors - Invalid credentials", () => {
    it("should return 401 for invalid login credentials", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signInWithPassword: createMockAuthErrorResponse("Invalid login credentials"),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "user@example.com",
        password: "WrongPassword123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(401);
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(body.error.message).toContain("email lub hasło");
    });

    it("should return friendly message for invalid credentials", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signInWithPassword: createMockAuthErrorResponse("Invalid login credentials"),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "user@example.com",
        password: "WrongPassword123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(body.error.message).toBe("Nieprawidłowy email lub hasło");
    });

    it('should handle "Email not confirmed" error', async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signInWithPassword: createMockAuthErrorResponse("Email not confirmed"),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "user@example.com",
        password: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(401);
      expect(body.error.message).toContain("Email nie został potwierdzony");
    });

    it('should handle "Too many requests" error (rate limit)', async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signInWithPassword: createMockAuthErrorResponse("Too many requests"),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "user@example.com",
        password: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(401);
      expect(body.error.message).toContain("Zbyt wiele prób logowania");
    });

    it("should handle generic auth error message", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signInWithPassword: createMockAuthErrorResponse("Some unknown error"),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "user@example.com",
        password: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(401);
      expect(body.error.message).toBe("Błąd logowania");
    });

    it("should return 401 when Supabase returns null user", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signInWithPassword: createMockAuthErrorResponse("Auth failed"),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "user@example.com",
        password: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(401);
      expect(body.error.message).toBe("Błąd logowania");
    });
  });

  describe("Error handling - Unexpected errors", () => {
    it("should catch and handle unexpected exceptions", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      // Make signInWithPassword throw an error
      mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(new Error("Network error"));

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "user@example.com",
        password: "Password123",
      });

      // Mock console.error to prevent test output
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
        // Mock implementation - intentionally empty to suppress console output
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(500);
      expect(body.error.code).toBe("INTERNAL_ERROR");
      expect(body.error.message).toContain("nieoczekiwany błąd");
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it("should handle malformed Supabase response", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signInWithPassword: createMockAuthErrorResponse("Auth failed"),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "user@example.com",
        password: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe("Edge cases", () => {
    it("should accept email with different cases", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signInWithPassword: createMockAuthSuccessResponse({
          email: "user@example.com",
        }),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "User@Example.COM",
        password: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("should handle extra fields in request body", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });

      const requestWithExtra = new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "Password123",
          extra_field: "should be ignored",
        }),
      });

      // Act
      const response = await POST({
        request: requestWithExtra,
        locals: context.locals,
      } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("should call Supabase signInWithPassword with correct params", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "user@example.com",
        password: "Password123",
      });

      // Act
      await POST({ request, locals: context.locals } as any);

      // Assert
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Password123",
      });
    });

    it("should not expose sensitive data in error messages", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signInWithPassword: createMockAuthErrorResponse("Invalid login credentials"),
      });

      const context = createMockAstroContext({ supabase: mockSupabase });
      const request = createMockRequest({
        email: "user@example.com",
        password: "Password123",
      });

      // Act
      const response = await POST({ request, locals: context.locals } as any);
      const body = (await parseResponseBody(response)) as Record<string, any>;

      // Assert
      expect(body.error.message).not.toContain("Password123");
      expect(body.error.message).not.toContain("Internal");
    });
  });
});
