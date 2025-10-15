import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { PendingFlashcardCard } from "@/components/features/PendingFlashcardCard";
import { EditPendingFlashcardDialog } from "@/components/features/EditPendingFlashcardDialog";
import { AcceptPendingFlashcardDialog } from "@/components/features/AcceptPendingFlashcardDialog";
import { toast } from "sonner";
import { usePendingFlashcards } from "@/hooks/usePendingFlashcards";
import { Loader2Icon } from "lucide-react";
import type { PendingFlashcardDTO, UpdatePendingFlashcardCommand, AcceptPendingFlashcardCommand } from "@/types";

/**
 * Główny widok sekcji Oczekujące
 * Wyświetla listę kandydatów na fiszki wygenerowanych przez AI
 * Umożliwia ich edycję, akceptację i odrzucenie
 */
export default function PendingFlashcardsView() {
  // Użyj hooka do zarządzania stanem i API
  const {
    state,
    editFlashcard,
    acceptFlashcard,
    rejectFlashcard,
    bulkAcceptFlashcards,
    bulkRejectFlashcards,
    clearError,
    fetchPendingFlashcards,
    fetchSets,
  } = usePendingFlashcards();

  // Stan dla modala edycji
  const [editDialogState, setEditDialogState] = useState<{
    isOpen: boolean;
    flashcard: PendingFlashcardDTO | null;
  }>({
    isOpen: false,
    flashcard: null,
  });

  // Stan dla modala akceptacji
  const [acceptDialogState, setAcceptDialogState] = useState<{
    isOpen: boolean;
    flashcard: PendingFlashcardDTO | null;
    isBulkMode: boolean;
  }>({
    isOpen: false,
    flashcard: null,
    isBulkMode: false,
  });

  // Stan dla zaznaczania fiszek (masowe akcje)
  const [selectedFlashcards, setSelectedFlashcards] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  /**
   * Obsługa edycji fiszki - otwiera modal edycji
   */
  const handleEditFlashcard = (flashcard: PendingFlashcardDTO) => {
    setEditDialogState({
      isOpen: true,
      flashcard,
    });
  };

  /**
   * Zamknięcie modala edycji
   */
  const handleCloseEditDialog = () => {
    setEditDialogState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  /**
   * Zapisanie zmian w edycji fiszki
   */
  const handleSaveEditFlashcard = async (id: string, command: UpdatePendingFlashcardCommand) => {
    try {
      await editFlashcard(id, command);
      toast.success("Fiszka została zaktualizowana!", {
        description: "Zmiany zostały zapisane.",
      });
      handleCloseEditDialog();
    } catch {
      toast.error("Błąd zapisywania", {
        description: "Nie udało się zapisać zmian. Spróbuj ponownie.",
      });
    }
  };

  /**
   * Obsługa akceptacji fiszki - otwiera modal akceptacji
   */
  const handleAcceptFlashcard = (flashcard: PendingFlashcardDTO) => {
    setAcceptDialogState({
      isOpen: true,
      flashcard,
      isBulkMode: false,
    });
  };

  /**
   * Zamknięcie modala akceptacji
   */
  const handleCloseAcceptDialog = () => {
    setAcceptDialogState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  /**
   * Akceptacja fiszki - przeniesienie do zestawu
   */
  const handleAcceptFlashcardSubmit = async (id: string, command: AcceptPendingFlashcardCommand) => {
    try {
      // Jeśli jesteśmy w trybie bulk, akceptuj wszystkie zaznaczone fiszki jednym requestem
      if (acceptDialogState.isBulkMode) {
        const flashcardsToAccept = Array.from(selectedFlashcards);
        const result = await bulkAcceptFlashcards(flashcardsToAccept, command);

        toast.success(`${result.accepted_count} fiszek zostało zaakceptowanych!`, {
          description: `Fiszki zostały dodane do zestawu "${result.set.name}".`,
        });

        // Ponownie pobierz dane po bulk accept
        await fetchSets();

        setSelectedFlashcards(new Set());
        setSelectionMode(false);
      } else {
        // Tryb pojedynczej akceptacji
        await acceptFlashcard(id, command);
        toast.success("Fiszka została zaakceptowana!", {
          description: "Fiszka została dodana do wybranego zestawu.",
        });

        // Ponownie pobierz dane po pojedynczej akceptacji
        await fetchSets();
      }

      handleCloseAcceptDialog();
    } catch {
      toast.error("Błąd akceptacji", {
        description: "Nie udało się zaakceptować fiszki. Spróbuj ponownie.",
      });
    }
  };

  /**
   * Obsługa odrzucenia fiszki - potwierdza i usuwa fiszkę
   */
  const handleRejectFlashcard = (flashcard: PendingFlashcardDTO) => {
    if (window.confirm("Czy na pewno chcesz odrzucić tę fiszkę? Ta akcja jest nieodwracalna.")) {
      rejectFlashcard(flashcard.id).then(
        () => {
          toast.success("Fiszka została odrzucona", {
            description: "Fiszka została trwale usunięta.",
          });
        },
        () => {
          toast.error("Błąd odrzucenia", {
            description: "Nie udało się odrzucić fiszki. Spróbuj ponownie.",
          });
        }
      );
    }
  };

  /**
   * Obsługa zaznaczania/odznaczania fiszki
   */
  const handleFlashcardSelection = (flashcard: PendingFlashcardDTO, isSelected: boolean) => {
    setSelectedFlashcards((prev) => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(flashcard.id);
      } else {
        newSet.delete(flashcard.id);
      }
      return newSet;
    });
  };

  /**
   * Włączenie/wyłączenie trybu zaznaczania
   */
  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedFlashcards(new Set());
  };

  /**
   * Zaznaczenie/odznaczenie wszystkich fiszek
   */
  const toggleSelectAll = () => {
    if (selectedFlashcards.size === (state.pendingFlashcards?.length ?? 0)) {
      setSelectedFlashcards(new Set());
    } else {
      setSelectedFlashcards(new Set(state.pendingFlashcards?.map((card) => card.id) ?? []));
    }
  };

  /**
   * Masowa akceptacja zaznaczonych fiszek
   */
  const handleBulkAccept = () => {
    if (selectedFlashcards.size === 0) return;

    const firstSelectedId = Array.from(selectedFlashcards)[0];
    const firstSelectedCard = state.pendingFlashcards?.find((card) => card.id === firstSelectedId);

    if (firstSelectedCard) {
      setAcceptDialogState({
        isOpen: true,
        flashcard: firstSelectedCard,
        isBulkMode: true,
      });
    }
  };

  /**
   * Masowe odrzucenie zaznaczonych fiszek
   */
  const handleBulkReject = async () => {
    if (selectedFlashcards.size === 0) return;

    const count = selectedFlashcards.size;
    if (window.confirm(`Czy na pewno chcesz odrzucić ${count} zaznaczonych fiszek? Ta akcja jest nieodwracalna.`)) {
      try {
        const flashcardsToReject = Array.from(selectedFlashcards);
        const result = await bulkRejectFlashcards(flashcardsToReject);

        toast.success(`${result.deleted_count} fiszek zostało odrzuconych`, {
          description: "Fiszki zostały trwale usunięte.",
        });

        setSelectedFlashcards(new Set());
        setSelectionMode(false);
      } catch {
        toast.error("Błąd odrzucenia", {
          description: "Nie udało się odrzucić fiszek. Spróbuj ponownie.",
        });
      }
    }
  };

  // Renderuj loading state
  if (state.isLoading) {
    return (
      <div className="container max-w-4xl mx-auto pt-20 py-8 px-4">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Wczytywanie oczekujących fiszek...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container max-w-4xl mx-auto pt-20 py-8 px-4">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Oczekujące fiszki</h1>
            <p className="text-muted-foreground">
              Przejrzyj, edytuj i zaakceptuj fiszki wygenerowane przez sztuczną inteligencję
            </p>
          </div>

          {/* Błąd */}
          {state.error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 flex justify-between items-center">
              <p className="text-sm text-destructive">{state.error}</p>
              <button onClick={clearError} className="text-sm text-destructive hover:underline">
                Zamknij
              </button>
            </div>
          )}

          {/* Licznik oczekujących fiszek i kontrolki zaznaczania */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {state.pendingFlashcards?.length ?? 0} oczekujących fiszek
              </p>

              {state?.pendingFlashcards?.length > 0 && (
                <button onClick={toggleSelectionMode} className="text-sm text-primary hover:underline">
                  {selectionMode ? "Anuluj zaznaczanie" : "Zaznacz wiele"}
                </button>
              )}
            </div>

            {selectionMode && (state.pendingFlashcards?.length ?? 0) > 0 && (
              <div className="flex items-center gap-4">
                <button onClick={toggleSelectAll} className="text-sm text-muted-foreground hover:text-foreground">
                  {selectedFlashcards.size === (state.pendingFlashcards?.length ?? 0)
                    ? "Odznacz wszystkie"
                    : "Zaznacz wszystkie"}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleBulkAccept}
                    disabled={selectedFlashcards.size === 0 || state.isSubmitting}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Zaakceptuj ({selectedFlashcards.size})
                  </button>
                  <button
                    onClick={handleBulkReject}
                    disabled={selectedFlashcards.size === 0 || state.isSubmitting}
                    className="px-3 py-1 text-sm bg-destructive text-destructive-foreground text-white rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Odrzuć ({selectedFlashcards.size})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lista oczekujących fiszek */}
          {(state.pendingFlashcards?.length ?? 0) === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Brak oczekujących fiszek. Wygeneruj nowe fiszki, aby zobaczyć je tutaj.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {state.pendingFlashcards?.map((flashcard) => (
                <PendingFlashcardCard
                  key={flashcard.id}
                  flashcard={flashcard}
                  onEdit={handleEditFlashcard}
                  onAccept={handleAcceptFlashcard}
                  onReject={handleRejectFlashcard}
                  isSelected={selectedFlashcards.has(flashcard.id)}
                  onSelectionChange={handleFlashcardSelection}
                  selectionMode={selectionMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal edycji fiszki */}
      <EditPendingFlashcardDialog
        isOpen={editDialogState.isOpen}
        onClose={handleCloseEditDialog}
        flashcard={editDialogState.flashcard}
        isSubmitting={state.isSubmitting}
        onSave={handleSaveEditFlashcard}
      />

      {/* Modal akceptacji fiszki */}
      <AcceptPendingFlashcardDialog
        isOpen={acceptDialogState.isOpen}
        onClose={handleCloseAcceptDialog}
        flashcard={acceptDialogState.flashcard}
        sets={state.sets}
        isLoadingSets={state.isLoadingSets}
        isSubmitting={state.isSubmitting}
        onAccept={handleAcceptFlashcardSubmit}
        isBulkMode={acceptDialogState.isBulkMode}
        bulkCount={acceptDialogState.isBulkMode ? selectedFlashcards.size : undefined}
      />

      {/* Toast notifications */}
      <Toaster />
    </>
  );
}
