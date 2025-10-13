import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CharacterCounter } from "@/components/shared/CharacterCounter";
import { Loader2Icon } from "lucide-react";
import type { GenerateFlashcardsCommand, QuotaViewModel } from "@/types";

// Schemat walidacji zgodny z GenerateFlashcardsCommand
const formSchema = z.object({
  sourceText: z
    .string()
    .min(1000, "Tekst źródłowy musi zawierać co najmniej 1000 znaków")
    .max(20000, "Tekst źródłowy może zawierać maksymalnie 20000 znaków"),
  hint: z.string().max(500, "Wskazówka może zawierać maksymalnie 500 znaków").optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface GenerateFlashcardsFormProps {
  /** Czy formularz jest w trakcie wysyłania */
  isSubmitting: boolean;
  /** Czy przycisk wysyłania jest zablokowany */
  isSubmitDisabled: boolean;
  /** Callback wywoływany po poprawnej walidacji i wysłaniu formularza */
  onSubmit: (data: GenerateFlashcardsCommand) => void;
  /** Dane o limicie generacji (dla warunkowego blokowania formularza) */
  quota: QuotaViewModel | null;
}

/**
 * Formularz do generowania fiszek z AI
 * Zawiera walidację w czasie rzeczywistym i liczniki znaków
 */
export function GenerateFlashcardsForm({
  isSubmitting,
  isSubmitDisabled,
  onSubmit,
  quota,
}: GenerateFlashcardsFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceText: "",
      hint: "",
    },
    mode: "onChange", // Walidacja w czasie rzeczywistym
  });

  // Sprawdzenie, czy formularz jest całkowicie zablokowany (brak limitu)
  const isQuotaExhausted = quota?.remaining === 0;
  const isFormDisabled = isSubmitting || isSubmitDisabled || isQuotaExhausted;

  // Handler wysyłania formularza
  const handleSubmit = (values: FormValues) => {
    // Przekształcenie na GenerateFlashcardsCommand (snake_case dla API)
    const command: GenerateFlashcardsCommand = {
      source_text: values.sourceText,
      hint: values.hint && values.hint.trim() !== "" ? values.hint : undefined,
    };
    onSubmit(command);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Pole: Tekst źródłowy */}
        <FormField
          control={form.control}
          name="sourceText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tekst źródłowy *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki (minimum 1000 znaków)..."
                  className="min-h-[200px] resize-y"
                  disabled={isFormDisabled}
                  {...field}
                />
              </FormControl>
              <div className="flex items-center justify-between">
                <FormDescription>Wprowadź tekst zawierający materiał do nauki</FormDescription>
                <CharacterCounter current={field.value.length} max={20000} min={1000} />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pole: Wskazówka */}
        <FormField
          control={form.control}
          name="hint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wskazówka (opcjonalna)</FormLabel>
              <FormControl>
                <Input
                  placeholder="np. Skup się na definicjach i kluczowych pojęciach"
                  disabled={isFormDisabled}
                  {...field}
                />
              </FormControl>
              <div className="flex items-center justify-between">
                <FormDescription>Dodaj wskazówkę dla AI, jak generować fiszki</FormDescription>
                <CharacterCounter current={field.value?.length || 0} max={500} />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Komunikat o wyczerpaniu limitu */}
        {isQuotaExhausted && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm text-destructive">
              Osiągnięto dzienny limit generacji. Spróbuj ponownie po resecie limitu.
            </p>
          </div>
        )}

        {/* Przycisk wysyłania */}
        <Button type="submit" disabled={isFormDisabled || !form.formState.isValid} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Generowanie...
            </>
          ) : (
            "Generuj fiszki"
          )}
        </Button>
      </form>
    </Form>
  );
}
