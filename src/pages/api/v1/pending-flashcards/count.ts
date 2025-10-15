import type { APIRoute } from "astro";
import { error401, error500 } from "@/lib/helpers/api-error.helper";

/**
 * GET /api/v1/pending-flashcards/count
 *
 * Endpoint zwracający liczbę oczekujących fiszek dla zalogowanego użytkownika
 * Wymaga uwierzytelnienia (middleware automatycznie sprawdza)
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Sprawdzenie uwierzytelnienia (middleware już to robi, ale dodajemy dodatkowe zabezpieczenie)
    if (!locals.user) {
      const response = error401("Authentication required");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Zapytanie do bazy o liczbę oczekujących fiszek
    const { count: pendingCount, error } = await locals.supabase
      .from("pending_flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", locals.user.id);

    if (error) {
      console.error("Database error when fetching pending flashcards count:", error);
      const response = error500("Failed to fetch pending flashcards count");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Tworzenie odpowiedzi
    const response = {
      count: pendingCount || 0,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in pending-flashcards count endpoint:", error);
    const response = error500("An unexpected error occurred");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
