import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ============================================================================
// ENTITY TYPES - Typy bazodanowe
// ============================================================================

/**
 * Typ reprezentujący kompletny zestaw fiszek z bazy danych
 */
export type SetEntity = Tables<"sets">;

/**
 * Typ reprezentujący kompletną fiszkę z bazy danych
 */
export type FlashcardEntity = Tables<"flashcards">;

/**
 * Typ reprezentujący oczekującą fiszkę z bazy danych
 */
export type PendingFlashcardEntity = Tables<"pending_flashcards">;

/**
 * Typ reprezentujący analitykę generowania AI z bazy danych
 */
export type AIGenerationAnalyticsEntity = Tables<"ai_generation_analytics">;

// ============================================================================
// USER DTOs - Typy związane z użytkownikami
// ============================================================================

/**
 * Profil użytkownika (GET /api/v1/users/me)
 * Zawiera podstawowe informacje o zalogowanym użytkowniku
 */
export interface UserProfileDTO {
  id: string;
  email: string;
  created_at: string;
  metadata?: {
    display_name?: string;
  };
}

/**
 * Status limitu generowania AI dla użytkownika (GET /api/v1/users/me/generation-quota)
 * Pokazuje dzienne limity i ich wykorzystanie
 */
export interface GenerationQuotaDTO {
  daily_limit: number;
  used_today: number;
  remaining: number;
  resets_at: string;
}

// ============================================================================
// SET DTOs - Typy związane z zestawami fiszek
// ============================================================================

/**
 * Kompletny zestaw fiszek z liczbą fiszek (GET /api/v1/sets/:id, POST /api/v1/sets)
 * Rozszerza typ bazodanowy o wyliczoną liczbę fiszek
 */
