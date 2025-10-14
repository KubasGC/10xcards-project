import { defineMiddleware } from "astro:middleware";

/**
 * Lista ścieżek, które nie wymagają uwierzytelnienia
 * Wszystkie inne ścieżki będą wymagały zalogowania
 */
const PUBLIC_ROUTES = ["/", "/login", "/register"];

/**
 * Auth middleware - sprawdza, czy użytkownik jest zalogowany
 * Przekierowuje niezalogowanych użytkowników na stronę główną
 * Pomija sprawdzanie dla tras zdefiniowanych w PUBLIC_ROUTES
 */
export const authMiddleware = defineMiddleware(async (context, next) => {
  try {
    const currentPath = context.url.pathname;

    // Jeśli ścieżka jest na liście publicznych tras, pomiń sprawdzanie
    if (PUBLIC_ROUTES.includes(currentPath)) {
      return next();
    }

    // Pobierz sesję użytkownika
    const {
      data: { session },
    } = await context.locals.supabase.auth.getSession();

    // Jeśli użytkownik nie jest zalogowany, przekieruj na stronę główną
    if (!session) {
      return Response.redirect(new URL("/", context.url), 302);
    }

    // Użytkownik jest zalogowany, kontynuuj
    return next();
  } catch (error) {
    // W przypadku błędu, przekieruj na stronę główną
    return Response.redirect(new URL("/", context.url), 302);
  }
});
