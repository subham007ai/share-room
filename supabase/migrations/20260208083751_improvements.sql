-- 1. Composite Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_room_participants_room_session ON public.room_participants(room_id, session_id);
-- Ensure message sorting index exists (may already exist from previous migration, but explicit composite is good)
CREATE INDEX IF NOT EXISTS idx_messages_room_created_composite ON public.messages(room_id, created_at DESC);

-- 2. Rate Limiting for Room Creation
-- Update the existing create_room function to include a rate limit check
CREATE OR REPLACE FUNCTION create_room(name text, host_session_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code text;
  room_id uuid;
  recent_room_count int;
BEGIN
  -- Rate Limit: Max 5 rooms created per hour per session
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

-- 3. Rate Limiting for Messages
-- Create a trigger function to prevent spam
CREATE OR REPLACE FUNCTION check_message_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_msg_count int;
BEGIN
  -- Rate Limit: Max 60 messages per minute per participant
  -- Note: System messages are exempt (handled by is_system check or ensuring system doesn't trigger this if bypass needed, 
  -- but generally system messages come from RPCs/Triggers with session_replication_role 'replica' or similar. 
  -- Here we assume user-sent messages.)
  
  IF NEW.is_system = false THEN
      SELECT COUNT(*) INTO recent_msg_count
      FROM public.messages
      WHERE participant_id = NEW.participant_id
      AND created_at > (now() - interval '1 minute');

      IF recent_msg_count >= 60 THEN
        RAISE EXCEPTION 'Rate limit exceeded: You are sending messages too quickly.';
      END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_message_rate_limit ON public.messages;
CREATE TRIGGER trigger_check_message_rate_limit
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION check_message_rate_limit();


-- 4. Automated Cleanup (pg_cron)
-- Attempt to enable pg_cron (requires superuser, may fail on some setups but standard for Supabase)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron could not be enabled. Please enable it manually in your dashboard extensions.';
END
$$;

-- Schedule the cleanup job if pg_cron is available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedules if exists to prevent duplicates/errors, then schedule
    PERFORM cron.unschedule('cleanup_expired_rooms');
    PERFORM cron.schedule('cleanup_expired_rooms', '0 * * * *', $$SELECT cleanup_expired_content()$$);
  END IF;
END
$$;
