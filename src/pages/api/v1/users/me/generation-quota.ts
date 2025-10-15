import type { APIRoute } from "astro";
import { error401, error500 } from "@/lib/helpers/api-error.helper";
import type { GenerationQuotaDTO } from "@/types";

/**
 * GET /api/v1/users/me/generation-quota
 *
 * Endpoint zwracający status dziennego limitu generacji AI dla zalogowanego użytkownika
 * Pokazuje wykorzystane generacje dzisiaj, pozostałe generacje i czas resetu
 *
 * Wymaga uwierzytelnienia (middleware automatycznie sprawdza)
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Sprawdzenie uwierzytelnienia (middleware już to robi, ale dodajemy dodatkowe zabezpieczenie)
    if (!locals.user) {
      const response = error401("Authentication required");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Obliczenie zakresu czasowego dla dzisiejszych generacji (czas polski - Europe/Warsaw)
    const today = new Date();
    // Konwertuj aktualny czas na strefę czasową Polski
    const todayInPoland = new Date(today.toLocaleString("en-US", { timeZone: "Europe/Warsaw" }));
    const startOfDay = new Date(todayInPoland.getFullYear(), todayInPoland.getMonth(), todayInPoland.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // 3. Zapytanie do bazy o dzisiejsze generacje przez Supabase client
    const { count: usedToday, error } = await locals.supabase
      .from("ai_generation_analytics")
      .select("*", { count: "exact", head: true })
      .eq("user_id", locals.user.id)
      .gte("created_at", startOfDay.toISOString())
      .lt("created_at", endOfDay.toISOString());

    if (error) {
      console.error("Database error when fetching generation quota:", error);
      const response = error500("Failed to fetch generation quota");
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Obliczenie metryk limitu generacji
    const dailyLimit = 50; // Stały limit zgodnie z PRD
    const usedTodayCount = usedToday || 0;
    const remaining = Math.max(0, dailyLimit - usedTodayCount);

    // 5. Obliczenie czasu resetu (następna północ czasu polskiego)
    const tomorrowInPoland = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const resetsAt = tomorrowInPoland.toISOString();

    // 6. Tworzenie odpowiedzi zgodnej z API planem
    const quota: GenerationQuotaDTO = {
      daily_limit: dailyLimit,
      used_today: usedTodayCount,
      remaining,
      resets_at: resetsAt,
    };

    return new Response(JSON.stringify(quota), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in generation-quota endpoint:", error);
    const response = error500("An unexpected error occurred");
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
