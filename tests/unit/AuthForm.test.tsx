import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "@/components/features/auth/AuthForm";

// Mock the auth service
vi.mock("@/lib/services/auth.service", () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

describe("AuthForm", () => {
  it("renders login form by default", () => {
    render(
      <AuthForm title="Zaloguj się">
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" />
          <label htmlFor="password">Hasło</label>
          <input id="password" type="password" />
          <button>Zaloguj się</button>
        </div>
      </AuthForm>
    );

    expect(screen.getByRole("heading", { name: /zaloguj się/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zaloguj się/i })).toBeInTheDocument();
  });

  it("switches to register form when clicking register link", async () => {
    const user = userEvent.setup();
    render(
      <AuthForm title="Zaloguj się">
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" />
          <label htmlFor="password">Hasło</label>
          <input id="password" type="password" />
          <button>Zaloguj się</button>
        </div>
      </AuthForm>
    );

    const registerLink = screen.getByText(/zarejestruj się/i);
    await user.click(registerLink);

    expect(screen.getByRole("heading", { name: /zarejestruj się/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/potwierdź hasło/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zarejestruj się/i })).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(
      <AuthForm title="Zaloguj się">
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" />
          <label htmlFor="password">Hasło</label>
          <input id="password" type="password" />
          <button>Zaloguj się</button>
        </div>
      </AuthForm>
    );

    const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
    await user.click(submitButton);

    expect(screen.getByText(/email jest wymagany/i)).toBeInTheDocument();
    expect(screen.getByText(/hasło jest wymagane/i)).toBeInTheDocument();
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    render(
      <AuthForm title="Zaloguj się">
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" />
          <label htmlFor="password">Hasło</label>
          <input id="password" type="password" />
          <button>Zaloguj się</button>
        </div>
      </AuthForm>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/hasło/i);
    const submitButton = screen.getByRole("button", { name: /zaloguj się/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Form should be submitted (we'll mock the actual submission)
    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });
});
