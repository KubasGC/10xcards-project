import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import type { QuotaViewModel } from "@/types";

interface GenerationQuotaIndicatorProps {
  /** Dane o limicie generacji */
  quota: QuotaViewModel | null;
  /** Status ładowania danych */
  isLoading: boolean;
  /** Komunikat błędu (jeśli wystąpił) */
  error: string | null;
}

/**
 * Komponent wyświetlający informacje o dziennym limicie generacji fiszek
 * Pokazuje pasek postępu oraz szczegóły w tooltipie
 */
export function GenerationQuotaIndicator({ quota, isLoading, error }: GenerationQuotaIndicatorProps) {
  // Stan ładowania
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Dzienny limit generacji</span>
          <span className="text-sm text-muted-foreground">Ładowanie...</span>
        </div>
        <Progress value={0} className="h-2" />
      </div>
    );
  }

  // Stan błędu
  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-destructive">Błąd pobierania limitu</span>
        </div>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  // Brak danych
  if (!quota) {
    return null;
  }

  // Określenie koloru paska postępu na podstawie wykorzystania limitu
  const progressColor =
    quota.remaining === 0 ? "bg-destructive" : quota.percentage > 80 ? "bg-orange-500" : "bg-primary";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Dzienny limit generacji</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Więcej informacji o limicie"
                >
                  <InfoIcon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Pozostało:</strong> {quota.remaining} / {quota.limit}
                  </p>
                  <p>
                    <strong>Reset limitu:</strong> {quota.resetsAtFormatted}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className={`text-sm font-medium ${quota.remaining === 0 ? "text-destructive" : "text-foreground"}`}>
          {quota.remaining} / {quota.limit}
        </span>
      </div>

      {/* Pasek postępu - odwrócona logika (100% = puste, 0% = pełne) */}
      <Progress value={100 - quota.percentage} className="h-2" indicatorClassName={progressColor} />

      {/* Komunikat o wyczerpaniu limitu */}
      {quota.remaining === 0 && (
        <p className="text-sm text-destructive">
          Dzienny limit został osiągnięty. Nowe generacje będą dostępne {quota.resetsAtFormatted}.
        </p>
      )}
    </div>
  );
}
