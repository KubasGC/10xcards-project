import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, validateLoginInput, validateRegisterInput } from "./auth.schema";

describe("Auth Schemas - Validation", () => {
  describe("loginSchema", () => {
    describe("Email validation", () => {
      it("should accept valid email addresses", () => {
        const result = loginSchema.safeParse({
          email: "user@example.com",
          password: "Password123",
        });

        expect(result.success).toBe(true);
      });

      it("should reject empty email", () => {
        const result = loginSchema.safeParse({
          email: "",
          password: "Password123",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain("wymagany");
      });

      it("should reject missing email field", () => {
        const result = loginSchema.safeParse({
          password: "Password123",
        });

        expect(result.success).toBe(false);
      });

      it("should reject invalid email format", () => {
        const result = loginSchema.safeParse({
          email: "not-an-email",
          password: "Password123",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain("prawidłowy adres email");
      });

      it("should reject email with special characters", () => {
        const result = loginSchema.safeParse({
          email: "user@domain..com",
          password: "Password123",
        });

        expect(result.success).toBe(false);
      });

      it("should accept email with subdomain", () => {
        const result = loginSchema.safeParse({
          email: "user@mail.example.co.uk",
          password: "Password123",
        });

        expect(result.success).toBe(true);
      });

      it("should accept email with plus sign", () => {
        const result = loginSchema.safeParse({
          email: "user+tag@example.com",
          password: "Password123",
        });

        expect(result.success).toBe(true);
      });
    });

    describe("Password validation", () => {
      it("should accept valid password", () => {
        const result = loginSchema.safeParse({
          email: "user@example.com",
          password: "ValidPassword123",
        });

        expect(result.success).toBe(true);
      });

      it("should reject empty password", () => {
        const result = loginSchema.safeParse({
          email: "user@example.com",
          password: "",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain("wymagane");
      });

      it("should reject password shorter than 8 characters", () => {
        const result = loginSchema.safeParse({
          email: "user@example.com",
          password: "Pass123",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain("co najmniej 8 znaków");
      });

      it("should accept password with exactly 8 characters", () => {
        const result = loginSchema.safeParse({
          email: "user@example.com",
          password: "Pass1234",
        });

        expect(result.success).toBe(true);
      });

      it("should accept password longer than 8 characters", () => {
        const result = loginSchema.safeParse({
          email: "user@example.com",
          password: "VeryLongPassword123456789",
        });

        expect(result.success).toBe(true);
      });

      it("should accept password with special characters", () => {
        const result = loginSchema.safeParse({
          email: "user@example.com",
          password: "Pass@word123!",
        });

        expect(result.success).toBe(true);
      });

      it("should reject missing password field", () => {
        const result = loginSchema.safeParse({
          email: "user@example.com",
        });

        expect(result.success).toBe(false);
      });
    });

    describe("Multiple validation errors", () => {
      it("should return multiple errors for invalid email and password", () => {
        const result = loginSchema.safeParse({
          email: "invalid-email",
          password: "short",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues.length).toBeGreaterThanOrEqual(2);
      });

      it("should handle additional unexpected fields gracefully", () => {
        const result = loginSchema.safeParse({
          email: "user@example.com",
          password: "Password123",
          extra_field: "should be ignored",
          another_field: 123,
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe("registerSchema", () => {
    describe("Email validation", () => {
      it("should accept valid email", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "Password123",
          confirmPassword: "Password123",
        });

        expect(result.success).toBe(true);
      });

      it("should reject empty email", () => {
        const result = registerSchema.safeParse({
          email: "",
          password: "Password123",
          confirmPassword: "Password123",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain("wymagany");
      });

      it("should reject invalid email format", () => {
        const result = registerSchema.safeParse({
          email: "not-a-valid-email",
          password: "Password123",
          confirmPassword: "Password123",
        });

        expect(result.success).toBe(false);
      });
    });

    describe("Password requirements", () => {
      it("should accept password with uppercase, lowercase, and digit", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "Password123",
          confirmPassword: "Password123",
        });

        expect(result.success).toBe(true);
      });

      it("should require at least 8 characters", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "Pass12",
          confirmPassword: "Pass12",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain("co najmniej 8 znaków");
      });

      it("should require uppercase letter", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "password123",
          confirmPassword: "password123",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues.some((issue) => issue.message.includes("dużą literę"))).toBe(true);
      });

      it("should require lowercase letter", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "PASSWORD123",
          confirmPassword: "PASSWORD123",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues.some((issue) => issue.message.includes("małą literę"))).toBe(true);
      });

      it("should require digit", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "PasswordABC",
          confirmPassword: "PasswordABC",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues.some((issue) => issue.message.includes("cyfrę"))).toBe(true);
      });

      it("should accept password with special characters", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "P@ssw0rd!",
          confirmPassword: "P@ssw0rd!",
        });

        expect(result.success).toBe(true);
      });

      it("should accept password with multiple digits", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "Password123456",
          confirmPassword: "Password123456",
        });

        expect(result.success).toBe(true);
      });

      it("should reject empty password", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "",
          confirmPassword: "",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain("wymagane");
      });
    });

    describe("Password confirmation matching", () => {
      it("should accept matching passwords", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "Password123",
          confirmPassword: "Password123",
        });

        expect(result.success).toBe(true);
      });

      it("should reject non-matching passwords", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "Password123",
          confirmPassword: "Password456",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues.find((issue) => issue.path[0] === "confirmPassword")?.message).toContain(
          "identyczne"
        );
      });

      it("should reject empty confirmPassword when password is filled", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "Password123",
          confirmPassword: "",
        });

        expect(result.success).toBe(false);
      });

      it("should be case-sensitive", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "Password123",
          confirmPassword: "password123",
        });

        expect(result.success).toBe(false);
      });
    });

    describe("Edge cases", () => {
      it("should handle very long password", () => {
        const longPassword = "P" + "a".repeat(100) + "1";

        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: longPassword,
          confirmPassword: longPassword,
        });

        expect(result.success).toBe(true);
      });

      it("should handle unicode characters in password", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "Password123ąęśćł",
          confirmPassword: "Password123ąęśćł",
        });

        expect(result.success).toBe(true);
      });

      it("should reject null values", () => {
        const result = registerSchema.safeParse({
          email: null,
          password: null,
          confirmPassword: null,
        });

        expect(result.success).toBe(false);
      });

      it("should reject undefined values", () => {
        const result = registerSchema.safeParse({
          email: undefined,
          password: undefined,
          confirmPassword: undefined,
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe("Validation helper functions", () => {
    describe("validateLoginInput", () => {
      it("should return success result for valid input", () => {
        const result = validateLoginInput({
          email: "user@example.com",
          password: "Password123",
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          email: "user@example.com",
          password: "Password123",
        });
      });

      it("should return failure result for invalid input", () => {
        const result = validateLoginInput({
          email: "invalid",
          password: "short",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it("should return failure for empty object", () => {
        const result = validateLoginInput({});

        expect(result.success).toBe(false);
      });
    });

    describe("validateRegisterInput", () => {
      it("should return success result for valid input", () => {
        const result = validateRegisterInput({
          email: "user@example.com",
          password: "Password123",
          confirmPassword: "Password123",
        });

        expect(result.success).toBe(true);
      });

      it("should return failure result for mismatched passwords", () => {
        const result = validateRegisterInput({
          email: "user@example.com",
          password: "Password123",
          confirmPassword: "Password456",
        });

        expect(result.success).toBe(false);
      });

      it("should handle unknown input types gracefully", () => {
        const result = validateRegisterInput("not an object");

        expect(result.success).toBe(false);
      });

      it("should handle array input gracefully", () => {
        const result = validateRegisterInput(["email", "password"]);

        expect(result.success).toBe(false);
      });
    });
  });
});
