import type { APIRoute } from "astro";
import { error401, error400, error500, error404 } from "@/lib/helpers/api-error.helper";
import { z } from "zod";
import type {
  BulkAcceptPendingFlashcardsCommand,
  BulkAcceptResponseDTO,
  FlashcardDTO,
  BulkAcceptFailureDTO,
} from "@/types";

// Schemat dla body
const bulkAcceptSchema = z.union([
  z.object({
    pending_ids: z.array(z.string().uuid()).min(1).max(50),
    set_id: z.string().uuid(),
    new_set: z.undefined().optional(),
  }),
  z.object({
    pending_ids: z.array(z.string().uuid()).min(1).max(50),
    set_id: z.undefined().optional(),
    new_set: z.object({
      name: z.string().min(1).max(128),
      description: z.string().max(1000).optional(),
    }),
  }),
]);

/**
 * POST /api/v1/pending-flashcards/bulk-accept
 *
 * Masowa akceptacja oczekujących fiszek i przeniesienie ich do zestawu
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
    const body = (await request.json()) as BulkAcceptPendingFlashcardsCommand;

    // Walidacja body
    try {
      bulkAcceptSchema.parse(body);
    } catch {
      const response = error400("Invalid request body. Either set_id or new_set must be provided");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const pendingIds = body.pending_ids;

    // Pobierz wszystkie oczekujące fiszki
    const { data: pendingFlashcards, error: fetchError } = await locals.supabase
      .from("pending_flashcards")
      .select("*")
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

    // Sprawdź, czy znaleziono wszystkie fiszki
    const foundIds = new Set(pendingFlashcards?.map((f) => f.id) || []);
    const notFoundIds = pendingIds.filter((id) => !foundIds.has(id));

    if (notFoundIds.length > 0 && pendingFlashcards?.length === 0) {
      const response = error404("No pending flashcards found");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    let setId: string;
    let setName: string;

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
        .select("id, name")
        .single();

      if (createSetError || !newSet) {
        console.error("Error creating set:", createSetError);
        const response = error500("Failed to create set");
        return new Response(JSON.stringify(response.body), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      setId = newSet.id;
      setName = newSet.name;
    } else if (body.set_id) {
      // Sprawdź czy zestaw należy do użytkownika
      const { data: existingSet, error: checkSetError } = await locals.supabase
        .from("sets")
        .select("id, name")
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
      setName = existingSet.name;
    } else {
      const response = error400("Either set_id or new_set must be provided");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Przygotuj dane do masowego wstawiania fiszek
    const flashcardsToInsert = (pendingFlashcards || []).map((pf) => ({
      set_id: setId,
      user_id: locals.user.id,
      front: pf.front_draft,
      back: pf.back_draft,
    }));

    // Masowe wstawienie fiszek
    const { data: newFlashcards, error: createFlashcardsError } = await locals.supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select("id, set_id, front, back, created_at, updated_at");

    if (createFlashcardsError || !newFlashcards) {
      console.error("Error creating flashcards:", createFlashcardsError);
      const response = error500("Failed to create flashcards");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
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
      // Nie zwracaj błędu - fiszki już zostały utworzone
    }

    // Pobierz zaktualizowaną liczbę fiszek w zestawie
    const { data: setInfo } = await locals.supabase
      .from("sets")
      .select("flashcard_count")
      .eq("id", setId)
      .eq("user_id", locals.user.id)
      .single();

    const flashcardCount = setInfo?.flashcard_count || newFlashcards.length;

    // Przygotuj informacje o nieudanych akceptacjach
    const failed: BulkAcceptFailureDTO[] = notFoundIds.map((id) => ({
      pending_id: id,
      error: "Pending flashcard not found or does not belong to user",
    }));

    // Zwróć sukces
    const result: BulkAcceptResponseDTO = {
      flashcards: newFlashcards as FlashcardDTO[],
      set: {
        id: setId,
        name: setName,
        flashcard_count: flashcardCount,
      },
      accepted_count: newFlashcards.length,
      failed,
    };

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in pending-flashcards bulk-accept:", error);
    const response = error500("An unexpected error occurred");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
