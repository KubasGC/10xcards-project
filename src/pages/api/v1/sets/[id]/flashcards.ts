import type { APIRoute } from "astro";
import { error401, error400, error500 } from "@/lib/helpers/api-error.helper";
import type { FlashcardListResponseDTO, FlashcardDTO } from "@/types";

/**
 * GET /api/v1/sets/:id/flashcards
 *
 * Pobiera listę fiszek w zestawie
 */
export const GET: APIRoute = async ({ locals, params, url }) => {
  if (!locals.user) {
    const response = error401("Authentication required");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const setId = params.id;
  if (!setId) {
    const response = error400("Set ID is required");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parametry paginacji
    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = Math.min(parseInt(url.searchParams.get("per_page") || "50"), 100);
    const offset = (page - 1) * perPage;

    // Najpierw sprawdź czy zestaw należy do użytkownika
    const { data: setData, error: setError } = await locals.supabase
      .from("sets")
      .select("id")
      .eq("id", setId)
      .eq("user_id", locals.user.id)
      .single();

    if (setError || !setData) {
      const response = error400("Set not found or access denied");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pobierz fiszki
    const { data, error, count } = await locals.supabase
      .from("flashcards")
      .select("id, set_id, front, back, created_at, updated_at", { count: "exact" })
      .eq("set_id", setId)
      .eq("user_id", locals.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + perPage - 1);

    if (error) {
      console.error("Database error fetching flashcards:", error);
      const response = error500("Failed to fetch flashcards");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const flashcards: FlashcardDTO[] = (data || []).map((card) => ({
      id: card.id,
      set_id: card.set_id,
      front: card.front,
      back: card.back,
      created_at: card.created_at,
      updated_at: card.updated_at,
    }));

    const response: FlashcardListResponseDTO = {
      data: flashcards,
      pagination: {
        page,
        per_page: perPage,
        total_items: count || 0,
        total_pages: Math.ceil((count || 0) / perPage),
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in flashcards GET:", error);
    const response = error500("An unexpected error occurred");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
