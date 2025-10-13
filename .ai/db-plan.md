## 1. Lista tabel z kolumnami, typami i ograniczeniami

### Tabela: sets (zestawy)
- id: UUID, PK, NOT NULL, DEFAULT gen_random_uuid()
- user_id: UUID, NOT NULL, FK → auth.users(id) ON DELETE CASCADE
- name: TEXT, NOT NULL, CHECK (char_length(trim(name)) BETWEEN 1 AND 128)
- description: TEXT, NULL, CHECK (char_length(description) <= 1000)
- category: TEXT, NULL  
  (przypisywana asynchronicznie po uzyskaniu wystarczającej liczby fiszek; jednorazowo)
- created_at: TIMESTAMPTZ, NOT NULL, DEFAULT now()
- updated_at: TIMESTAMPTZ, NOT NULL, DEFAULT now()

Ograniczenia dodatkowe:
- UNIQUE (user_id, name)
- UNIQUE (id, user_id) — na potrzeby złożonego FK w `flashcards`

### Tabela: flashcards (fiszki)
- id: UUID, PK, NOT NULL, DEFAULT gen_random_uuid()
- user_id: UUID, NOT NULL, FK → auth.users(id) ON DELETE CASCADE
- set_id: UUID, NOT NULL, FK → sets(id) ON DELETE CASCADE
- front: TEXT, NOT NULL, CHECK (char_length(front) BETWEEN 1 AND 200), CHECK (char_length(trim(front)) > 0)
- back: TEXT, NOT NULL, CHECK (char_length(back) BETWEEN 1 AND 600), CHECK (char_length(trim(back)) > 0)
- created_at: TIMESTAMPTZ, NOT NULL, DEFAULT now()
- updated_at: TIMESTAMPTZ, NOT NULL, DEFAULT now()

Integralność między `flashcards` a `sets` (własność użytkownika):
- FK złożony: FOREIGN KEY (set_id, user_id) REFERENCES sets(id, user_id) ON DELETE CASCADE

### Tabela: pending_flashcards (oczekujące kandydaty AI)
- id: UUID, PK, NOT NULL, DEFAULT gen_random_uuid()
- user_id: UUID, NOT NULL, FK → auth.users(id) ON DELETE CASCADE
- front_draft: TEXT, NOT NULL, CHECK (char_length(front_draft) BETWEEN 1 AND 200), CHECK (char_length(trim(front_draft)) > 0)
- back_draft: TEXT, NOT NULL, CHECK (char_length(back_draft) BETWEEN 1 AND 600), CHECK (char_length(trim(back_draft)) > 0)
- created_at: TIMESTAMPTZ, NOT NULL, DEFAULT now()
- updated_at: TIMESTAMPTZ, NOT NULL, DEFAULT now()

Uwagi prywatności:
- Brak przechowywania wklejonych tekstów źródłowych i promptów; przechowujemy wyłącznie propozycje fiszek (drafty).
- Odrzucone kandydaty są usuwane trwale przez aplikację (brak polityki retencji na poziomie DB w MVP).

### Tabela: ai_generation_analytics (analityka generacji AI)
- id: BIGSERIAL, PK, NOT NULL
- user_id: UUID, NOT NULL, FK → auth.users(id) ON DELETE CASCADE
- model: TEXT, NOT NULL
- provider: TEXT, NULL
- input_tokens: INTEGER, NOT NULL, DEFAULT 0, CHECK (input_tokens >= 0)
- output_tokens: INTEGER, NOT NULL, DEFAULT 0, CHECK (output_tokens >= 0)
- total_tokens: INTEGER, GENERATED ALWAYS AS (input_tokens + output_tokens) STORED
- duration_ms: INTEGER, NOT NULL, CHECK (duration_ms >= 0)
- cost_usd: NUMERIC(10, 8), NOT NULL, CHECK (cost_usd >= 0)
- created_at: TIMESTAMPTZ, NOT NULL, DEFAULT now()

