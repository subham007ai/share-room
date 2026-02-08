-- Add indexes for critical performance columns

-- Optimized lookups for room code (used in joinRoom)
CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(code);

-- Optimized RLS policy checks (expires_at is used in almost every policy)
CREATE INDEX IF NOT EXISTS idx_rooms_expires_at ON public.rooms(expires_at);
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON public.messages(expires_at);

-- Foreign key lookups (used in joins and RLS)
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_participants_room_id ON public.room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_participants_session_id ON public.room_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_bans_room_id ON public.room_bans(room_id);
CREATE INDEX IF NOT EXISTS idx_bans_session_id ON public.room_bans(session_id);

-- Sort ordering for messages
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON public.messages(room_id, created_at);
