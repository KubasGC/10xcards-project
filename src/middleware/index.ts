import { sequence } from "astro:middleware";
import { coreMiddleware } from "./core";
import { authMiddleware } from "./auth";

/**
 * Sekwencja middleware wykonywana dla każdego requesta
 * 1. coreMiddleware - inicjalizuje Supabase server client
 * 2. authMiddleware - sprawdza autoryzację użytkownika
 */
export const onRequest = sequence(coreMiddleware, authMiddleware);
