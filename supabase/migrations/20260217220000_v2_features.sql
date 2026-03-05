-- ============================================================
-- ShareRoom V2: Message Reactions + Custom Room Duration
-- ============================================================

-- 1. Message Reactions Table
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  emoji VARCHAR(4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, session_id, emoji)
);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: reactions only on active rooms
CREATE POLICY "View reactions of active rooms" ON public.message_reactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.rooms r ON r.id = m.room_id
    WHERE m.id = message_reactions.message_id
    AND r.expires_at > now()
  )
);

CREATE POLICY "Add reactions to active rooms" ON public.message_reactions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.rooms r ON r.id = m.room_id
    WHERE m.id = message_reactions.message_id
    AND r.expires_at > now()
  )
);

CREATE POLICY "Remove own reactions" ON public.message_reactions
FOR DELETE USING (session_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Index for fast lookups
CREATE INDEX idx_message_reactions_message_id ON public.message_reactions(message_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- 2. Update create_room RPC to accept custom duration
CREATE OR REPLACE FUNCTION create_room(name text, host_session_id text, duration_minutes int DEFAULT 1440)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_code text;
  room_id uuid;
  recent_room_count int;
  valid_duration int;
BEGIN
  -- Validate duration (must be one of: 15, 60, 360, 1440)
  IF duration_minutes NOT IN (15, 60, 360, 1440) THEN
    valid_duration := 1440; -- Default to 24h if invalid
  ELSE
    valid_duration := duration_minutes;
  END IF;

  -- Rate Limit: Max 5 rooms per hour per session
  SELECT COUNT(*) INTO recent_room_count
  FROM public.rooms
  WHERE rooms.host_session_id = create_room.host_session_id
  AND created_at > (now() - interval '1 hour');

  IF recent_room_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: You can only create 5 rooms per hour.';
  END IF;

  -- Generate unique 6-char code
  LOOP
    new_code := upper(substr(md5(random()::text), 1, 6));
    BEGIN
      INSERT INTO public.rooms (code, name, host_session_id, expires_at)
      VALUES (new_code, name, host_session_id, now() + (valid_duration * interval '1 minute'))
      RETURNING id INTO room_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- Try again
    END;
  END LOOP;

  RETURN new_code;
END;
$$;
