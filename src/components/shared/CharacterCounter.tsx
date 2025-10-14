import { cn } from "@/lib/utils";

interface CharacterCounterProps {
  /** Aktualna liczba znaków */
  current: number;
  /** Maksymalna dozwolona liczba znaków */
  max: number;
  /** Minimalna wymagana liczba znaków (opcjonalna) */
  min?: number;
  /** Dodatkowe klasy CSS */
  className?: string;
}

/**
 * Komponent wyświetlający licznik znaków z obsługą stanów
 * - Normalny: liczba znaków w dozwolonym zakresie
 * - Ostrzeżenie: blisko przekroczenia limitu (>90%)
 * - Błąd: poniżej minimum lub powyżej maksimum
 */
export function CharacterCounter({ current, max, min, className }: CharacterCounterProps) {
  // Obliczanie procentowego wypełnienia
  const percentage = (current / max) * 100;

  // Określanie stanu licznika
  const isError = current > max || (min !== undefined && current < min);
  const isWarning = !isError && percentage > 90;
  const isNormal = !isError && !isWarning;

  // Klasy CSS dla różnych stanów
  const textColor = cn({
    "text-muted-foreground": isNormal,
    "text-orange-600 dark:text-orange-400": isWarning,
    "text-destructive": isError,
  });

  // Komunikat ARIA dla accessibility
  const ariaLabel = min
    ? `${current} znaków z wymaganego zakresu od ${min} do ${max}`
    : `${current} znaków z maksymalnie ${max}`;

  return (
    <div className={cn("text-sm font-medium", textColor, className)} aria-label={ariaLabel} aria-live="polite">
      <span aria-hidden="true">
        {current} / {max}
      </span>
    </div>
  );
}