Uwagi:
- Tabela nie przechowuje treści wejściowych ani wyjściowych; spełnia założenia anonimizacji.
- Dzienny limit generacji liczony przez zliczanie rekordów per użytkownik w dacie bieżącej.


## 2. Relacje między tabelami
- Użytkownik (auth.users) 1 — N Sets (`sets.user_id` → `auth.users.id`, ON DELETE CASCADE)
- Użytkownik (auth.users) 1 — N PendingFlashcards (`pending_flashcards.user_id` → `auth.users.id`, ON DELETE CASCADE)
- Użytkownik (auth.users) 1 — N Analytics (`ai_generation_analytics.user_id` → `auth.users.id`, ON DELETE CASCADE)
- Set (sets) 1 — N Flashcards (`flashcards.set_id` → `sets.id`, ON DELETE CASCADE)
- Dodatkowo: spójność właściciela erzamizowana przez złożony FK `flashcards(set_id, user_id)` → `sets(id, user_id)`

Kardynalność:
- `auth.users` — `sets`: 1:N
- `auth.users` — `pending_flashcards`: 1:N
- `auth.users` — `ai_generation_analytics`: 1:N
- `sets` — `flashcards`: 1:N (każda fiszka musi należeć do zestawu)


## 3. Indeksy
- PK indeksy: na kluczach głównych każdej tabeli (implicit)
- `sets`
  - UNIQUE (user_id, name)
  - UNIQUE (id, user_id) — pod złożony FK z `flashcards`
  - INDEX (user_id)
  - INDEX (category) — pod analitykę i ewentualne filtrowanie
- `flashcards`
  - INDEX (user_id)
  - INDEX (set_id)
  - Złożony FK (set_id, user_id) → wymaga UNIQUE (id, user_id) w `sets`
- `pending_flashcards`
  - INDEX (user_id)
- `ai_generation_analytics`
  - INDEX (user_id, created_at DESC) — do szybkiego zliczania dziennych limitów

Widoki pomocnicze (opcjonalne, dla zapytań limitów):
- VIEW `user_daily_ai_generation_counts` (user_id, day::date, generation_count)


## 4. Zasady PostgreSQL (RLS)

- W tabelach sets, flashcards, pending_flashcards oraz ai_generation_analytics wdrozyć polityki RLS, które pozwalają uzytkownikowi na dostęp tylko do rekordów, gdzie `user_id` odpowiada identyfikatorowi uzytkownika z Supabase Auth(np. auth.uid() = user_id).


## 5. Dodatkowe uwagi projektowe
- Normalizacja: schemat spełnia 3NF; denormalizacja ograniczona do przechowywania `user_id` w `flashcards` (dla RLS i indeksowania) z dodatkową gwarancją spójności poprzez złożony FK.
- Limity znaków: wymuszone na poziomie DB poprzez CHECK, zgodnie z MVP (200/600).
- Prywatność: brak przechowywania tekstów źródłowych i promptów; jedynie drafty kandydatów i metadane generacji.
- Kaskadowe usuwanie: `ON DELETE CASCADE` na wszystkich FK zapewnia integralność przy usuwaniu użytkownika, zestawu czy fiszek.
- Wydajność: kluczowe indeksy na kolumnach FK oraz złożony indeks w analityce dla limitów dziennych; indeks na `sets.category` pod analitykę.
- Unikalność nazw zestawów: UNIQUE (user_id, name) zapobiega duplikatom w obrębie użytkownika.
- Rozszerzenia: przy generowaniu UUID przez `gen_random_uuid()` wymagane rozszerzenie `pgcrypto` (w Supabase domyślnie dostępne). Alternatywnie można użyć `uuid_generate_v4()` z `uuid-ossp`.
- Przyszłe rozszerzenie (spaced repetition): przewidziane tabele progresu nauki i sesji zostaną dodane w kolejnej iteracji bez łamania istniejących relacji.


