import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EditIcon, CheckIcon, XIcon } from "lucide-react";
import type { PendingFlashcardDTO } from "@/types";

interface PendingFlashcardCardProps {
  /** Dane pojedynczego pending flashcard */
  flashcard: PendingFlashcardDTO;
  /** Callback wywoływany przy kliknięciu Edytuj */
  onEdit?: (flashcard: PendingFlashcardDTO) => void;
  /** Callback wywoływany przy kliknięciu Zaakceptuj */
  onAccept?: (flashcard: PendingFlashcardDTO) => void;
  /** Callback wywoływany przy kliknięciu Odrzuć */
  onReject?: (flashcard: PendingFlashcardDTO) => void;
  /** Czy akcje są zablokowane (np. podczas ładowania) */
  isDisabled?: boolean;
  /** Czy karta jest zaznaczona (dla masowych akcji) */
  isSelected?: boolean;
  /** Callback wywoływany przy zmianie zaznaczenia */
  onSelectionChange?: (flashcard: PendingFlashcardDTO, isSelected: boolean) => void;
  /** Czy tryb zaznaczania jest włączony */
  selectionMode?: boolean;
}

/**
 * Komponent karty pojedynczego pending flashcard
 * Wyświetla przód i tył fiszki oraz przyciski akcji
 */
export function PendingFlashcardCard({
  flashcard,
  onEdit,
  onAccept,
  onReject,
  isDisabled = false,
  isSelected = false,
  onSelectionChange,
  selectionMode = false,
}: PendingFlashcardCardProps) {
  const handleEdit = () => {
    onEdit?.(flashcard);
  };

  const handleAccept = () => {
    onAccept?.(flashcard);
  };

  const handleReject = () => {
    onReject?.(flashcard);
  };

  const handleSelectionChange = (checked: boolean) => {
    onSelectionChange?.(flashcard, checked);
  };

  return (
    <Card className={`w-full ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        {/* Checkbox dla zaznaczania (tylko w trybie zaznaczania) */}
        {selectionMode && (
          <div className="flex items-center space-x-2 mb-2">
            <Checkbox
              id={`select-${flashcard.id}`}
              checked={isSelected}
              onCheckedChange={handleSelectionChange}
              disabled={isDisabled}
            />
            <label
              htmlFor={`select-${flashcard.id}`}
              className="text-sm font-medium cursor-pointer"
            >
              Zaznacz fiszkę
            </label>
          </div>
        )}

        <div className="space-y-4">
          {/* Przód fiszki */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              Przód fiszki
            </label>
            <p className="font-medium leading-relaxed">{flashcard.front_draft}</p>
          </div>

          {/* Tył fiszki */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              Tył fiszki
            </label>
            <p className="text-muted-foreground leading-relaxed">{flashcard.back_draft}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Przyciski akcji */}
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            disabled={isDisabled}
            className="flex items-center gap-2"
          >
            <EditIcon className="h-4 w-4" />
            Edytuj
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleAccept}
            disabled={isDisabled}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckIcon className="h-4 w-4" />
            Zaakceptuj
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleReject}
            disabled={isDisabled}
            className="flex items-center gap-2"
          >
            <XIcon className="h-4 w-4" />
            Odrzuć
          </Button>
        </div>

        {/* Timestamp */}
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          Utworzono: {new Date(flashcard.created_at).toLocaleString("pl-PL")}
        </div>
      </CardContent>
    </Card>
  );
}
