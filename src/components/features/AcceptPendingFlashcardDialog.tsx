import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CharacterCounter } from "@/components/shared/CharacterCounter";
import { Loader2Icon } from "lucide-react";
import type { PendingFlashcardDTO, SetListItemDTO, AcceptPendingFlashcardCommand } from "@/types";

// Najpierw muszę dodać radio-group do shadcn/ui
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Schemat walidacji dla tworzenia nowego zestawu
const createSetSchema = z.object({
  name: z.string().min(1, "Nazwa zestawu jest wymagana").max(128, "Nazwa może zawierać maksymalnie 128 znaków"),
  description: z.string().max(1000, "Opis może zawierać maksymalnie 1000 znaków").optional(),
});

type CreateSetFormValues = z.infer<typeof createSetSchema>;

interface AcceptPendingFlashcardDialogProps {
  /** Czy modal jest otwarty */
  isOpen: boolean;
  /** Callback wywoływany przy zamknięciu modala */
  onClose: () => void;
  /** Dane fiszki do akceptacji */
  flashcard: PendingFlashcardDTO | null;
  /** Lista dostępnych zestawów */
  sets: SetListItemDTO[];
  /** Czy trwa ładowanie zestawów */
  isLoadingSets: boolean;
  /** Czy trwa zapisywanie */
  isSubmitting: boolean;
  /** Callback wywoływany przy akceptacji fiszki */
  onAccept: (id: string, command: AcceptPendingFlashcardCommand) => void;
}

/**
 * Modal do akceptacji oczekującej fiszki
 * Pozwala wybrać istniejący zestaw lub utworzyć nowy
 */
export function AcceptPendingFlashcardDialog({
  isOpen,
  onClose,
  flashcard,
  sets,
  isLoadingSets,
  isSubmitting,
  onAccept,
}: AcceptPendingFlashcardDialogProps) {
  // Stan wyboru: "existing" lub "new"
  const [selectionMode, setSelectionMode] = useState<"existing" | "new">("existing");
  const [selectedSetId, setSelectedSetId] = useState<string>("");

  const form = useForm<CreateSetFormValues>({
    resolver: zodResolver(createSetSchema),
    defaultValues: {
      name: "",
      description: "",
    },
    mode: "onChange",
  });

  // Resetuj formularz gdy modal się otwiera
  useEffect(() => {
    if (isOpen) {
      setSelectionMode("existing");
      setSelectedSetId("");
      form.reset();
    }
  }, [isOpen, form]);

  /**
   * Obsługa zamknięcia modala
   */
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  /**
   * Obsługa zmiany trybu wyboru
   */
  const handleModeChange = (mode: "existing" | "new") => {
    setSelectionMode(mode);
    if (mode === "new") {
      setSelectedSetId("");
    }
  };

  /**
   * Obsługa akceptacji fiszki
   */
  const handleAccept = () => {
    if (!flashcard) return;

    if (selectionMode === "existing") {
      if (!selectedSetId) return;

      onAccept(flashcard.id, {
        set_id: selectedSetId,
      });
    } else {
      // Walidacja formularza nowego zestawu
      form.handleSubmit((values) => {
        onAccept(flashcard.id, {
          new_set: {
            name: values.name.trim(),
            description: values.description?.trim() || undefined,
          },
        });
      })();
    }
  };

  const canAcceptExisting = selectionMode === "existing" && selectedSetId;
  const canAcceptNew = selectionMode === "new" && form.formState.isValid;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Zaakceptuj fiszkę</DialogTitle>
          <DialogDescription>
            Wybierz istniejący zestaw lub utwórz nowy, aby dodać tę fiszkę do swojej kolekcji.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Podgląd fiszki */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-2 font-medium text-sm">Podgląd fiszki:</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Przód:</span> {flashcard?.front_draft}
              </div>
              <div>
                <span className="font-medium">Tył:</span> {flashcard?.back_draft}
              </div>
            </div>
          </div>

          {/* Wybór trybu */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Wybierz sposób dodania fiszki:</Label>

            <RadioGroup value={selectionMode} onValueChange={handleModeChange} className="space-y-4">
              {/* Istniejący zestaw */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing" className="flex-1 cursor-pointer">
                  Dodaj do istniejącego zestawu
                </Label>
              </div>

              {selectionMode === "existing" && (
                <div className="ml-6">
                  {isLoadingSets ? (
                    <div className="flex items-center space-x-2">
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Ładowanie zestawów...</span>
                    </div>
                  ) : sets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Brak dostępnych zestawów. Utwórz nowy zestaw.</p>
                  ) : (
                    <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz zestaw..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sets.map((set) => (
                          <SelectItem key={set.id} value={set.id}>
                            {set.name} ({set.flashcard_count} fiszek)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Nowy zestaw */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="flex-1 cursor-pointer">
                  Utwórz nowy zestaw
                </Label>
              </div>

              {selectionMode === "new" && (
                <div className="ml-6 space-y-4">
                  <Form {...form}>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nazwa zestawu *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="np. JavaScript Podstawy"
                              disabled={isSubmitting}
                              {...field}
                            />
                          </FormControl>
                          <div className="flex items-center justify-between">
                            <FormMessage />
                            <CharacterCounter current={field.value.length} max={128} />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Opis (opcjonalny)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Krótki opis zestawu..."
                              className="min-h-[80px] resize-y"
                              disabled={isSubmitting}
                              {...field}
                            />
                          </FormControl>
                          <div className="flex items-center justify-between">
                            <FormMessage />
                            <CharacterCounter current={field.value?.length || 0} max={1000} />
                          </div>
                        </FormItem>
                      )}
                    />
                  </Form>
                </div>
              )}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Anuluj
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isSubmitting || (!canAcceptExisting && !canAcceptNew)}
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Dodawanie...
              </>
            ) : (
              "Zaakceptuj fiszkę"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
