import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should display login form on homepage", async ({ page }) => {
    await page.goto("/");

    // Check if login form is visible
    await expect(page.getByRole("heading", { name: /zaloguj się/i })).toBeVisible();
    await expect(page.getByLabelText(/email/i)).toBeVisible();
    await expect(page.getByLabelText(/hasło/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /zaloguj się/i })).toBeVisible();
  });

  test("should switch to register form", async ({ page }) => {
    await page.goto("/");

    // Click register link
    await page.getByText(/zarejestruj się/i).click();

    // Check if register form is visible
    await expect(page.getByRole("heading", { name: /zarejestruj się/i })).toBeVisible();
    await expect(page.getByLabelText(/potwierdź hasło/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /zarejestruj się/i })).toBeVisible();
  });

  test("should validate form fields", async ({ page }) => {
    await page.goto("/");

    // Try to submit empty form
    await page.getByRole("button", { name: /zaloguj się/i }).click();

    // Check for validation messages
    await expect(page.getByText(/email jest wymagany/i)).toBeVisible();
    await expect(page.getByText(/hasło jest wymagane/i)).toBeVisible();
  });

  test("should navigate to dashboard after successful login", async ({ page }) => {
    await page.goto("/");

    // Fill login form
    await page.getByLabelText(/email/i).fill("test@example.com");
    await page.getByLabelText(/hasło/i).fill("password123");

    // Submit form
    await page.getByRole("button", { name: /zaloguj się/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });
});

test.describe("Flashcard Generation", () => {
  test("should generate flashcards from text input", async ({ page }) => {
    // Login first
    await page.goto("/");
    await page.getByLabelText(/email/i).fill("test@example.com");
    await page.getByLabelText(/hasło/i).fill("password123");
    await page.getByRole("button", { name: /zaloguj się/i }).click();

    // Navigate to generate page
    await page.goto("/generate");

    // Fill text input
    await page
      .getByLabelText(/tekst do konwersji/i)
      .fill("React is a JavaScript library for building user interfaces.");

    // Submit form
    await page.getByRole("button", { name: /generuj fiszki/i }).click();

    // Should show generated flashcards
    await expect(page.getByText(/wygenerowane fiszki/i)).toBeVisible();
  });
});
