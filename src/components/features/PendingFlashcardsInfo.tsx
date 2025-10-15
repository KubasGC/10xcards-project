import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PendingFlashcardsInfoProps {
  className?: string;
}

interface PendingCountResponse {
  count: number;
}

export default function PendingFlashcardsInfo({ className }: PendingFlashcardsInfoProps) {
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/v1/pending-flashcards/count", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: PendingCountResponse = await response.json();
        setPendingCount(data.count);
      } catch (err) {
        console.error("Error fetching pending flashcards count:", err);
        setError("Nie udało się pobrać liczby oczekujących fiszek");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingCount();
  }, []);

  // Don't render if loading, error, or no pending flashcards
  if (isLoading || error || pendingCount === null || pendingCount === 0) {
    return null;
  }

  const handleReviewClick = () => {
    // Navigate to pending page
    window.location.href = "/pending";
  };

  return (
    <Card
      className={`border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50 max-w-4xl mx-auto ${className}`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-blue-900 dark:text-blue-100">Oczekujące fiszki</CardTitle>
        <CardDescription className="text-blue-700 dark:text-blue-300">
          Istnieje {pendingCount} wygenerowanych fiszek oczekujących na akceptację
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          onClick={handleReviewClick}
          variant="outline"
          className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/50"
        >
          Przejrzyj oczekujące fiszki
        </Button>
      </CardContent>
    </Card>
  );
}
