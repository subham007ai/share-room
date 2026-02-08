-- Rename columns for semantic correctness
ALTER TABLE public.rooms RENAME COLUMN host_fingerprint TO host_session_id;
ALTER TABLE public.room_participants RENAME COLUMN fingerprint TO session_id;

-- Rename banned table and columns
ALTER TABLE public.banned_fingerprints RENAME TO room_bans;
ALTER TABLE public.room_bans RENAME COLUMN fingerprint TO session_id;

-- Add expiry to rooms and messages
ALTER TABLE public.rooms ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours');
ALTER TABLE public.messages ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours');

-- Drop old policies before re-creating them
DROP POLICY "Anyone can view rooms" ON public.rooms;
DROP POLICY "Anyone can create rooms" ON public.rooms;
DROP POLICY "Anyone can update rooms" ON public.rooms;
DROP POLICY "Anyone can delete rooms" ON public.rooms;

DROP POLICY "Anyone can view participants" ON public.room_participants;
DROP POLICY "Anyone can join rooms" ON public.room_participants;
DROP POLICY "Anyone can update participants" ON public.room_participants;
DROP POLICY "Anyone can leave rooms" ON public.room_participants;

DROP POLICY "Anyone can view messages" ON public.messages;
DROP POLICY "Anyone can send messages" ON public.messages;
DROP POLICY "Anyone can delete messages" ON public.messages;

-- Corrected table name here: room_bans instead of banned_fingerprints
DROP POLICY "Anyone can view bans" ON public.room_bans;
DROP POLICY "Anyone can add bans" ON public.room_bans;


-- Re-create stricter policies enforcing expiry
-- Rooms: View active only
CREATE POLICY "Public view active rooms" ON public.rooms
FOR SELECT USING (expires_at > now());

-- Rooms: Create (anyone can create, but typically via RPC now)
CREATE POLICY "Public create rooms" ON public.rooms
FOR INSERT WITH CHECK (true);

-- Rooms: Host can update (e.g. lock) - implicit check via session_id?
-- For now, keep it open but maybe we should restrict updates to host?
-- Current app logic allows anyone to update? The old policy was "Anyone can update rooms" USING (true).
-- Let's stick to "Anyone" for now but add expiry check.
CREATE POLICY "Public update active rooms" ON public.rooms
FOR UPDATE USING (expires_at > now());

-- Participants: View only for active rooms
CREATE POLICY "View participants of active rooms" ON public.room_participants
FOR SELECT USING (
  exists (
    select 1 from public.rooms
    where id = room_participants.room_id
    and expires_at > now()
  )
);

-- Participants: Join active rooms
CREATE POLICY "Join active rooms" ON public.room_participants
FOR INSERT WITH CHECK (
  exists (
    select 1 from public.rooms
    where id = room_participants.room_id
    and expires_at > now()
  )
);

-- Messages: View messages of active rooms
-- GUARANTEE: Messages are inaccessible if the room is expired OR if the message itself is expired.
CREATE POLICY "View messages of active rooms" ON public.messages
FOR SELECT USING (
  expires_at > now() AND
  exists (
    select 1 from public.rooms
    where id = messages.room_id
    and expires_at > now()
  )
);

-- Messages: Send to active rooms
CREATE POLICY "Send messages to active rooms" ON public.messages
FOR INSERT WITH CHECK (
  exists (
    select 1 from public.rooms
    where id = messages.room_id
    and expires_at > now()
  )
);

-- RPC for server-side room creation
-- GUARANTEE: Returns a random, non-sequential 6-char code. Uniqueness is enforced by retry on collision.
CREATE OR REPLACE FUNCTION create_room(name text, host_session_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code text;
  room_id uuid;
BEGIN
  -- Generate unique 6-char code (uppercase alphanumeric, excluding similar chars if desired, but simple is fine)
  -- Using a loop to ensure uniqueness
  LOOP
    -- Generate random 6 char string
    new_code := upper(substr(md5(random()::text), 1, 6));
    BEGIN
      INSERT INTO public.rooms (code, name, host_session_id, expires_at)
      VALUES (new_code, name, host_session_id, now() + interval '24 hours')
      RETURNING id INTO room_id;
      EXIT; -- Successfully inserted
    EXCEPTION WHEN unique_violation THEN
      -- Try again
    END;
  END LOOP;

  RETURN new_code;
END;
$$;

-- Cleanup function
-- GUARANTEE: Storage reclamation only. Privacy is enforced by RLS policies on `expires_at`.
CREATE OR REPLACE FUNCTION cleanup_expired_content()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reclaim storage for expired rooms (cascades to participants, messages, bans)
  DELETE FROM public.rooms WHERE expires_at < now();
  -- Reclaim storage for inactive rooms (last activity > 1 hour ago)
  DELETE FROM public.rooms WHERE last_activity_at < (now() - interval '1 hour');
END;
$$;
