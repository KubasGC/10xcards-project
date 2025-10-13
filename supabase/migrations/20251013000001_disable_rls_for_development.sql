-- =====================================================================================
-- Migration: Disable RLS for Development
-- =====================================================================================
-- Purpose: Temporarily disable Row Level Security for development environment
-- 
-- WARNING: This migration is intended for DEVELOPMENT ONLY!
-- DO NOT apply this in production environment.
--
-- This migration:
--   - Drops all existing RLS policies
--   - Disables RLS on all tables
--
-- To re-enable RLS in production, you need to:
--   1. Revert this migration
--   2. Apply the original RLS policies from the initial schema
-- =====================================================================================


-- =====================================================================================
-- Drop RLS Policies: sets
-- =====================================================================================

drop policy if exists "Users can view their own sets" on public.sets;
drop policy if exists "Users can create their own sets" on public.sets;
drop policy if exists "Users can update their own sets" on public.sets;
drop policy if exists "Users can delete their own sets" on public.sets;

-- Disable RLS on sets table
alter table public.sets disable row level security;


-- =====================================================================================
-- Drop RLS Policies: flashcards
-- =====================================================================================

drop policy if exists "Users can view their own flashcards" on public.flashcards;
drop policy if exists "Users can create their own flashcards" on public.flashcards;
drop policy if exists "Users can update their own flashcards" on public.flashcards;
drop policy if exists "Users can delete their own flashcards" on public.flashcards;

-- Disable RLS on flashcards table
alter table public.flashcards disable row level security;


-- =====================================================================================
-- Drop RLS Policies: pending_flashcards
-- =====================================================================================

drop policy if exists "Users can view their own pending flashcards" on public.pending_flashcards;
drop policy if exists "Users can create their own pending flashcards" on public.pending_flashcards;
drop policy if exists "Users can update their own pending flashcards" on public.pending_flashcards;
drop policy if exists "Users can delete their own pending flashcards" on public.pending_flashcards;

-- Disable RLS on pending_flashcards table
alter table public.pending_flashcards disable row level security;


-- =====================================================================================
-- Drop RLS Policies: ai_generation_analytics
-- =====================================================================================

drop policy if exists "Users can view their own ai analytics" on public.ai_generation_analytics;
drop policy if exists "Users can create their own ai analytics" on public.ai_generation_analytics;
drop policy if exists "Users can delete their own ai analytics" on public.ai_generation_analytics;

-- Disable RLS on ai_generation_analytics table
alter table public.ai_generation_analytics disable row level security;


-- =====================================================================================
-- Migration Complete
-- =====================================================================================
-- Summary:
--   ✓ Dropped all RLS policies from 4 tables
--   ✓ Disabled RLS on all tables
--
-- Security Note:
--   - All authenticated users now have full access to all data
--   - Service role and anon key have unrestricted access
--   - Ensure your application layer handles authorization
--
-- Next Steps:
--   - Run: supabase db push
--   - Or: supabase db reset (to apply all migrations from scratch)
--   - Verify in Supabase dashboard that RLS is disabled
-- =====================================================================================

