import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { Database } from "@/db/database.types.ts";
import type { APIContext } from "astro";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

/**
 * Tworzy server client Supabase z automatyczną obsługą cookies
 * Używany w middleware i w Astro pages dla uwierzytelniania
 *
 * Używa nowych metod getAll/setAll zgodnie z rekomendacją @supabase/ssr
 * Wykorzystuje parseCookieHeader dla pełnej obsługi cookies
 */
export function createSupabaseServerClient(context: APIContext) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Pobierz wszystkie cookies z headera Cookie i przefiltruj tylko te z wartościami
        const cookieHeader = context.request.headers.get("Cookie") ?? "";
        const parsed = parseCookieHeader(cookieHeader);
        // Filtruj cookies bez wartości i zwracaj tylko te z defined value
        return parsed
          .filter((cookie): cookie is { name: string; value: string } => cookie.value !== undefined)
          .map((cookie) => ({ name: cookie.name, value: cookie.value }));
      },
      setAll(cookiesToSet) {
        // Ustaw wszystkie cookies w response
        cookiesToSet.forEach(({ name, value, options }) => {
          context.cookies.set(name, value, options);
        });
      },
    },
  });
}
