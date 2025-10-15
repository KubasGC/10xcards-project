import type { APIRoute } from "astro";
import { error401, error400, error500 } from "@/lib/helpers/api-error.helper";
import type { SetListResponseDTO, SetListItemDTO } from "@/types";

/**
 * GET /api/v1/sets
 *
 * Lista wszystkich zestawów fiszek dla zalogowanego użytkownika z paginacją
 */
export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    const response = error401("Authentication required");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const dataQuery = locals.supabase
      .from("sets")
      .select(
        `
        id,
        name,
        description,
        category,
        created_at,
        updated_at,
        flashcards!flashcards_set_id_fkey(count)
      `
      )
      .eq("user_id", locals.user.id);

    // Pobierz zestawy z paginacją
    const { data, error } = await dataQuery;

    if (error) {
      console.error("Database error fetching sets:", error);
      const response = error500("Failed to fetch sets");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Mapuj dane z odpowiednią liczbą fiszek
    const sets: SetListItemDTO[] = (data || []).map((set) => ({
      id: set.id,
      name: set.name,
      description: set.description,
      category: set.category,
      flashcard_count: set.flashcards?.[0]?.count || 0,
      created_at: set.created_at,
      updated_at: set.updated_at,
    }));

    const response: SetListResponseDTO = {
      data: sets,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in sets GET:", error);
    const response = error500("An unexpected error occurred");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/v1/sets
 *
 * Tworzy nowy zestaw fiszek
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
    const body = (await request.json()) as { name?: string; description?: string };

    // Walidacja
    const name = body.name?.trim();
    if (!name || name.length < 1 || name.length > 128) {
      const response = error400("Name must be between 1 and 128 characters");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const description = body.description?.trim();
    if (description && description.length > 1000) {
      const response = error400("Description must be at most 1000 characters");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Utwórz zestaw
    const { data: newSet, error: createError } = await locals.supabase
      .from("sets")
      .insert({
        user_id: locals.user.id,
        name,
        description: description || null,
        category: null,
      })
      .select("id, name, description, category, created_at, updated_at")
      .single();

    if (createError || !newSet) {
      console.error("Database error creating set:", createError);
      const response = error500("Failed to create set");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result: SetListItemDTO = {
      id: newSet.id,
      name: newSet.name,
      description: newSet.description,
      category: newSet.category,
      flashcard_count: 0,
      created_at: newSet.created_at,
      updated_at: newSet.updated_at,
    };

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in sets POST:", error);
    const response = error500("An unexpected error occurred");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
