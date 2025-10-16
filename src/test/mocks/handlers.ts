import { http, HttpResponse } from "msw";

export const handlers = [
  // Auth endpoints
  http.post("/api/v1/auth/login", () => {
    return HttpResponse.json({
      user: {
        id: "test-user-id",
        email: "test@example.com",
        created_at: "2024-01-01T00:00:00Z",
      },
      session: {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
      },
    });
  }),

  http.post("/api/v1/auth/register", () => {
    return HttpResponse.json({
      user: {
        id: "test-user-id",
        email: "test@example.com",
        created_at: "2024-01-01T00:00:00Z",
      },
      session: {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
      },
    });
  }),

  // Flashcard endpoints
  http.get("/api/v1/flashcards/pending", () => {
    return HttpResponse.json({
      flashcards: [
        {
          id: "1",
          front: "Test front",
          back: "Test back",
          status: "pending",
          created_at: "2024-01-01T00:00:00Z",
        },
      ],
    });
  }),

  http.post("/api/v1/flashcards/generate", () => {
    return HttpResponse.json({
      flashcards: [
        {
          id: "1",
          front: "Generated front",
          back: "Generated back",
          status: "pending",
          created_at: "2024-01-01T00:00:00Z",
        },
      ],
    });
  }),

  // OpenRouter API mock
  http.post("https://openrouter.ai/api/v1/chat/completions", () => {
    return HttpResponse.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              flashcards: [
                {
                  front: "Mock front",
                  back: "Mock back",
                },
              ],
            }),
          },
        },
      ],
    });
  }),
];
