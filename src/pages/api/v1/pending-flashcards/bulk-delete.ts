import type { APIRoute } from "astro";
import { error401, error400, error500 } from "@/lib/helpers/api-error.helper";
import { z } from "zod";
import type { BulkDeletePendingFlashcardsCommand, BulkDeleteResponseDTO } from "@/types";

// Schemat dla body
const bulkDeleteSchema = z.object({
  pending_ids: z.array(z.string().uuid()).min(1).max(50),
});

/**
 * POST /api/v1/pending-flashcards/bulk-delete
 *
 * Masowe usunięcie oczekujących fiszek
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Sprawdzenie uwierzytelnienia
    if (!locals.user) {
      const response = error401("Authentication required");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pobierz body
    const body = (await request.json()) as BulkDeletePendingFlashcardsCommand;

    // Walidacja body
    try {
      bulkDeleteSchema.parse(body);
    } catch {
      const response = error400("Invalid request body. pending_ids must be an array of 1-50 UUIDs");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const pendingIds = body.pending_ids;

    // Najpierw pobierz fiszki, które rzeczywiście należą do użytkownika
    const { data: pendingFlashcards, error: fetchError } = await locals.supabase
      .from("pending_flashcards")
      .select("id")
      .in("id", pendingIds)
      .eq("user_id", locals.user.id);

    if (fetchError) {
      console.error("Error fetching pending flashcards:", fetchError);
      const response = error500("Failed to fetch pending flashcards");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const foundIds = (pendingFlashcards || []).map((f) => f.id);

    // Jeśli nie znaleziono żadnych fiszek, zwróć sukces z 0 usuniętych
    if (foundIds.length === 0) {
      const result: BulkDeleteResponseDTO = {
        deleted_count: 0,
        deleted_ids: [],
      };

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Masowe usunięcie pending flashcards
    const { error: deleteError } = await locals.supabase
      .from("pending_flashcards")
      .delete()
      .in("id", foundIds)
      .eq("user_id", locals.user.id);

    if (deleteError) {
      console.error("Error deleting pending flashcards:", deleteError);
      const response = error500("Failed to delete pending flashcards");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Zwróć sukces
    const result: BulkDeleteResponseDTO = {
      deleted_count: foundIds.length,
      deleted_ids: foundIds,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in pending-flashcards bulk-delete:", error);
    const response = error500("An unexpected error occurred");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
