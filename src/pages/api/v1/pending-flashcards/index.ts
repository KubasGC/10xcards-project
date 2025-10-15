import type { APIRoute } from "astro";
import { error401, error500 } from "@/lib/helpers/api-error.helper";
import type { PendingFlashcardListResponseDTO } from "@/types";

/**
 * GET /api/v1/pending-flashcards
 *
 * Lista wszystkich oczekujących fiszek dla zalogowanego użytkownika
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Sprawdzenie uwierzytelnienia
    if (!locals.user) {
      const response = error401("Authentication required");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pobierz wszystkie fiszki
    const { data, error } = await locals.supabase
      .from("pending_flashcards")
      .select("id, front_draft, back_draft, created_at, updated_at")
      .eq("user_id", locals.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error fetching pending flashcards:", error);
      const response = error500("Failed to fetch pending flashcards");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response: PendingFlashcardListResponseDTO = {
      data: data || [],
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in pending-flashcards GET:", error);
    const response = error500("An unexpected error occurred");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
