import { defineMiddleware } from "astro:middleware";

/**
 * Lista ścieżek, które nie wymagają uwierzytelnienia
 * Wszystkie inne ścieżki będą wymagały zalogowania
 */
const PUBLIC_ROUTES = ["/", "/login", "/register", "/api/v1/auth/login", "/api/v1/auth/register"];

/**
 * Auth middleware - sprawdza, czy użytkownik jest zalogowany
 * Przekierowuje niezalogowanych użytkowników na stronę główną
 * Pomija sprawdzanie dla tras zdefiniowanych w PUBLIC_ROUTES
 */
export const authMiddleware = defineMiddleware(async (context, next) => {
  try {
    const currentPath = context.url.pathname;

    // Pobierz użytkownika
    const {
      data: { user },
    } = await context.locals.supabase.auth.getUser();

    // Jeśli użytkownik nie jest zalogowany, przekieruj na stronę logowania
    if (!user && !PUBLIC_ROUTES.includes(currentPath)) {
      return Response.redirect(new URL("/login", context.url), 302);
    }

    // Użytkownik jest zalogowany, kontynuuj
    context.locals.user = user;
    return next();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // W przypadku błędu, przekieruj na stronę logowania
    return Response.redirect(new URL("/login", context.url), 302);
  }
});
