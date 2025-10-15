import { useState, useEffect, useCallback } from "react";
import type {
  PendingFlashcardDTO,
  SetListItemDTO,
  UpdatePendingFlashcardCommand,
  AcceptPendingFlashcardCommand,
  AcceptPendingFlashcardResponseDTO,
  ErrorResponseDTO,
  PendingFlashcardListResponseDTO,
  SetListResponseDTO,
  BulkAcceptPendingFlashcardsCommand,
  BulkAcceptResponseDTO,
  BulkDeletePendingFlashcardsCommand,
  BulkDeleteResponseDTO,
} from "@/types";

interface PendingFlashcardsState {
  pendingFlashcards: PendingFlashcardDTO[];
  sets: SetListItemDTO[];
  isLoading: boolean;
  isLoadingSets: boolean;
  error: string | null;
  isSubmitting: boolean;
}

/**
 * Custom hook dla zarządzania stanem oczekujących fiszek
 * Obsługuje pobieranie, edycję, akceptację i odrzucenie oczekujących fiszek
 */
export function usePendingFlashcards() {
  const [state, setState] = useState<PendingFlashcardsState>({
    pendingFlashcards: [],
    sets: [],
    isLoading: false,
    isLoadingSets: false,
    error: null,
    isSubmitting: false,
  });

  /**
   * Pobiera listę oczekujących fiszek z API
   */
  const fetchPendingFlashcards = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("/api/v1/pending-flashcards");

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message || "Nie udało się pobrać oczekujących fiszek");
      }

      const data: PendingFlashcardListResponseDTO = await response.json();

      setState((prev) => ({
        ...prev,
        pendingFlashcards: data.data,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  }, []);

  /**
   * Pobiera listę zestawów dla modala akceptacji
   */
  const fetchSets = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoadingSets: true }));

    try {
      const response = await fetch("/api/v1/sets?per_page=100");

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message || "Nie udało się pobrać zestawów");
      }

      const data: SetListResponseDTO = await response.json();

      setState((prev) => ({
        ...prev,
        sets: data.data,
        isLoadingSets: false,
      }));
    } catch (error) {
      console.error("Error fetching sets:", error);
      setState((prev) => ({
        ...prev,
        isLoadingSets: false,
      }));
    }
  }, []);

  /**
   * Edytuje oczekującą fiszkę
   */
  const editFlashcard = useCallback(async (id: string, command: UpdatePendingFlashcardCommand) => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const response = await fetch(`/api/v1/pending-flashcards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message || "Nie udało się edytować fiszki");
      }

      const updatedFlashcard: PendingFlashcardDTO = await response.json();

      // Aktualizuj lokalny stan
      setState((prev) => ({
        ...prev,
        pendingFlashcards: prev.pendingFlashcards.map((fc) => (fc.id === id ? updatedFlashcard : fc)),
        isSubmitting: false,
      }));

      return updatedFlashcard;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isSubmitting: false,
      }));

      throw error;
    }
  }, []);

  /**
   * Akceptuje oczekującą fiszkę i przenosi ją do zestawu
   */
  const acceptFlashcard = useCallback(async (id: string, command: AcceptPendingFlashcardCommand) => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const response = await fetch(`/api/v1/pending-flashcards/${id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message || "Nie udało się zaakceptować fiszki");
      }

      const result: AcceptPendingFlashcardResponseDTO = await response.json();

      // Usuń fiszkę z listy oczekujących
      setState((prev) => ({
        ...prev,
        pendingFlashcards: prev.pendingFlashcards.filter((fc) => fc.id !== id),
        isSubmitting: false,
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isSubmitting: false,
      }));

      throw error;
    }
  }, []);

  /**
   * Odrzuca (usuwa) oczekującą fiszkę
   */
  const rejectFlashcard = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const response = await fetch(`/api/v1/pending-flashcards/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message || "Nie udało się odrzucić fiszki");
      }

      // Usuń fiszkę z listy oczekujących
      setState((prev) => ({
        ...prev,
        pendingFlashcards: prev.pendingFlashcards.filter((fc) => fc.id !== id),
        isSubmitting: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isSubmitting: false,
      }));

      throw error;
    }
  }, []);

  /**
   * Masowa akceptacja oczekujących fiszek
   */
  const bulkAcceptFlashcards = useCallback(
    async (pendingIds: string[], command: Omit<AcceptPendingFlashcardCommand, "pending_ids">) => {
      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

      try {
        const bulkCommand: BulkAcceptPendingFlashcardsCommand = {
          pending_ids: pendingIds,
          ...(command.set_id ? { set_id: command.set_id } : { new_set: command.new_set! }),
        } as BulkAcceptPendingFlashcardsCommand;

        const response = await fetch("/api/v1/pending-flashcards/bulk-accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bulkCommand),
        });

        if (!response.ok) {
          const errorData: ErrorResponseDTO = await response.json();
          throw new Error(errorData.error.message || "Nie udało się zaakceptować fiszek");
        }

        const result: BulkAcceptResponseDTO = await response.json();

        // Usuń zaakceptowane fiszki z listy oczekujących
        const acceptedIds = new Set(result.flashcards.map((fc) => pendingIds[result.flashcards.indexOf(fc)]));
        setState((prev) => ({
          ...prev,
          pendingFlashcards: prev.pendingFlashcards.filter((fc) => !pendingIds.includes(fc.id)),
          isSubmitting: false,
        }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isSubmitting: false,
        }));

        throw error;
      }
    },
    []
  );

  /**
   * Masowe odrzucenie (usunięcie) oczekujących fiszek
   */
  const bulkRejectFlashcards = useCallback(async (pendingIds: string[]) => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const command: BulkDeletePendingFlashcardsCommand = {
        pending_ids: pendingIds,
      };

      const response = await fetch("/api/v1/pending-flashcards/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message || "Nie udało się odrzucić fiszek");
      }

      const result: BulkDeleteResponseDTO = await response.json();

      // Usuń odrzucone fiszki z listy oczekujących
      setState((prev) => ({
        ...prev,
        pendingFlashcards: prev.pendingFlashcards.filter((fc) => !result.deleted_ids.includes(fc.id)),
        isSubmitting: false,
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isSubmitting: false,
      }));

      throw error;
    }
  }, []);

  /**
   * Czyści błąd
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Automatyczne pobieranie oczekujących fiszek i zestawów przy montowaniu
  useEffect(() => {
    fetchPendingFlashcards();
    fetchSets();
  }, [fetchPendingFlashcards, fetchSets]);

  return {
    state,
    fetchPendingFlashcards,
    fetchSets,
    editFlashcard,
    acceptFlashcard,
    rejectFlashcard,
    bulkAcceptFlashcards,
    bulkRejectFlashcards,
    clearError,
  };
}
