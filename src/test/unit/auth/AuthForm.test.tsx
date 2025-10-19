import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthForm } from "@/components/features/auth/AuthForm";

describe("AuthForm Component", () => {
  it("renders title and subtitle", () => {
    render(
      <AuthForm title="Zaloguj się" subtitle="Wpisz swoje dane do logowania">
        <div>Form content</div>
      </AuthForm>
    );

    expect(screen.getByRole("heading", { name: /zaloguj się/i })).toBeInTheDocument();
    expect(screen.getByText(/wpisz swoje dane do logowania/i)).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(
      <AuthForm title="Test Form">
        <div data-testid="form-content">Form content here</div>
      </AuthForm>
    );

    expect(screen.getByTestId("form-content")).toBeInTheDocument();
  });

  it("displays error message when provided", () => {
    render(
      <AuthForm title="Zaloguj się" error="Nieprawidłowe dane logowania">
        <div>Form content</div>
      </AuthForm>
    );

    expect(screen.getByText(/nieprawidłowe dane logowania/i)).toBeInTheDocument();
  });

  it("applies opacity class when loading", () => {
    const { container } = render(
      <AuthForm title="Zaloguj się" isLoading={true}>
        <button>Submit</button>
      </AuthForm>
    );

    // Find the content div that should have opacity-50 class when loading
    const contentDiv = container.querySelector(".opacity-50");
    expect(contentDiv).toBeInTheDocument();
  });

  it("renders footer content when provided", () => {
    render(
      <AuthForm
        title="Zaloguj się"
        footer={
          <div>
            Nie masz konta? <a href="/register">Zarejestruj się</a>
          </div>
        }
      >
        <div>Form content</div>
      </AuthForm>
    );

    expect(screen.getByText(/nie masz konta/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /zarejestruj się/i })).toBeInTheDocument();
  });
});
