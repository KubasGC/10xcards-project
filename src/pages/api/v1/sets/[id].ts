import type { APIRoute } from "astro";
import { error401, error404, error400, error500 } from "@/lib/helpers/api-error.helper";
import type { SetDTO } from "@/types";

/**
 * GET /api/v1/sets/:id
 *
 * Pobiera szczegóły pojedynczego zestawu
 */
export const GET: APIRoute = async ({ locals, params }) => {
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
    const { data, error } = await locals.supabase
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
      .eq("id", setId)
      .eq("user_id", locals.user.id)
      .single();

    if (error || !data) {
      console.error("Database error fetching set:", error);
      const response = error404("Set not found");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result: SetDTO = {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      flashcard_count: data.flashcards?.[0]?.count || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in set GET:", error);
    const response = error500("An unexpected error occurred");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PATCH /api/v1/sets/:id
 *
 * Aktualizuje zestaw
 */
export const PATCH: APIRoute = async ({ locals, params, request }) => {
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
    const body = (await request.json()) as { name?: string; description?: string };

    // Walidacja - przynajmniej jedno pole musi być dostarczone
    if (!body.name && body.description === undefined) {
      const response = error400("At least one field (name or description) must be provided");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updateData: { name?: string; description?: string | null } = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (name.length < 1 || name.length > 128) {
        const response = error400("Name must be between 1 and 128 characters");
        return new Response(JSON.stringify(response.body), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }
      updateData.name = name;
    }

    if (body.description !== undefined) {
      const description = body.description?.trim();
      if (description && description.length > 1000) {
        const response = error400("Description must be at most 1000 characters");
        return new Response(JSON.stringify(response.body), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }
      updateData.description = description || null;
    }

    // Aktualizuj zestaw
    const { data: updatedSet, error: updateError } = await locals.supabase
      .from("sets")
      .update(updateData)
      .eq("id", setId)
      .eq("user_id", locals.user.id)
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
      .single();

    if (updateError || !updatedSet) {
      console.error("Database error updating set:", updateError);
      const response = error404("Set not found");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result: SetDTO = {
      id: updatedSet.id,
      name: updatedSet.name,
      description: updatedSet.description,
      category: updatedSet.category,
      flashcard_count: updatedSet.flashcards?.[0]?.count || 0,
      created_at: updatedSet.created_at,
      updated_at: updatedSet.updated_at,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in set PATCH:", error);
    const response = error500("An unexpected error occurred");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/v1/sets/:id
 *
 * Usuwa zestaw i wszystkie jego fiszki
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
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
    const { error: deleteError } = await locals.supabase
      .from("sets")
      .delete()
      .eq("id", setId)
      .eq("user_id", locals.user.id);

    if (deleteError) {
      console.error("Database error deleting set:", deleteError);
      const response = error404("Set not found");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Unexpected error in set DELETE:", error);
    const response = error500("An unexpected error occurred");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
