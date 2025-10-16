import type { APIRoute } from "astro";
import { error401, error400, error500, error404 } from "@/lib/helpers/api-error.helper";
import { z } from "zod";
import type { AcceptPendingFlashcardCommand, AcceptPendingFlashcardResponseDTO } from "@/types";

// Schemat dla body
const acceptSchema = z.union([
  z.object({
    set_id: z.string().uuid(),
    new_set: z.undefined().optional(),
  }),
  z.object({
    set_id: z.undefined().optional(),
    new_set: z.object({
      name: z.string().min(1).max(128),
      description: z.string().max(1000).optional(),
    }),
  }),
]);

/**
 * POST /api/v1/pending-flashcards/[id]/accept
 *
 * Akceptuje oczekującą fiszkę i przenosi ją do zestawu
 */
export const POST: APIRoute = async ({ locals, request, params }) => {
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
    const body = (await request.json()) as AcceptPendingFlashcardCommand;

    // Walidacja body
    try {
      acceptSchema.parse(body);
    } catch {
      const response = error400("Either set_id or new_set must be provided");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pobierz oczekującą fiszkę
    const { data: pendingFlashcard, error: fetchError } = await locals.supabase
      .from("pending_flashcards")
      .select("*")
      .eq("id", id)
      .eq("user_id", locals.user.id)
      .single();

    if (fetchError || !pendingFlashcard) {
      const response = error404("Pending flashcard not found");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    let setId: string;

    // Jeśli new_set, utwórz nowy zestaw
    if (body.new_set) {
      const { data: newSet, error: createSetError } = await locals.supabase
        .from("sets")
        .insert({
          user_id: locals.user.id,
          name: body.new_set.name.trim(),
          description: body.new_set.description?.trim() || null,
          category: null,
        })
        .select("id")
        .single();

      if (createSetError || !newSet) {
        if (import.meta.env.DEV) {
          console.error("Error creating set:", createSetError);
        }
        const response = error500("Failed to create set");
        return new Response(JSON.stringify(response.body), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      setId = newSet.id;
    } else if (body.set_id) {
      // Sprawdź czy zestaw należy do użytkownika
      const { data: existingSet, error: checkSetError } = await locals.supabase
        .from("sets")
        .select("id")
        .eq("id", body.set_id)
        .eq("user_id", locals.user.id)
        .single();

      if (checkSetError || !existingSet) {
        const response = error404("Set not found");
        return new Response(JSON.stringify(response.body), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      setId = body.set_id;
    } else {
      const response = error400("Either set_id or new_set must be provided");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Rozpocznij transakcję: utwórz fiszkę i usuń pending
    const { data: newFlashcard, error: createFlashcardError } = await locals.supabase
      .from("flashcards")
      .insert({
        set_id: setId,
        user_id: locals.user.id,
        front: pendingFlashcard.front_draft,
        back: pendingFlashcard.back_draft,
      })
      .select("id, set_id, front, back, created_at, updated_at")
      .single();

    if (createFlashcardError || !newFlashcard) {
      if (import.meta.env.DEV) {
        console.error("Error creating flashcard:", createFlashcardError);
      }
      const response = error500("Failed to create flashcard");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Usuń pending flashcard
    const { error: deleteError } = await locals.supabase
      .from("pending_flashcards")
      .delete()
      .eq("id", id)
      .eq("user_id", locals.user.id);

    if (deleteError) {
      if (import.meta.env.DEV) {
        console.error("Error deleting pending flashcard:", deleteError);
      }
      // Nie zwracaj błędu - fiszka już została utworzona
    }

    // Pobierz informacje o zestawie
    const { data: setInfo, error: setInfoError } = await locals.supabase
      .from("sets")
      .select("id, name, flashcard_count")
      .eq("id", setId)
      .eq("user_id", locals.user.id)
      .single();

    if (setInfoError || !setInfo) {
      if (import.meta.env.DEV) {
        console.error("Error fetching set info:", setInfoError);
      }
      // Zwróć podstawowe informacje o zestawie
      const result: AcceptPendingFlashcardResponseDTO = {
        flashcard: {
          id: newFlashcard.id,
          set_id: newFlashcard.set_id,
          front: newFlashcard.front,
          back: newFlashcard.back,
          created_at: newFlashcard.created_at,
          updated_at: newFlashcard.updated_at,
        },
        set: {
          id: setId,
          name: body.new_set?.name || "Unknown",
          flashcard_count: 1,
        },
      };
      return new Response(JSON.stringify(result), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Zwróć sukces
    const result: AcceptPendingFlashcardResponseDTO = {
      flashcard: {
        id: newFlashcard.id,
        set_id: newFlashcard.set_id,
        front: newFlashcard.front,
        back: newFlashcard.back,
        created_at: newFlashcard.created_at,
        updated_at: newFlashcard.updated_at,
      },
      set: {
        id: setInfo.id,
        name: setInfo.name,
        flashcard_count: setInfo.flashcard_count,
      },
    };

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Unexpected error in pending-flashcards accept:", error);
    }
    const response = error500("An unexpected error occurred");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
