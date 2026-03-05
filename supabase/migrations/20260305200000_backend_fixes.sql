-- =============================================================
-- ShareRoom Backend Fixes
-- =============================================================

-- ---------------------------------------------------------------
-- FIX 1: Add missing `edited_at` column to messages
-- updateMessage() in useRoom.ts writes this column, but it
-- never existed in the schema, causing all edits to silently fail.
-- ---------------------------------------------------------------
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Add a policy to allow updating messages (for edits)
-- The previous migrations only set INSERT/SELECT/DELETE — no UPDATE policy for messages exists.
DROP POLICY IF EXISTS "Anyone can update messages" ON public.messages;
CREATE POLICY "Update messages in active rooms" ON public.messages
FOR UPDATE USING (
  expires_at > now()
  AND EXISTS (
    SELECT 1 FROM public.rooms
    WHERE id = messages.room_id
    AND expires_at > now()
  )
);

-- ---------------------------------------------------------------
-- FIX 2: Fix broken RLS DELETE policy for message_reactions.
-- The original policy used JWT claims: 
--   session_id = current_setting('request.jwt.claims', true)::json->>'sub'
-- This app uses NO Supabase Auth. All users are anonymous. The JWT
-- sub claim is always null, so NO user could ever remove a reaction.
-- Replace with an open DELETE policy (consistent with all other
-- policies in this app). Uniqueness is enforced by the DB constraint
-- UNIQUE(message_id, session_id, emoji).
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Remove own reactions" ON public.message_reactions;
CREATE POLICY "Remove reactions" ON public.message_reactions
FOR DELETE USING (true);

-- ---------------------------------------------------------------
-- FIX 5: Fix cleanup_expired_content() incorrectly deleting
-- active rooms. The original version deleted rooms where
-- last_activity_at < now() - 1 hour, which would delete valid
-- rooms that simply haven't had recent chat activity (e.g., a
-- newly created 24h room that no one has messaged yet).
-- The correct cleanup should ONLY use expires_at.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_expired_content()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only delete rooms that have passed their explicit expiry time.
  -- Cascades to participants, messages, bans, and reactions via FK ON DELETE CASCADE.
  DELETE FROM public.rooms WHERE expires_at < now();
END;
$$;
