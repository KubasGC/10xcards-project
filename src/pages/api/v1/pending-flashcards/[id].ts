import type { APIRoute } from "astro";
import { error401, error400, error500, error404 } from "@/lib/helpers/api-error.helper";
import type {
  PendingFlashcardDTO,
  UpdatePendingFlashcardCommand,
} from "@/types";

/**
 * PATCH /api/v1/pending-flashcards/[id]
 *
 * Edytuje oczekującą fiszkę
 */
export const PATCH: APIRoute = async ({ locals, request, params }) => {
  try {
    // Sprawdzenie uwierzytelnienia
    if (!locals.user) {
      const response = error401("Authentication required");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = params.id;
    if (!id) {
      const response = error400("Missing flashcard ID");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pobierz body
    const body = await request.json() as UpdatePendingFlashcardCommand;

    // Walidacja: co najmniej jedno pole musi być dostarczone
    if (!body.front_draft && !body.back_draft) {
      const response = error400("At least one field must be provided");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Walidacja pól
    if (body.front_draft !== undefined) {
      const trimmed = body.front_draft.trim();
      if (trimmed.length === 0 || trimmed.length > 200) {
        const response = error400("Front must be between 1 and 200 characters");
        return new Response(JSON.stringify(response.body), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (body.back_draft !== undefined) {
      const trimmed = body.back_draft.trim();
      if (trimmed.length === 0 || trimmed.length > 600) {
        const response = error400("Back must be between 1 and 600 characters");
        return new Response(JSON.stringify(response.body), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Sprawdź czy fiszka należy do użytkownika
    const { data: existing, error: fetchError } = await locals.supabase
      .from("pending_flashcards")
      .select("*")
      .eq("id", id)
      .eq("user_id", locals.user.id)
      .single();

    if (fetchError || !existing) {
      const response = error404("Pending flashcard not found");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Aktualizuj fiszkę
    const updateData: UpdatePendingFlashcardCommand = {};
    if (body.front_draft !== undefined) {
      updateData.front_draft = body.front_draft.trim();
    }
    if (body.back_draft !== undefined) {
      updateData.back_draft = body.back_draft.trim();
    }

    const { data: updated, error: updateError } = await locals.supabase
      .from("pending_flashcards")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", locals.user.id)
      .select("id, front_draft, back_draft, created_at, updated_at")
      .single();

    if (updateError || !updated) {
      console.error("Database error updating pending flashcard:", updateError);
      const response = error500("Failed to update pending flashcard");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(updated as PendingFlashcardDTO), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in pending-flashcards PATCH:", error);
    const response = error500("An unexpected error occurred");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/v1/pending-flashcards/[id]
 *
 * Usuwa (odrzuca) oczekującą fiszkę
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    // Sprawdzenie uwierzytelnienia
    if (!locals.user) {
      const response = error401("Authentication required");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = params.id;
    if (!id) {
      const response = error400("Missing flashcard ID");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sprawdź czy fiszka należy do użytkownika
    const { data: existing, error: fetchError } = await locals.supabase
      .from("pending_flashcards")
      .select("id")
      .eq("id", id)
      .eq("user_id", locals.user.id)
      .single();

    if (fetchError || !existing) {
      const response = error404("Pending flashcard not found");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Usuń fiszkę
    const { error: deleteError } = await locals.supabase
      .from("pending_flashcards")
      .delete()
      .eq("id", id)
      .eq("user_id", locals.user.id);

    if (deleteError) {
      console.error("Database error deleting pending flashcard:", deleteError);
      const response = error500("Failed to delete pending flashcard");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error("Unexpected error in pending-flashcards DELETE:", error);
    const response = error500("An unexpected error occurred");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
