import type { APIRoute } from "astro";
import { error500 } from "@/lib/helpers/api-error.helper";

/**
 * POST /api/v1/auth/logout
 *
 * Endpoint wylogowania użytkownika
 * Wykorzystuje Supabase Auth do unieważnienia sesji
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    // Use Supabase client from locals (set by middleware)
    const supabase = locals.supabase;

    // Attempt to sign out user
    const { error } = await supabase.auth.signOut();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", error);

      const response = error500("Błąd podczas wylogowania");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Wylogowano pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Logout error:", error);

    const response = error500("Wystąpił nieoczekiwany błąd");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
