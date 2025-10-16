import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";

// Custom render function that includes providers
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
  return render(ui, {
    // Add any providers here if needed (e.g., theme, router, etc.)
    ...options,
  });
};

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: "test-user-id",
  email: "test@example.com",
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const createMockFlashcard = (overrides = {}) => ({
  id: "test-flashcard-id",
  front: "Test front",
  back: "Test back",
  status: "pending" as const,
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const createMockFlashcardSet = (overrides = {}) => ({
  id: "test-set-id",
  name: "Test Set",
  description: "Test description",
  flashcards: [createMockFlashcard()],
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});
