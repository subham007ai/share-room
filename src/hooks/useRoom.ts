import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/session';
import { mockDb } from '@/lib/mockDb';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  room_id: string;
  participant_id: string | null;
  username: string;
  content: string | null;
  message_type: string;
  reply_to_id: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  is_system: boolean;
  created_at: string;
}

interface Participant {
  id: string;
  room_id: string;
  username: string;
  session_id: string;
  is_muted: boolean;
  is_banned: boolean;
  joined_at: string;
}

interface Room {
  id: string;
  code: string;
  name: string;
  host_session_id: string;
  is_locked: boolean;
  created_at: string;
  last_activity_at: string;
}

interface PresenceState {
  [key: string]: {
    session_id: string;
    username: string;
    joined_at: string;
    user_id: string; // Add user_id to presence to link to DB participant record? 
    // Actually session_id is consistent.
  }[];
}

export const useRoom = (roomCode: string | null, username: string | null) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  // participants is now derived, but we expose it as state for the UI
  // We keep internal state for DB data and Presence data
  const [dbParticipants, setDbParticipants] = useState<Map<string, Participant>>(new Map());
  const [presenceState, setPresenceState] = useState<PresenceState>({});

  // Derived participants list
  const participants = Object.values(presenceState).flat().map(p => {
    // Merge with DB data (is_muted, is_banned, etc)
    const dbP = dbParticipants.get(p.session_id);
    return {
      id: dbP?.id || 'temp-' + p.session_id,
      room_id: room?.id || '',
      username: p.username, // Presence username is "live"
      session_id: p.session_id,
      is_muted: dbP?.is_muted || false,
      is_banned: dbP?.is_banned || false,
      joined_at: p.joined_at,
    };
  }).filter(p => !p.is_banned); // Filter out banned users from UI list

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Refs for stable callbacks
  const roomRef = useRef(room);
  const participantsRef = useRef(participants);
  const participantRef = useRef(participant);
  const isHostRef = useRef(isHost);

  useEffect(() => { roomRef.current = room; }, [room]);
  useEffect(() => { participantsRef.current = participants; }, [participants]);
  useEffect(() => { participantRef.current = participant; }, [participant]);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);

  // Initialize session
  useEffect(() => {
    getSessionId().then(setSessionId);
  }, []);



  // Join room
  const joinRoom = useCallback(async () => {
    if (!roomCode || !username || !sessionId) return;

    try {
      setLoading(true);
      setError(null);

      // Check if room exists
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode.toUpperCase())
        .maybeSingle();

      if (roomError) throw roomError;
      if (!roomData) {
        setError('Room not found');
        setLoading(false);
        return;
      }

      setRoom(roomData);
      setIsHost(roomData.host_session_id === sessionId);

      // Check if user is banned
      const { data: banData } = await supabase
        .from('room_bans')
        .select('*')
        .eq('room_id', roomData.id)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (banData) {
        setError('You are banned from this room');
        setLoading(false);
        return;
      }

      // Check existing participant
      const { data: existingParticipant } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', roomData.id)
        .eq('session_id', sessionId)
        .maybeSingle();

      // Check if room is locked (only allow host or existing participants)
      if (roomData.is_locked && !existingParticipant && roomData.host_session_id !== sessionId) {
        setError('Room is locked');
        setLoading(false);
        return;
      }

      let currentParticipant = existingParticipant;

      if (!existingParticipant) {
        // Join as new participant
        const { data: newParticipant, error: joinError } = await supabase
          .from('room_participants')
          .insert({
            room_id: roomData.id,
            username,
            session_id: sessionId,
          })
          .select()
          .single();

        if (joinError) throw joinError;
        currentParticipant = newParticipant;

        // Send join message
        await supabase.from('messages').insert({
          room_id: roomData.id,
          participant_id: newParticipant.id,
          username,
          content: `${username} joined the room`,
          message_type: 'system',
          is_system: true,
        });
      } else {
        // Update username if different
        if (existingParticipant.username !== username) {
          await supabase
            .from('room_participants')
            .update({ username })
            .eq('id', existingParticipant.id);
        }
      }

      setParticipant(currentParticipant);

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomData.id)
        .order('created_at', { ascending: true });

      setMessages(messagesData || []);

      // Fetch initial DB participants and store in Map
      const { data: participantsData } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', roomData.id);

      const partsMap = new Map<string, Participant>();
      if (participantsData) {
        participantsData.forEach(p => partsMap.set(p.session_id, p));
      }
      setDbParticipants(partsMap);

      setLoading(false);
    } catch (err) {
      console.error('Error joining room:', err);
      if (err instanceof Error && (err.message.includes('not found') || err.message.includes('banned'))) {
        setError(err.message);
      }
      setLoading(false);
    }
  }, [roomCode, username, sessionId]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!room || !sessionId || !username) return;

    const channel = supabase.channel(`room-${room.id}`, {
      config: {
        presence: {
          key: sessionId,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        setPresenceState(channel.presenceState());
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Optional: Toast joined
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Optional: Toast left
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          // Handle DB participant updates (mute/ban/join)
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newParticipant = payload.new as Participant;

            setDbParticipants((prev) => {
              const newMap = new Map(prev);
              newMap.set(newParticipant.session_id, newParticipant);
              return newMap;
            });

            // Check if I was updated (e.g. muted/banned)
            if (newParticipant.session_id === sessionId) {
              setParticipant(newParticipant);
              if (newParticipant.is_banned) {
                setError('You have been banned from the room');
                leaveRoom();
              }
            }
          } else if (payload.eventType === 'DELETE') {
            // Optional: cleanup from map if needed, but Presence handles main list
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          setRoom(payload.new as Room);
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            session_id: sessionId,
            username: username,
            joined_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room, sessionId, username]);

  // Join when ready
  useEffect(() => {
    if (roomCode && username && sessionId) {
      joinRoom();
    }
  }, [roomCode, username, sessionId, joinRoom]);

  // Send message
  const sendMessage = useCallback(async (content: string, replyToId?: string) => {
    const r = roomRef.current;
    const p = participantRef.current;
    if (!r || !p) return;

    if (p.is_muted) {
      toast({
        title: 'Muted',
        description: 'You are muted in this room',
        variant: 'destructive',
      });
      return;
    }

    await supabase.from('messages').insert({
      room_id: r.id,
      participant_id: p.id,
      username: p.username,
      content,
      message_type: 'text',
      reply_to_id: replyToId || null,
    });
  }, []);

  // Send file
  const sendFile = useCallback(async (file: File) => {
    const r = roomRef.current;
    const p = participantRef.current;

    if (!r || !p) return;

    if (p.is_muted) {
      toast({ title: 'Muted', description: 'You cannot send files while muted', variant: 'destructive' });
      return;
    }

    const allowedTypes = ['.txt', '.java', '.c', '.py', '.cpp', '.zip', '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 50MB',
        variant: 'destructive',
      });
      return;
    }

    if (!allowedTypes.includes(ext)) {
      toast({
        title: 'Invalid file type',
        description: 'File type not allowed',
        variant: 'destructive',
      });
      return;
    }

    const filePath = `${r.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('room-files')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: 'Upload failed',
        description: uploadError.message,
        variant: 'destructive',
      });
      return;
    }

    const { data: urlData } = supabase.storage
      .from('room-files')
      .getPublicUrl(filePath);

    await supabase.from('messages').insert({
      room_id: r.id,
      participant_id: p.id,
      username: p.username,
      content: `Shared file: ${file.name}`,
      message_type: 'file',
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type,
    });
  }, []);

  // Host actions
  const toggleLock = useCallback(async () => {
    const r = roomRef.current;
    if (!r || !isHostRef.current) return;
    await supabase.from('rooms').update({ is_locked: !r.is_locked }).eq('id', r.id);
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!isHostRef.current && !participantRef.current) return;
    await supabase.from('messages').delete().eq('id', messageId);
  }, []);

  const muteUser = useCallback(async (participantId: string) => {
    if (!isHostRef.current) return;
    const target = participantsRef.current.find((p) => p.id === participantId);
    if (target) {
      await supabase
        .from('room_participants')
        .update({ is_muted: !target.is_muted })
        .eq('id', participantId);
    }
  }, []);

  const kickUser = useCallback(async (participantId: string, ban: boolean = false) => {
    const r = roomRef.current;
    if (!isHostRef.current || !r) return;

    const target = participantsRef.current.find((p) => p.id === participantId);
    if (!target) return;

    if (ban) {
      await supabase.from('room_bans').insert({
        room_id: r.id,
        session_id: target.session_id,
      });
    }

    await supabase.from('room_participants').update({ is_banned: true }).eq('id', participantId);

    await supabase.from('messages').insert({
      room_id: r.id,
      username: 'System',
      content: `${target.username} was ${ban ? 'banned' : 'kicked'} from the room`,
      message_type: 'system',
      is_system: true,
    });
  }, []);

  const leaveRoom = useCallback(async () => {
    const r = roomRef.current;
    const p = participantRef.current;

    setMessages([]);
    setDbParticipants(new Map());
    setPresenceState({});
    setParticipant(null);
    setIsHost(false);
    setError(null);
    setRoom(null);

    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (r?.id && p?.id) {
      // Best effort leave
      await supabase.from('messages').insert({
        room_id: r.id,
        username: 'System',
        content: `${p.username} left the room`,
        message_type: 'system',
        is_system: true,
      });

      await supabase.from('room_participants').delete().eq('id', p.id);
    }
  }, []);

  return {
    room,
    messages,
    participants,
    participant,
    isHost,
    loading,
    error,
    sendMessage,
    sendFile,
    toggleLock,
    deleteMessage,
    muteUser,
    kickUser,
    leaveRoom,
  };
};
