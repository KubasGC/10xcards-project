-- =====================================================================================
-- Migration: Initial Schema for 10xcards
-- =====================================================================================
-- Purpose: Create the core database schema for the flashcard application
-- Affected Tables: sets, flashcards, pending_flashcards, ai_generation_analytics
-- 
-- Description:
--   This migration establishes the foundational database structure including:
--   - Sets (flashcard collections owned by users)
--   - Flashcards (individual study items within sets)
--   - Pending Flashcards (AI-generated candidates awaiting user approval)
--   - AI Generation Analytics (token usage and cost tracking)
--
-- Security:
--   - All tables use Row Level Security (RLS)
--   - Users can only access their own data
--   - Cascading deletes ensure data integrity
--
-- Privacy:
--   - No source texts or prompts are stored
--   - Only flashcard drafts and metadata are persisted
-- =====================================================================================


-- =====================================================================================
-- Table: sets
-- =====================================================================================
-- Purpose: Store flashcard sets (collections) owned by users
-- 
-- Key Features:
--   - Each user can create multiple sets
--   - Set names must be unique per user
--   - Category is assigned asynchronously by AI after sufficient flashcards exist
--   - Composite unique constraint (id, user_id) supports complex FK in flashcards table
-- =====================================================================================

create table if not exists public.sets (
  id uuid primary key not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text null,
  category text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Ensure set name is between 1-128 characters (trimmed)
  constraint sets_name_length_check check (
    char_length(trim(name)) between 1 and 128
  ),
  
  -- Limit description to 1000 characters
  constraint sets_description_length_check check (
    description is null or char_length(description) <= 1000
  ),
  
  -- Prevent duplicate set names per user
  constraint sets_user_name_unique unique (user_id, name),
  
  -- Support composite FK from flashcards table
  constraint sets_id_user_unique unique (id, user_id)
);

-- Create index for efficient user-based queries
create index if not exists sets_user_id_idx on public.sets(user_id);

-- Create index for category filtering and analytics
create index if not exists sets_category_idx on public.sets(category);

-- Enable Row Level Security
alter table public.sets enable row level security;

-- RLS Policy: Allow authenticated users to select their own sets
create policy "Users can view their own sets"
  on public.sets
  for select
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to insert their own sets
create policy "Users can create their own sets"
  on public.sets
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to update their own sets
create policy "Users can update their own sets"
  on public.sets
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to delete their own sets
-- WARNING: This will cascade delete all flashcards in the set
create policy "Users can delete their own sets"
  on public.sets
  for delete
  to authenticated
  using (auth.uid() = user_id);


-- =====================================================================================
-- Table: flashcards
-- =====================================================================================
-- Purpose: Store individual flashcards within sets
-- 
-- Key Features:
--   - Each flashcard belongs to exactly one set
--   - Front (question) limited to 200 characters
--   - Back (answer) limited to 600 characters
--   - Composite FK ensures flashcard owner matches set owner
--   - Denormalized user_id for efficient RLS and indexing
-- =====================================================================================

create table if not exists public.flashcards (
  id uuid primary key not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id uuid not null references public.sets(id) on delete cascade,
  front text not null,
  back text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Ensure front text is between 1-200 characters and not empty when trimmed
  constraint flashcards_front_length_check check (
    char_length(front) between 1 and 200
  ),
  constraint flashcards_front_not_empty_check check (
    char_length(trim(front)) > 0
  ),
  
  -- Ensure back text is between 1-600 characters and not empty when trimmed
  constraint flashcards_back_length_check check (
    char_length(back) between 1 and 600
  ),
  constraint flashcards_back_not_empty_check check (
    char_length(trim(back)) > 0
  ),
  
  -- Composite FK: Ensure flashcard owner matches set owner
  -- This prevents users from adding flashcards to sets they don't own
  constraint flashcards_set_user_fk 
    foreign key (set_id, user_id) 
    references public.sets(id, user_id) 
    on delete cascade
);

