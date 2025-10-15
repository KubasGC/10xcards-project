import type { APIRoute } from "astro";
import { validateRegisterInput } from "@/lib/schemas/auth.schema";
import { error400, error401, error500 } from "@/lib/helpers/api-error.helper";

/**
 * POST /api/v1/auth/register
 *
 * Endpoint rejestracji użytkownika
 * Wykorzystuje Supabase Auth do utworzenia konta
 * Wyłącza potwierdzenie email dla natychmiastowego dostępu
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
    const validation = validateRegisterInput(requestBody);
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

    // Attempt to sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Wyłączamy potwierdzenie email dla natychmiastowego dostępu
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      // Handle specific Supabase auth errors
      let errorMessage = "Błąd rejestracji";
      if (error.message.includes("User already registered")) {
        errorMessage = "Użytkownik o tym adresie email już istnieje";
      } else if (error.message.includes("Password should be at least")) {
        errorMessage = "Hasło musi mieć co najmniej 8 znaków, dużą i małą literę oraz cyfrę";
      } else if (error.message.includes("Invalid email")) {
        errorMessage = "Podaj prawidłowy adres email";
      } else if (error.message.includes("Password is too weak")) {
        errorMessage = "Hasło jest zbyt słabe";
      } else if (error.message.includes("Signup is disabled")) {
        errorMessage = "Rejestracja jest tymczasowo niedostępna";
      }

      const response = error401(errorMessage);
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!data.user) {
      const response = error401("Błąd rejestracji");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Konto zostało utworzone pomyślnie",
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
    console.error("Registration error:", error);

    const response = error500("Wystąpił nieoczekiwany błąd");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
