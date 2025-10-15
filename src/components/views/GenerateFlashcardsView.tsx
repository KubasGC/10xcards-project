import { useGenerateFlashcards } from "@/hooks/useGenerateFlashcards";
import { GenerationQuotaIndicator } from "@/components/features/GenerationQuotaIndicator";
import { GenerateFlashcardsForm } from "@/components/features/GenerateFlashcardsForm";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useEffect } from "react";
import type { GenerateFlashcardsCommand } from "@/types";

/**
 * Główny widok generowania fiszek z AI
 * Integruje wskaźnik limitu, formularz i obsługę błędów
 */
export default function GenerateFlashcardsView() {
  const { state, generateFlashcards, resetGenerationState, isSubmitDisabled } = useGenerateFlashcards();

  /**
   * Obsługa wysyłania formularza
   */
  const handleSubmit = async (command: GenerateFlashcardsCommand) => {
    const result = await generateFlashcards(command);

    // Jeśli generowanie zakończone sukcesem, przekieruj na stronę pending
    if (result) {
      toast.success("Fiszki zostały wygenerowane!", {
        description: `Wygenerowano ${result.candidates.length} kandydatów na fiszki`,
      });

      // Przekierowanie po krótkiej chwili (aby użytkownik zobaczył toast)
      setTimeout(() => {
        window.location.href = "/pending";
      }, 1500);
    }
  };

  /**
   * Obsługa błędów generowania - wyświetlenie toasta
   */
  useEffect(() => {
    if (state.generation.status === "error" && state.generation.error) {
      const error = state.generation.error;

      // Jeśli błąd to obiekt ErrorResponseDTO
      if (typeof error === "object" && error !== null && "statusCode" in error) {
        switch (error.statusCode) {
          case 429:
            toast.error("Limit generacji został osiągnięty", {
              description: `Nowe generacje będą dostępne ${state.quota.data?.resetsAtFormatted || "wkrótce"}`,
            });
            break;
          case 400:
            toast.error("Nieprawidłowe dane", {
              description:
                error.error.message || "Wprowadzone dane są nieprawidłowe. Sprawdź formularz i spróbuj ponownie.",
            });
            break;
          case 401:
            toast.error("Brak autoryzacji", {
              description: "Sesja wygasła. Zostaniesz przekierowany na stronę logowania.",
            });
            // Przekierowanie na stronę główną (która przekieruje na login)
            setTimeout(() => {
              window.location.href = "/";
            }, 2000);
            break;
          case 500:
          case 503:
            toast.error("Błąd serwera", {
              description: error.error.message || "Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie za chwilę.",
            });
            break;
          default:
            toast.error("Wystąpił błąd", {
              description: error.error.message || "Nie udało się wygenerować fiszek",
            });
        }
      } else {
        // Błąd sieciowy lub inny
        toast.error("Wystąpił błąd", {
          description: typeof error === "string" ? error : "Nie udało się wygenerować fiszek",
        });
      }

      // Resetuj stan generowania po wyświetleniu toasta
      resetGenerationState();
    }
  }, [state.generation.status, state.generation.error, state.quota.data?.resetsAtFormatted, resetGenerationState]);

  return (
    <>
      <div className="container max-w-4xl mx-auto pt-8 py-8 px-4">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Generuj fiszki z AI</h1>
            <p className="text-muted-foreground">
              Wklej materiał do nauki, a sztuczna inteligencja wygeneruje dla Ciebie propozycje fiszek
            </p>
          </div>

          {/* Wskaźnik limitu generacji */}
          <GenerationQuotaIndicator
            quota={state.quota.data}
            isLoading={state.quota.status === "loading"}
            error={state.quota.error}
          />

          {/* Formularz generowania */}
          <GenerateFlashcardsForm
            isSubmitting={state.generation.status === "submitting"}
            isSubmitDisabled={isSubmitDisabled}
            onSubmit={handleSubmit}
            quota={state.quota.data}
          />
        </div>
      </div>

      {/* Toast notifications */}
      <Toaster />
    </>
  );
}