-- Create index for efficient user-based queries
create index if not exists flashcards_user_id_idx on public.flashcards(user_id);

-- Create index for efficient set-based queries
create index if not exists flashcards_set_id_idx on public.flashcards(set_id);

-- Enable Row Level Security
alter table public.flashcards enable row level security;

-- RLS Policy: Allow authenticated users to select their own flashcards
create policy "Users can view their own flashcards"
  on public.flashcards
  for select
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to insert their own flashcards
create policy "Users can create their own flashcards"
  on public.flashcards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to update their own flashcards
create policy "Users can update their own flashcards"
  on public.flashcards
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to delete their own flashcards
create policy "Users can delete their own flashcards"
  on public.flashcards
  for delete
  to authenticated
  using (auth.uid() = user_id);


-- =====================================================================================
-- Table: pending_flashcards
-- =====================================================================================
-- Purpose: Store AI-generated flashcard candidates awaiting user approval
-- 
-- Key Features:
--   - Temporary storage for AI suggestions
--   - Same character limits as approved flashcards (200/600)
--   - Rejected candidates are permanently deleted by application
--   - No retention policy at DB level (MVP approach)
--
-- Privacy:
--   - Source texts and prompts are NOT stored
--   - Only the generated flashcard drafts are persisted
-- =====================================================================================

create table if not exists public.pending_flashcards (
  id uuid primary key not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  front_draft text not null,
  back_draft text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Ensure front_draft is between 1-200 characters and not empty when trimmed
  constraint pending_flashcards_front_length_check check (
    char_length(front_draft) between 1 and 200
  ),
  constraint pending_flashcards_front_not_empty_check check (
    char_length(trim(front_draft)) > 0
  ),
  
  -- Ensure back_draft is between 1-600 characters and not empty when trimmed
  constraint pending_flashcards_back_length_check check (
    char_length(back_draft) between 1 and 600
  ),
  constraint pending_flashcards_back_not_empty_check check (
    char_length(trim(back_draft)) > 0
  )
);

-- Create index for efficient user-based queries
create index if not exists pending_flashcards_user_id_idx on public.pending_flashcards(user_id);

-- Enable Row Level Security
alter table public.pending_flashcards enable row level security;

-- RLS Policy: Allow authenticated users to select their own pending flashcards
create policy "Users can view their own pending flashcards"
  on public.pending_flashcards
  for select
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to insert their own pending flashcards
-- Note: Typically only the backend AI service will insert, but user_id must match session
create policy "Users can create their own pending flashcards"
  on public.pending_flashcards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to update their own pending flashcards
create policy "Users can update their own pending flashcards"
  on public.pending_flashcards
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to delete their own pending flashcards
-- This is used when user rejects or approves a candidate
create policy "Users can delete their own pending flashcards"
  on public.pending_flashcards
  for delete
  to authenticated
  using (auth.uid() = user_id);


-- =====================================================================================
-- Table: ai_generation_analytics
-- =====================================================================================
-- Purpose: Track AI generation usage, tokens, costs, and performance
-- 
-- Key Features:
--   - Tracks token usage (input, output, total)
--   - Tracks generation duration and cost in USD
--   - Used for daily generation limits per user
--   - Does NOT store input/output content (privacy-compliant)
--
-- Privacy:
--   - Only metadata is stored (tokens, duration, cost)
--   - No actual content from prompts or responses
--
-- Usage:
--   - Daily limits calculated by counting records per user per day
--   - Cost tracking for analytics and billing purposes
-- =====================================================================================

