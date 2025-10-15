import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { CharacterCounter } from "@/components/shared/CharacterCounter";
import { Loader2Icon } from "lucide-react";
import type { PendingFlashcardDTO, UpdatePendingFlashcardCommand } from "@/types";

// Schemat walidacji dla edycji pending flashcard
const formSchema = z.object({
  frontDraft: z
    .string()
    .min(1, "Przód fiszki nie może być pusty")
    .max(200, "Przód fiszki może zawierać maksymalnie 200 znaków"),
  backDraft: z
    .string()
    .min(1, "Tył fiszki nie może być pusty")
    .max(600, "Tył fiszki może zawierać maksymalnie 600 znaków"),
});

type FormValues = z.infer<typeof formSchema>;

interface EditPendingFlashcardDialogProps {
  /** Czy modal jest otwarty */
  isOpen: boolean;
  /** Callback wywoływany przy zamknięciu modala */
  onClose: () => void;
  /** Dane fiszki do edycji */
  flashcard: PendingFlashcardDTO | null;
  /** Czy trwa zapisywanie */
  isSubmitting: boolean;
  /** Callback wywoływany przy zapisie zmian */
  onSave: (id: string, command: UpdatePendingFlashcardCommand) => void;
}

/**
 * Modal do edycji oczekującej fiszki
 * Pozwala na zmianę treści przodu i tyłu fiszki
 */
export function EditPendingFlashcardDialog({
  isOpen,
  onClose,
  flashcard,
  isSubmitting,
  onSave,
}: EditPendingFlashcardDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      frontDraft: flashcard?.front_draft || "",
      backDraft: flashcard?.back_draft || "",
    },
    mode: "onChange", // Walidacja w czasie rzeczywistym
  });

  // Aktualizuj wartości formularza gdy zmieni się flashcard
  useEffect(() => {
    if (flashcard) {
      form.reset({
        frontDraft: flashcard.front_draft,
        backDraft: flashcard.back_draft,
      });
    }
  }, [flashcard, form]);

  /**
   * Obsługa zamknięcia modala
   */
  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  /**
   * Obsługa zapisu zmian
   */
  const handleSubmit = (values: FormValues) => {
    if (!flashcard) return;

    const command: UpdatePendingFlashcardCommand = {
      front_draft: values.frontDraft.trim(),
      back_draft: values.backDraft.trim(),
    };

    onSave(flashcard.id, command);
  };

  const isFormValid = form.formState.isValid;
  const hasChanges = form.formState.isDirty;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <DialogDescription>
            Zmodyfikuj treść przodu i tyłu fiszki przed zaakceptowaniem lub odrzuceniem.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Pole: Przód fiszki */}
            <FormField
              control={form.control}
              name="frontDraft"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Przód fiszki *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Wprowadź pytanie lub termin..."
                      className="min-h-[80px] resize-y"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormMessage />
                    <CharacterCounter current={field.value.length} max={200} />
                  </div>
                </FormItem>
              )}
            />

            {/* Pole: Tył fiszki */}
            <FormField
              control={form.control}
              name="backDraft"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tył fiszki *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Wprowadź odpowiedź lub wyjaśnienie..."
                      className="min-h-[120px] resize-y"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormMessage />
                    <CharacterCounter current={field.value.length} max={600} />
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isSubmitting || !isFormValid || !hasChanges}>
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Zapisywanie...
                  </>
                ) : (
                  "Zapisz zmiany"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
