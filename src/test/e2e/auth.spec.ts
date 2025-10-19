import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should display login form on homepage", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check if login form is visible
    await expect(page.getByRole("navigation").getByRole("link", { name: "Zaloguj się" })).toBeVisible();

    await page.getByRole("navigation").getByRole("link", { name: "Zaloguj się" }).click();

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/hasło/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /zaloguj się/i })).toBeVisible();
  });

  test("should switch to register form", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click register link
    await page.getByRole("navigation").getByRole("link", { name: "Zarejestruj się" }).click();

    // Check if register form is visible
    await expect(page.getByRole("heading", { name: /zarejestruj się/i })).toBeVisible();
    await expect(page.getByLabel(/powtórz hasło/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /zarejestruj się/i })).toBeVisible();
  });

  test("should validate form fields", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Try to submit empty form
    await page.getByRole("button", { name: /zaloguj się/i }).click();

    // Check for validation messages
    await expect(page.getByText(/email jest wymagany/i)).toBeVisible();
    await expect(page.getByText(/hasło jest wymagane/i)).toBeVisible();
  });

  test("should navigate to dashboard after successful login", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Fill login form
    const userLogin = process.env.USER_LOGIN;
    const userPassword = process.env.USER_PASSWORD;

    if (!userLogin || !userPassword) {
      throw new Error("USER_LOGIN and USER_PASSWORD environment variables must be set");
    }

    await page.getByLabel(/email/i).fill(userLogin);
    await page.getByLabel(/hasło/i).fill(userPassword);

    // Submit form
    await page.getByRole("button", { name: /zaloguj się/i }).click();

    await page.waitForLoadState("networkidle");

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });
});

test.describe("Flashcard Generation", () => {
  test("should generate flashcards from text input", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const userLogin = process.env.USER_LOGIN;
    const userPassword = process.env.USER_PASSWORD;

    if (!userLogin || !userPassword) {
      throw new Error("USER_LOGIN and USER_PASSWORD environment variables must be set");
    }

    await page.getByLabel(/email/i).fill(userLogin);
    await page.getByLabel(/hasło/i).fill(userPassword);
    await page.getByRole("button", { name: /zaloguj się/i }).click();

    await page.waitForURL("/dashboard");

    // Navigate to generate page
    await page.goto("/generate");

    // Fill text input
    await page
      .getByLabel(/tekst do konwersji|tekst źródłowy/i)
      .fill("React is a JavaScript library for building user interfaces.");

    // Submit form
    await page.getByRole("button", { name: /generuj|generuj fiszki/i }).click();

    // Should show generated flashcards
    await expect(page.getByText(/wygenerowane fiszki|fiszki/i)).toBeVisible();
  });
});
