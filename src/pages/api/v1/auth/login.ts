import type { APIRoute } from "astro";
import { validateLoginInput } from "@/lib/schemas/auth.schema";
import { error400, error401, error500 } from "@/lib/helpers/api-error.helper";

/**
 * POST /api/v1/auth/login
 *
 * Endpoint logowania użytkownika
 * Wykorzystuje Supabase Auth do uwierzytelnienia
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      const response = error400("Invalid JSON in request body");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate input data
    const validation = validateLoginInput(requestBody);
    if (!validation.success) {
      const validationErrors = validation.error?.issues || [];
      const errorDetails = validationErrors.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      const response = error400("Validation failed", errorDetails);
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, password } = validation.data;

    // Use Supabase client from locals (set by middleware)
    const supabase = locals.supabase;

    // Attempt to sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Handle specific Supabase auth errors
      let errorMessage = "Błąd logowania";
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Nieprawidłowy email lub hasło";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Email nie został potwierdzony";
      } else if (error.message.includes("Too many requests")) {
        errorMessage = "Zbyt wiele prób logowania. Spróbuj ponownie później";
      }

      const response = error401(errorMessage);
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!data.user) {
      const response = error401("Błąd logowania");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Zalogowano pomyślnie",
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Login error:", error);

    const response = error500("Wystąpił nieoczekiwany błąd");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
