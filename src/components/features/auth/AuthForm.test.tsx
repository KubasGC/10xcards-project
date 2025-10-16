import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthForm } from "@/components/features/auth/AuthForm";

describe("AuthForm", () => {
  it("renders title correctly", () => {
    render(
      <AuthForm title="Test Title">
        <div>Test content</div>
      </AuthForm>
    );

    expect(screen.getByRole("heading", { name: "Test Title" })).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <AuthForm title="Test Title" subtitle="Test subtitle">
        <div>Test content</div>
      </AuthForm>
    );

    expect(screen.getByText("Test subtitle")).toBeInTheDocument();
  });

  it("shows error message when provided", () => {
    render(
      <AuthForm title="Test Title" error="Test error message">
        <div>Test content</div>
      </AuthForm>
    );

    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("shows loading state when isLoading is true", () => {
    render(
      <AuthForm title="Test Title" isLoading={true}>
        <div>Test content</div>
      </AuthForm>
    );

    const formContent = screen.getByText("Test content").parentElement;
    expect(formContent).toHaveClass("opacity-50", "pointer-events-none");
  });

  it("renders footer when provided", () => {
    render(
      <AuthForm title="Test Title" footer={<div>Test footer</div>}>
        <div>Test content</div>
      </AuthForm>
    );

    expect(screen.getByText("Test footer")).toBeInTheDocument();
  });
});
