-- =============================================================
-- Security Fix: Add SET search_path = public, pg_temp to all
-- functions that are missing it.
-- Silences Supabase security advisor lint: function_search_path_mutable
-- =============================================================

-- 1. update_room_activity
CREATE OR REPLACE FUNCTION public.update_room_activity()
RETURNS TRIGGER
SECURITY INVOKER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.rooms SET last_activity_at = now() WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$;

-- 2. cleanup_expired_content
CREATE OR REPLACE FUNCTION public.cleanup_expired_content()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Only delete rooms that have passed their explicit expiry time.
  -- Cascades to participants, messages, bans, and reactions via FK ON DELETE CASCADE.
  DELETE FROM public.rooms WHERE expires_at < now();
END;
$$;

-- 3. create_room (final canonical version with all fixes)
CREATE OR REPLACE FUNCTION public.create_room(
  name text,
  host_session_id text,
  duration_minutes int DEFAULT 1440
)
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
    valid_duration := 1440;
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

  -- Generate unique 6-char alphanumeric code
  LOOP
    new_code := upper(substr(md5(random()::text), 1, 6));
    BEGIN
      INSERT INTO public.rooms (code, name, host_session_id, expires_at)
      VALUES (new_code, name, host_session_id, now() + (valid_duration * interval '1 minute'))
      RETURNING id INTO room_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- Retry on collision
    END;
  END LOOP;

  RETURN new_code;
END;
$$;