export interface SetDTO {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  flashcard_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Element listy zestawów (GET /api/v1/sets)
 * Identyczny z SetDTO, ale wydzielony semantycznie
 */
export type SetListItemDTO = SetDTO;

/**
 * Skrócona informacja o zestawie (używana w odpowiedziach zagnieżdżonych)
 * Zawiera tylko najważniejsze informacje
 */
export interface SetSummaryDTO {
  id: string;
  name: string;
  flashcard_count: number;
}

/**
 * Komenda tworzenia nowego zestawu (POST /api/v1/sets)
 */
export interface CreateSetCommand {
  name: string; // 1-128 znaków po trim
  description?: string; // max 1000 znaków
}

/**
 * Komenda aktualizacji zestawu (PATCH /api/v1/sets/:id)
 * Przynajmniej jedno pole musi być dostarczone
 */
export interface UpdateSetCommand {
  name?: string; // 1-128 znaków po trim
  description?: string; // max 1000 znaków
}

// ============================================================================
// FLASHCARD DTOs - Typy związane z fiszkami
// ============================================================================

/**
 * Kompletna fiszka (GET /api/v1/flashcards/:id, POST /api/v1/flashcards)
 * Mapowanie 1:1 z encją bazodanową
 */
export type FlashcardDTO = Pick<FlashcardEntity, "id" | "set_id" | "front" | "back" | "created_at" | "updated_at">;

/**
 * Komenda tworzenia nowej fiszki (POST /api/v1/flashcards)
 */
export interface CreateFlashcardCommand {
  set_id: string; // UUID istniejącego zestawu należącego do użytkownika
  front: string; // 1-200 znaków, nie może być tylko białymi znakami
  back: string; // 1-600 znaków, nie może być tylko białymi znakami
}

/**
 * Komenda aktualizacji fiszki (PATCH /api/v1/flashcards/:id)
 * Przynajmniej jedno pole musi być dostarczone
 */
export interface UpdateFlashcardCommand {
  front?: string; // 1-200 znaków, nie może być tylko białymi znakami
  back?: string; // 1-600 znaków, nie może być tylko białymi znakami
}

// ============================================================================
// PENDING FLASHCARD DTOs - Typy związane z oczekującymi fiszkami
// ============================================================================

/**
 * Oczekująca fiszka wygenerowana przez AI (GET /api/v1/pending-flashcards)
 * Mapowanie 1:1 z encją bazodanową
 */
export type PendingFlashcardDTO = Pick<
  PendingFlashcardEntity,
  "id" | "front_draft" | "back_draft" | "created_at" | "updated_at"
>;

/**
 * Komenda aktualizacji oczekującej fiszki (PATCH /api/v1/pending-flashcards/:id)
 * Przynajmniej jedno pole musi być dostarczone
 */
export interface UpdatePendingFlashcardCommand {
  front_draft?: string; // 1-200 znaków, nie może być tylko białymi znakami
  back_draft?: string; // 1-600 znaków, nie może być tylko białymi znakami
}

/**
 * Komenda akceptacji oczekującej fiszki (POST /api/v1/pending-flashcards/:id/accept)
 * Wymaga albo set_id albo new_set, ale nie oba jednocześnie
 */
export type AcceptPendingFlashcardCommand =
  | {
      set_id: string;
      new_set?: never;
    }
  | {
      set_id?: never;
      new_set: CreateSetCommand;
    };

/**
 * Odpowiedź na akceptację oczekującej fiszki
 * Zawiera utworzoną fiszkę i informacje o docelowym zestawie
 */
export interface AcceptPendingFlashcardResponseDTO {
  flashcard: FlashcardDTO;
  set: SetSummaryDTO;
}

/**
 * Komenda masowej akceptacji oczekujących fiszek (POST /api/v1/pending-flashcards/bulk-accept)
 * Wymaga albo set_id albo new_set, ale nie oba jednocześnie
 */
export type BulkAcceptPendingFlashcardsCommand =
  | {
      pending_ids: string[]; // 1-50 UUIDs
      set_id: string;
      new_set?: never;
    }
  | {
      pending_ids: string[]; // 1-50 UUIDs
      set_id?: never;
      new_set: CreateSetCommand;
    };

/**
 * Szczegóły nieudanej akceptacji fiszki w operacji masowej
 */
export interface BulkAcceptFailureDTO {
  pending_id: string;
  error: string;
}

/**
 * Odpowiedź na masową akceptację oczekujących fiszek
 * Zawiera informacje o sukcesach i niepowodzeniach
 */
export interface BulkAcceptResponseDTO {
  flashcards: FlashcardDTO[];
  set: SetSummaryDTO;
  accepted_count: number;
  failed: BulkAcceptFailureDTO[];
}

// ============================================================================
// AI GENERATION DTOs - Typy związane z generowaniem przez AI
// ============================================================================

/**
 * Komenda generowania fiszek przez AI (POST /api/v1/flashcards/generate)
 */
export interface GenerateFlashcardsCommand {
  source_text: string; // 1000-20000 znaków
  hint?: string; // max 500 znaków, opcjonalna wskazówka dla AI
}

/**
 * Metadane generowania AI
 * Informacje techniczne o procesie generowania
 */
export interface GenerationMetadataDTO {
  model: string;
  generation_time_ms: number;
  tokens_used: number;
}

/**
 * Odpowiedź na żądanie generowania fiszek (POST /api/v1/flashcards/generate)
 * Zawiera wygenerowane kandydatury, metadane i pozostały limit
 */
export interface GenerateFlashcardsResponseDTO {
  generation_id: string;
  candidates: PendingFlashcardDTO[];
  metadata: GenerationMetadataDTO;
  quota_remaining: number;
}

// ============================================================================
// PAGINATION DTOs - Typy związane z paginacją
// ============================================================================

/**
 * Standardowe informacje o paginacji
 * Używane we wszystkich listach z paginacją
 */
export interface PaginationDTO {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

/**
 * Generyczna odpowiedź z paginacją
 * Typ T reprezentuje typ elementu listy
 */
export interface PaginatedResponseDTO<T> {
  data: T[];
  pagination?: PaginationDTO;
}

/**
 * Lista zestawów z paginacją (GET /api/v1/sets)
 */
export type SetListResponseDTO = PaginatedResponseDTO<SetListItemDTO>;

/**
 * Lista fiszek z paginacją (GET /api/v1/sets/:id/flashcards)
 */
export type FlashcardListResponseDTO = PaginatedResponseDTO<FlashcardDTO>;

/**
 * Lista oczekujących fiszek z paginacją (GET /api/v1/pending-flashcards)
 */
export type PendingFlashcardListResponseDTO = PaginatedResponseDTO<PendingFlashcardDTO>;

// ============================================================================
// QUERY PARAMETERS - Typy parametrów zapytań
// ============================================================================

/**
 * Parametry zapytania dla listy zestawów (GET /api/v1/sets)
 */
export interface SetListQueryParams {
  page?: number; // domyślnie 1
  per_page?: number; // domyślnie 20, max 100
  category?: string;
  sort_by?: "name" | "created_at" | "updated_at"; // domyślnie 'updated_at'
  sort_order?: "asc" | "desc"; // domyślnie 'desc'
}

/**
 * Parametry zapytania dla listy fiszek (GET /api/v1/sets/:id/flashcards)
 */
export interface FlashcardListQueryParams {
  page?: number; // domyślnie 1
  per_page?: number; // domyślnie 50, max 100
}

/**
 * Parametry zapytania dla listy oczekujących fiszek (GET /api/v1/pending-flashcards)
 */
export interface PendingFlashcardListQueryParams {
  page?: number; // domyślnie 1
  per_page?: number; // domyślnie 20, max 100
  sort_by?: "created_at"; // domyślnie 'created_at'
  sort_order?: "asc" | "desc"; // domyślnie 'desc'
}

/**
 * Parametry zapytania dla fiszek wymagających powtórki (GET /api/v1/sets/:id/due-cards)
 */
export interface DueCardsQueryParams {
  limit?: number; // domyślnie 20, maksymalna liczba kart do zwrócenia
}

// ============================================================================
// ERROR DTOs - Typy związane z błędami
// ============================================================================

/**
 * Szczegóły błędu walidacji na poziomie pola
 */
export interface ErrorDetailDTO {
  field: string;
  message: string;
}

/**
 * Standardowa odpowiedź błędu
 * Wszystkie błędy API używają tej struktury
 */
export interface ErrorResponseDTO {
  error: {
    id: string; // UUID unikalnie identyfikujący instancję błędu
    code: ErrorCode;
    message: string;
    details?: ErrorDetailDTO[];
  };
}

/**
 * Kody błędów używane w API
 */
export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "RESOURCE_NOT_FOUND"
  | "SET_NOT_FOUND"
  | "DUPLICATE_SET_NAME"
  | "GENERATION_LIMIT_EXCEEDED"
  | "RATE_LIMIT_EXCEEDED"
  | "AI_SERVICE_ERROR"
  | "AI_SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR"
  | "INVALID_PARAMETER";

// ============================================================================
// REVIEW DTOs - Typy związane z powtórkami (przyszła implementacja)
// ============================================================================

/**
 * Dane dotyczące algorytmu powtórek rozmieszczonych w czasie
 * Używane w przyszłej implementacji systemu powtórek
 */
export interface ReviewDataDTO {
  next_review: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
}

/**
 * Fiszka z danymi o następnej powtórce (GET /api/v1/sets/:id/due-cards)
 * Rozszerza FlashcardDTO o informacje o harmonogramie powtórek
 */
export interface FlashcardWithReviewDTO extends FlashcardDTO {
  review_data: ReviewDataDTO;
}

/**
 * Lista fiszek wymagających powtórki
 */
export interface DueCardsResponseDTO {
  data: FlashcardWithReviewDTO[];
  total_due: number;
}

/**
 * Komenda rejestracji powtórki fiszki (POST /api/v1/flashcards/:id/reviews)
 * Przyszła implementacja algorytmu powtórek
 */
export interface RecordReviewCommand {
  quality: 0 | 1 | 2 | 3 | 4 | 5; // Ocena zgodnie z algorytmem powtórek
  review_duration_ms?: number; // Opcjonalny czas spędzony na przeglądaniu
}

/**
 * Odpowiedź na zarejestrowanie powtórki
 * Zawiera zaktualizowane informacje o harmonogramie
 */
export interface RecordReviewResponseDTO {
  id: string;
  flashcard_id: string;
  quality: number;
  review_duration_ms: number;
  reviewed_at: string;
  next_review: ReviewDataDTO;
}

// ============================================================================
// DATABASE INSERT TYPES - Typy do wstawiania danych do bazy
// ============================================================================

/**
 * Typ do wstawiania nowego zestawu do bazy danych
 */
export type SetInsert = TablesInsert<"sets">;

/**
 * Typ do wstawiania nowej fiszki do bazy danych
 */
export type FlashcardInsert = TablesInsert<"flashcards">;

/**
 * Typ do wstawiania nowej oczekującej fiszki do bazy danych
 */
export type PendingFlashcardInsert = TablesInsert<"pending_flashcards">;

/**
 * Typ do wstawiania nowej analityki generowania AI do bazy danych
 */
export type AIGenerationAnalyticsInsert = TablesInsert<"ai_generation_analytics">;

// ============================================================================
// DATABASE UPDATE TYPES - Typy do aktualizacji danych w bazie
// ============================================================================

/**
 * Typ do aktualizacji zestawu w bazie danych
 */
export type SetUpdate = TablesUpdate<"sets">;

/**
 * Typ do aktualizacji fiszki w bazie danych
 */
export type FlashcardUpdate = TablesUpdate<"flashcards">;

/**
 * Typ do aktualizacji oczekującej fiszki w bazie danych
 */
export type PendingFlashcardUpdate = TablesUpdate<"pending_flashcards">;

// ============================================================================
// VIEW MODEL TYPES - Typy dla warstwy prezentacji
// ============================================================================

/**
 * ViewModel dla wyświetlania informacji o limicie generacji
 * Przystosowany do bezpośredniego użycia w komponentach UI
 */
export interface QuotaViewModel {
  /** Liczba pozostałych generacji */
  remaining: number;
  /** Całkowity dzienny limit */
  limit: number;
  /** Procentowe zużycie limitu (0-100), używane przez komponent Progress */
  percentage: number;
  /** Sformatowana data resetu limitu do wyświetlenia w UI */
  resetsAtFormatted: string;
}

/**
 * Rozszerzona wersja ErrorResponseDTO z HTTP status code
 * Używana w hooku do łatwiejszej obsługi błędów
 */
export interface ErrorResponseWithStatus extends ErrorResponseDTO {
  statusCode: number;
}

/**
 * ViewModel agregujący cały stan widoku generowania fiszek
 * Używany w hooku useGenerateFlashcards
 */
export interface GenerateFlashcardsStateVM {
  /** Stan pobierania danych o limicie */
  quota: {
    data: QuotaViewModel | null;
    status: "idle" | "loading" | "error";
    error: string | null;
  };
  /** Stan procesu generowania fiszek */
  generation: {
    status: "idle" | "submitting" | "success" | "error";
    error: ErrorResponseWithStatus | string | null;
  };
}
