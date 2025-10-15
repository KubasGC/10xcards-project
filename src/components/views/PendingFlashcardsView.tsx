import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { PendingFlashcardCard } from "@/components/features/PendingFlashcardCard";
import { EditPendingFlashcardDialog } from "@/components/features/EditPendingFlashcardDialog";
import { AcceptPendingFlashcardDialog } from "@/components/features/AcceptPendingFlashcardDialog";
import { toast } from "sonner";
import type {
  PendingFlashcardDTO,
  UpdatePendingFlashcardCommand,
  SetListItemDTO,
  AcceptPendingFlashcardCommand,
} from "@/types";

/**
 * Główny widok sekcji Oczekujące
 * Wyświetla listę kandydatów na fiszki wygenerowanych przez AI
 * Umożliwia ich edycję, akceptację i odrzucenie
 */
export default function PendingFlashcardsView() {
  // Stan dla modala edycji
  const [editDialogState, setEditDialogState] = useState<{
    isOpen: boolean;
    flashcard: PendingFlashcardDTO | null;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    flashcard: null,
    isSubmitting: false,
  });

  // Stan dla modala akceptacji
  const [acceptDialogState, setAcceptDialogState] = useState<{
    isOpen: boolean;
    flashcard: PendingFlashcardDTO | null;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    flashcard: null,
    isSubmitting: false,
  });

  // Stan dla zaznaczania fiszek (masowe akcje)
  const [selectedFlashcards, setSelectedFlashcards] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  // Mockowane zestawy - później zastąpione prawdziwymi danymi z API
  const mockSets: SetListItemDTO[] = [
    {
      id: "set-1",
      name: "JavaScript Podstawy",
      description: "Podstawowe koncepcje języka JavaScript",
      category: "Programowanie",
      flashcard_count: 25,
      created_at: "2025-01-10T10:00:00Z",
      updated_at: "2025-01-14T15:30:00Z",
    },
    {
      id: "set-2",
      name: "React Hooks",
      description: "Zaawansowane hooki w React",
      category: "Programowanie",
      flashcard_count: 15,
      created_at: "2025-01-12T14:00:00Z",
      updated_at: "2025-01-13T09:15:00Z",
    },
  ];

  // Mockowane dane - później zastąpione prawdziwymi danymi z API
  const [mockPendingFlashcards, setMockPendingFlashcards] = useState<PendingFlashcardDTO[]>([
    {
      id: "mock-1",
      front_draft: "Co to jest JavaScript?",
      back_draft:
        "JavaScript to język programowania używany głównie do tworzenia interaktywnych stron internetowych. Jest to język wysokiego poziomu, dynamiczny i interpretowany.",
      created_at: "2025-01-15T10:30:00Z",
      updated_at: "2025-01-15T10:30:00Z",
    },
    {
      id: "mock-2",
      front_draft: "Jakie są podstawowe typy danych w JavaScript?",
      back_draft:
        "Podstawowe typy danych to: string (tekst), number (liczba), boolean (prawda/fałsz), undefined, null, object i symbol.",
      created_at: "2025-01-15T10:31:00Z",
      updated_at: "2025-01-15T10:31:00Z",
    },
    {
      id: "mock-3",
      front_draft: "Czym różni się var od let w JavaScript?",
      back_draft:
        "var ma zasięg funkcyjny, let ma zasięg blokowy. let zapobiega problemom z hoistingu i umożliwia deklarowanie zmiennych w blokach.",
      created_at: "2025-01-15T10:32:00Z",
      updated_at: "2025-01-15T10:32:00Z",
    },
  ]);

  /**
   * Obsługa edycji fiszki - otwiera modal edycji
   */
  const handleEditFlashcard = (flashcard: PendingFlashcardDTO) => {
    setEditDialogState({
      isOpen: true,
      flashcard,
      isSubmitting: false,
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
    setEditDialogState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      // Mock API call - później zastąpione prawdziwym wywołaniem API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Aktualizuj lokalny stan
      setMockPendingFlashcards((prev) =>
        prev.map((card) =>
          card.id === id
            ? {
                ...card,
                front_draft: command.front_draft || card.front_draft,
                back_draft: command.back_draft || card.back_draft,
                updated_at: new Date().toISOString(),
              }
            : card
        )
      );

      toast.success("Fiszka została zaktualizowana!", {
        description: "Zmiany zostały zapisane.",
      });

      handleCloseEditDialog();
    } catch (error) {
      toast.error("Błąd zapisywania", {
        description: "Nie udało się zapisać zmian. Spróbuj ponownie.",
      });
    } finally {
      setEditDialogState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  /**
   * Obsługa akceptacji fiszki - otwiera modal akceptacji
   */
  const handleAcceptFlashcard = (flashcard: PendingFlashcardDTO) => {
    setAcceptDialogState({
      isOpen: true,
      flashcard,
      isSubmitting: false,
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
    setAcceptDialogState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      // Mock API call - później zastąpione prawdziwym wywołaniem API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Usuń fiszkę z listy oczekujących (symulacja przeniesienia)
      setMockPendingFlashcards((prev) => prev.filter((card) => card.id !== id));

      toast.success("Fiszka została zaakceptowana!", {
        description: "Fiszka została dodana do wybranego zestawu.",
      });

      handleCloseAcceptDialog();
    } catch (error) {
      toast.error("Błąd akceptacji", {
        description: "Nie udało się zaakceptować fiszki. Spróbuj ponownie.",
      });
    } finally {
      setAcceptDialogState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  /**
   * Obsługa odrzucenia fiszki - potwierdza i usuwa fiszkę
   */
  const handleRejectFlashcard = (flashcard: PendingFlashcardDTO) => {
    // Proste potwierdzenie (później można dodać AlertDialog z shadcn/ui)
    if (window.confirm("Czy na pewno chcesz odrzucić tę fiszkę? Ta akcja jest nieodwracalna.")) {
      // Usuń fiszkę z listy oczekujących
      setMockPendingFlashcards((prev) => prev.filter((card) => card.id !== flashcard.id));

      toast.success("Fiszka została odrzucona", {
        description: "Fiszka została trwale usunięta.",
      });
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
    setSelectedFlashcards(new Set()); // Wyczyść zaznaczenia przy przełączaniu
  };

  /**
   * Zaznaczenie/odznaczenie wszystkich fiszek
   */
  const toggleSelectAll = () => {
    if (selectedFlashcards.size === mockPendingFlashcards.length) {
      setSelectedFlashcards(new Set());
    } else {
      setSelectedFlashcards(new Set(mockPendingFlashcards.map((card) => card.id)));
    }
  };

  /**
   * Masowa akceptacja zaznaczonych fiszek
   */
  const handleBulkAccept = () => {
    if (selectedFlashcards.size === 0) return;

    // Otwórz modal akceptacji dla pierwszej zaznaczonej fiszki
    // W pełnej implementacji trzeba będzie obsłużyć wybór zestawu dla wszystkich zaznaczonych
    const firstSelectedId = Array.from(selectedFlashcards)[0];
    const firstSelectedCard = mockPendingFlashcards.find((card) => card.id === firstSelectedId);

    if (firstSelectedCard) {
      setAcceptDialogState({
        isOpen: true,
        flashcard: firstSelectedCard,
        isSubmitting: false,
      });
    }
  };

  /**
   * Masowe odrzucenie zaznaczonych fiszek
   */
  const handleBulkReject = () => {
    if (selectedFlashcards.size === 0) return;

    const count = selectedFlashcards.size;
    if (window.confirm(`Czy na pewno chcesz odrzucić ${count} zaznaczonych fiszek? Ta akcja jest nieodwracalna.`)) {
      // Usuń zaznaczone fiszki z listy
      setMockPendingFlashcards((prev) => prev.filter((card) => !selectedFlashcards.has(card.id)));

      toast.success(`${count} fiszek zostało odrzuconych`, {
        description: "Fiszki zostały trwale usunięte.",
      });

      setSelectedFlashcards(new Set());
      setSelectionMode(false);
    }
  };

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

          {/* Licznik oczekujących fiszek i kontrolki zaznaczania */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">{mockPendingFlashcards.length} oczekujących fiszek</p>

              {mockPendingFlashcards.length > 0 && (
                <button onClick={toggleSelectionMode} className="text-sm text-primary hover:underline">
                  {selectionMode ? "Anuluj zaznaczanie" : "Zaznacz wiele"}
                </button>
              )}
            </div>

            {selectionMode && mockPendingFlashcards.length > 0 && (
              <div className="flex items-center gap-4">
                <button onClick={toggleSelectAll} className="text-sm text-muted-foreground hover:text-foreground">
                  {selectedFlashcards.size === mockPendingFlashcards.length ? "Odznacz wszystkie" : "Zaznacz wszystkie"}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleBulkAccept}
                    disabled={selectedFlashcards.size === 0}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Zaakceptuj ({selectedFlashcards.size})
                  </button>
                  <button
                    onClick={handleBulkReject}
                    disabled={selectedFlashcards.size === 0}
                    className="px-3 py-1 text-sm bg-destructive text-destructive-foreground text-white rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Odrzuć ({selectedFlashcards.size})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lista oczekujących fiszek */}
          {mockPendingFlashcards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Brak oczekujących fiszek. Wygeneruj nowe fiszki, aby zobaczyć je tutaj.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mockPendingFlashcards.map((flashcard) => (
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
        isSubmitting={editDialogState.isSubmitting}
        onSave={handleSaveEditFlashcard}
      />

      {/* Modal akceptacji fiszki */}
      <AcceptPendingFlashcardDialog
        isOpen={acceptDialogState.isOpen}
        onClose={handleCloseAcceptDialog}
        flashcard={acceptDialogState.flashcard}
        sets={mockSets}
        isLoadingSets={false}
        isSubmitting={acceptDialogState.isSubmitting}
        onAccept={handleAcceptFlashcardSubmit}
      />

      {/* Toast notifications */}
      <Toaster />
    </>
  );
}
