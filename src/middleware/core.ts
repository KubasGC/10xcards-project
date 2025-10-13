import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "@/db/supabase.server.ts";

/**
 * Core middleware - przypisuje Supabase server client do Astro.locals
 * Ten middleware zawsze musi być wykonywany jako pierwszy w sekwencji
 */
export const coreMiddleware = defineMiddleware((context, next) => {
  // Tworzymy server client z automatyczną obsługą cookies
  // Przekazujemy cały context, który zawiera request, cookies i response
  context.locals.supabase = createSupabaseServerClient(context);

  return next();
});