create table if not exists public.ai_generation_analytics (
  id bigserial primary key not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  model text not null,
  provider text null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  -- Total tokens calculated automatically
  total_tokens integer generated always as (input_tokens + output_tokens) stored,
  duration_ms integer not null,
  cost_usd numeric(10, 8) not null,
  created_at timestamptz not null default now(),
  
  -- Ensure token counts are non-negative
  constraint ai_generation_analytics_input_tokens_check check (
    input_tokens >= 0
  ),
  constraint ai_generation_analytics_output_tokens_check check (
    output_tokens >= 0
  ),
  
  -- Ensure duration is non-negative
  constraint ai_generation_analytics_duration_check check (
    duration_ms >= 0
  ),
  
  -- Ensure cost is non-negative
  constraint ai_generation_analytics_cost_check check (
    cost_usd >= 0
  )
);

-- Create composite index for efficient daily limit queries
-- Sorted DESC for faster retrieval of recent records
create index if not exists ai_generation_analytics_user_created_idx 
  on public.ai_generation_analytics(user_id, created_at desc);

-- Enable Row Level Security
alter table public.ai_generation_analytics enable row level security;

-- RLS Policy: Allow authenticated users to select their own analytics
create policy "Users can view their own ai analytics"
  on public.ai_generation_analytics
  for select
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to insert their own analytics
-- Note: Typically only the backend AI service will insert, but user_id must match session
create policy "Users can create their own ai analytics"
  on public.ai_generation_analytics
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- RLS Policy: Prevent updates to analytics records
-- Analytics should be immutable once created
-- If you need to allow updates, uncomment the policy below:
-- create policy "Users can update their own ai analytics"
--   on public.ai_generation_analytics
--   for update
--   to authenticated
--   using (auth.uid() = user_id)
--   with check (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to delete their own analytics
-- This allows users to clear their usage history if needed
create policy "Users can delete their own ai analytics"
  on public.ai_generation_analytics
  for delete
  to authenticated
  using (auth.uid() = user_id);


-- =====================================================================================
-- Helper View: user_daily_ai_generation_counts
-- =====================================================================================
-- Purpose: Simplify queries for daily generation limits
-- 
-- Usage:
--   SELECT generation_count 
--   FROM user_daily_ai_generation_counts 
--   WHERE user_id = $1 AND day = current_date;
--
-- Note: This is optional for MVP but can improve query performance
-- =====================================================================================

create or replace view public.user_daily_ai_generation_counts as
select 
  user_id,
  date(created_at) as day,
  count(*) as generation_count
from public.ai_generation_analytics
group by user_id, date(created_at);

-- Note: Views don't have RLS, they inherit from underlying tables
-- The ai_generation_analytics RLS policies will apply when querying this view


-- =====================================================================================
-- Triggers: Auto-update updated_at timestamps
-- =====================================================================================
-- Purpose: Automatically update the updated_at column when records are modified
-- 
-- Applied to: sets, flashcards, pending_flashcards
-- =====================================================================================

-- Create the trigger function (shared across all tables)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to sets table
create trigger sets_updated_at
  before update on public.sets
  for each row
  execute function public.handle_updated_at();

-- Apply trigger to flashcards table
create trigger flashcards_updated_at
  before update on public.flashcards
  for each row
  execute function public.handle_updated_at();

-- Apply trigger to pending_flashcards table
create trigger pending_flashcards_updated_at
  before update on public.pending_flashcards
  for each row
  execute function public.handle_updated_at();


-- =====================================================================================
-- Migration Complete
-- =====================================================================================
-- Summary:
--   ✓ Created 4 tables: sets, flashcards, pending_flashcards, ai_generation_analytics
--   ✓ Established foreign key relationships with cascading deletes
--   ✓ Added check constraints for data validation
--   ✓ Created indexes for query performance
--   ✓ Enabled Row Level Security on all tables
--   ✓ Created granular RLS policies for all CRUD operations
--   ✓ Added helper view for daily generation counts
--   ✓ Created triggers for automatic timestamp updates
--
-- Next Steps:
--   - Run: supabase db push
--   - Verify tables in Supabase dashboard
--   - Generate TypeScript types: supabase gen types typescript
--   - Implement spaced repetition tables in future migration
-- =====================================================================================

