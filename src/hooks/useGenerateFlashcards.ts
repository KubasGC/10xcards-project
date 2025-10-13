import { useState, useEffect, useCallback } from "react";
import type {
  GenerateFlashcardsCommand,
  GenerateFlashcardsResponseDTO,
  GenerationQuotaDTO,
  ErrorResponseDTO,
  QuotaViewModel,
  GenerateFlashcardsStateVM,
} from "@/types";

/**
 * Custom hook zarządzający stanem widoku generowania fiszek
 * Obsługuje pobieranie limitu generacji oraz wysyłanie żądań generowania
 */
export function useGenerateFlashcards() {
  // Stan agregujący cały widok
  const [state, setState] = useState<GenerateFlashcardsStateVM>({
    quota: {
      data: null,
      status: "idle",
      error: null,
    },
    generation: {
      status: "idle",
      error: null,
    },
  });

  /**
   * Transformuje GenerationQuotaDTO na QuotaViewModel
   * Oblicza procentowe wykorzystanie i formatuje datę resetu
   */
  const transformQuotaDTO = useCallback((dto: GenerationQuotaDTO): QuotaViewModel => {
    const percentage = (dto.used_today / dto.daily_limit) * 100;
    const resetsAt = new Date(dto.resets_at);
    const resetsAtFormatted = resetsAt.toLocaleString("pl-PL", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      remaining: dto.remaining,
      limit: dto.daily_limit,
      percentage,
      resetsAtFormatted,
    };
  }, []);

  /**
   * Pobiera dane o limicie generacji z API
   */
  const fetchQuota = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      quota: { ...prev.quota, status: "loading", error: null },
    }));

    try {
      const response = await fetch("/api/v1/users/me/generation-quota");

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message || "Nie udało się pobrać limitu");
      }

      const data: GenerationQuotaDTO = await response.json();
      const quotaVM = transformQuotaDTO(data);

      setState((prev) => ({
        ...prev,
        quota: {
          data: quotaVM,
          status: "idle",
          error: null,
        },
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";

      setState((prev) => ({
        ...prev,
        quota: {
          ...prev.quota,
          status: "error",
          error: errorMessage,
        },
      }));
    }
  }, [transformQuotaDTO]);

  /**
   * Wysyła żądanie generowania fiszek
   * Po sukcesie zwraca response do przekierowania
   */
  const generateFlashcards = useCallback(
    async (command: GenerateFlashcardsCommand): Promise<GenerateFlashcardsResponseDTO | null> => {
      setState((prev) => ({
        ...prev,
        generation: { status: "submitting", error: null },
      }));

      try {
        const response = await fetch("/api/v1/flashcards/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          // Parsuj błąd z API i dodaj HTTP status code
          const errorData: ErrorResponseDTO = await response.json();
          const errorWithStatus = {
            ...errorData,
            statusCode: response.status,
          };

          setState((prev) => ({
            ...prev,
            generation: {
              status: "error",
              error: errorWithStatus,
            },
          }));

          return null;
        }

        const data: GenerateFlashcardsResponseDTO = await response.json();

        // Sukces - aktualizuj stan
        setState((prev) => ({
          ...prev,
          generation: {
            status: "success",
            error: null,
          },
          // Aktualizuj limit po udanym generowaniu
          quota: {
            ...prev.quota,
            data: prev.quota.data
              ? {
                  ...prev.quota.data,
                  remaining: data.quota_remaining,
                  percentage: ((prev.quota.data.limit - data.quota_remaining) / prev.quota.data.limit) * 100,
                }
              : null,
          },
        }));

        return data;
      } catch (error) {
        // Błąd sieciowy lub parsowania
        const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd";

        setState((prev) => ({
          ...prev,
          generation: {
            status: "error",
            error: errorMessage,
          },
        }));

        return null;
      }
    },
    []
  );

  /**
   * Resetuje stan generowania (np. po zamknięciu toasta z błędem)
   */
  const resetGenerationState = useCallback(() => {
    setState((prev) => ({
      ...prev,
      generation: {
        status: "idle",
        error: null,
      },
    }));
  }, []);

  // Automatyczne pobieranie limitu przy montowaniu komponentu
  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  // Wartości pochodne dla wygody użycia w komponentach
  const isSubmitDisabled =
    state.quota.status === "loading" || state.quota.status === "error" || state.quota.data?.remaining === 0;

  return {
    state,
    generateFlashcards,
    resetGenerationState,
    isSubmitDisabled,
  };
}
