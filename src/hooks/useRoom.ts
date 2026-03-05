import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/session';
import { toast } from '@/hooks/use-toast';
import { importKey, encrypt, decrypt, isEncrypted } from '@/lib/e2e';

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

export interface Participant {
  id: string;
  room_id: string;
  username: string;
  session_id: string;
  is_muted: boolean;
  is_banned: boolean;
  joined_at: string;
  presence_status?: 'online' | 'away';
  last_seen_at?: string;
  role?: 'host' | 'member';
}

interface Room {
  id: string;
  code: string;
  name: string;
  host_session_id: string;
  is_locked: boolean;
  created_at: string;
  last_activity_at: string;
  expires_at: string;
}

interface PresenceState {
  [key: string]: {
    session_id: string;
    username: string;
    joined_at: string;
    user_id: string;
    status?: 'online' | 'away';
    last_seen_at?: string;
    role?: 'host' | 'member';
  }[];
}

export interface Reaction {
  id: string;
  message_id: string;
  session_id: string;
  emoji: string;
  created_at: string;
}

export const useRoom = (roomCode: string | null, username: string | null, encryptionKey?: string) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [dbParticipants, setDbParticipants] = useState<Map<string, Participant>>(new Map());
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const [reactions, setReactions] = useState<Map<string, Reaction[]>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  // Derived participants list
  const participants = Object.values(presenceState).flat().map(p => {
    const dbP = dbParticipants.get(p.session_id);
    return {
      id: dbP?.id || 'temp-' + p.session_id,
      room_id: room?.id || '',
      username: p.username,
      session_id: p.session_id,
      is_muted: dbP?.is_muted || false,
      is_banned: dbP?.is_banned || false,
      joined_at: p.joined_at,
      presence_status: p.status || 'online',
      last_seen_at: p.last_seen_at || p.joined_at,
      role: p.role || (room?.host_session_id === p.session_id ? 'host' : 'member'),
    };
  }).filter(p => !p.is_banned);

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // E2E: hold the imported CryptoKey in a ref (avoids re-importing on every render)
  const cryptoKeyRef = useRef<CryptoKey | null>(null);

  // Import the encryption key string once when it changes
  useEffect(() => {
    if (!encryptionKey) { cryptoKeyRef.current = null; return; }
    importKey(encryptionKey)
      .then(k => { cryptoKeyRef.current = k; })
      .catch(err => console.error('[E2E] Failed to import key:', err));
  }, [encryptionKey]);

  /** Decrypt a message's content field if E2E is active and content looks encrypted */
  const decryptContent = useCallback(async (msg: Message): Promise<Message> => {
    const key = cryptoKeyRef.current;
    if (!key || !msg.content || msg.is_system || msg.message_type === 'file') return msg;
    try {
      if (isEncrypted(msg.content)) {
        return { ...msg, content: await decrypt(msg.content, key) };
      }
    } catch {
      // Decryption failure = leave as-is (e.g. system messages, pre-E2E messages)
    }
    return msg;
  }, []);

  /** Encrypt text if E2E key is loaded */
  const encryptContent = useCallback(async (text: string): Promise<string> => {
    const key = cryptoKeyRef.current;
    if (!key) return text;
    return encrypt(text, key);
  }, []);

  // Refs for stable callbacks
  const roomRef = useRef(room);
  const participantsRef = useRef(participants);
  const participantRef = useRef(participant);
  const isHostRef = useRef(isHost);

  // Typing state refs
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => { roomRef.current = room; }, [room]);
  useEffect(() => { participantsRef.current = participants; }, [participants]);
  useEffect(() => { participantRef.current = participant; }, [participant]);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);

  // Initialize session
  useEffect(() => {
    getSessionId()
      .then(setSessionId)
      .catch((err) => {
        console.error('Failed to initialize session:', err);
        setError('Unable to initialize session. Please refresh.');
        setLoading(false);
      });
  }, []);

  // Join room
  const joinRoom = useCallback(async () => {
    if (!roomCode || !username || !sessionId) return;

    try {
      setLoading(true);
      setError(null);

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

      // Check if room is locked
      if (roomData.is_locked && !existingParticipant && roomData.host_session_id !== sessionId) {
        setError('Room is locked');
        setLoading(false);
        return;
      }

      let currentParticipant = existingParticipant;

      if (!existingParticipant) {
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

        await supabase.from('messages').insert({
          room_id: roomData.id,
          participant_id: newParticipant.id,
          username,
          content: `${username} joined the room`,
          message_type: 'system',
          is_system: true,
        });
      } else {
        if (existingParticipant.username !== username) {
          await supabase
            .from('room_participants')
            .update({ username })
            .eq('id', existingParticipant.id);
        }
      }

      setParticipant(currentParticipant);

      // Fetch messages and decrypt if E2E is active
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomData.id)
        .order('created_at', { ascending: true });

      const decrypted = await Promise.all((messagesData || []).map(decryptContent));
      setMessages(decrypted);

      // Fetch initial DB participants
      const { data: participantsData } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', roomData.id);

      const partsMap = new Map<string, Participant>();
      if (participantsData) {
        participantsData.forEach(p => partsMap.set(p.session_id, p));
      }
      setDbParticipants(partsMap);

      // Fetch reactions for all messages in this room
      if (messagesData && messagesData.length > 0) {
        const messageIds = messagesData.map(m => m.id);
        const { data: reactionsData } = await supabase
          .from('message_reactions')
          .select('*')
          .in('message_id', messageIds);

        if (reactionsData) {
          const reactionsMap = new Map<string, Reaction[]>();
          reactionsData.forEach(r => {
            const existing = reactionsMap.get(r.message_id) || [];
            existing.push(r);
            reactionsMap.set(r.message_id, existing);
          });
          setReactions(reactionsMap);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error joining room:', err);
      if (err instanceof Error) {
        if (err.message.includes('not found') || err.message.includes('banned')) {
          setError(err.message);
        } else {
          setError(`Unable to join room: ${err.message}`);
        }
      } else {
        setError('Unable to join room. Please try again.');
      }
      setLoading(false);
    }
  }, [roomCode, username, sessionId]);

  const leaveRoom = useCallback(async () => {
    const r = roomRef.current;
    const p = participantRef.current;
    let leaveError = false;

    try {
      if (r?.id && p?.id) {
        await supabase.from('messages').insert({
          room_id: r.id,
          username: 'System',
          content: `${p.username} left the room`,
          message_type: 'system',
          is_system: true,
        });

        await supabase.from('room_participants').delete().eq('id', p.id);
      }

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    } catch (err) {
      console.error('Error leaving room:', err);
      setError('Failed to leave room properly');
      leaveError = true;
    } finally {
      // Clear state after async operations complete
      setMessages([]);
      setDbParticipants(new Map());
      setPresenceState({});
      setParticipant(null);
      setIsHost(false);
      // Only clear error if no error occurred during leave
      if (!leaveError) {
        setError(null);
      }
      setRoom(null);
      setReactions(new Map());
      setTypingUsers(new Map());
    }
  }, []);

  const updatePresenceStatus = useCallback(async (status: 'online' | 'away') => {
    if (!channelRef.current || !sessionId || !username) return;

    // Get existing presence to preserve joined_at
    const currentPresence = channelRef.current.presenceState() as unknown as PresenceState;
    const myPresence = currentPresence[sessionId]?.[0];
    const existingJoinedAt = myPresence?.joined_at || new Date().toISOString();

    await channelRef.current.track({
      session_id: sessionId,
      username,
      joined_at: existingJoinedAt,
      status,
      last_seen_at: new Date().toISOString(),
      role: roomRef.current?.host_session_id === sessionId ? 'host' : 'member',
    });
  }, [sessionId, username]);

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
        setPresenceState(channel.presenceState() as unknown as PresenceState);
      })
      .on('presence', { event: 'join' }, () => {
        // Optional: Toast joined
      })
      .on('presence', { event: 'leave' }, () => {
        // Optional: Toast left
      })
      // Typing indicator broadcast
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.session_id === sessionId) return;
        const uname = payload.username as string;
        const sid = payload.session_id as string;

        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.set(sid, uname);
          return newMap;
        });

        // Clear existing timeout for this session
        const existingTimeout = typingTimeoutsRef.current.get(sid);
        if (existingTimeout) clearTimeout(existingTimeout);

        // Set new timeout to remove after 3s
        const timeout = setTimeout(() => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.delete(sid);
            return newMap;
          });
          typingTimeoutsRef.current.delete(sid);
        }, 3000);
        typingTimeoutsRef.current.set(sid, timeout);
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
          // Decrypt incoming message before pushing to state
          decryptContent(payload.new as Message).then(decryptedMsg => {
            setMessages((prev) => [...prev, decryptedMsg]);
          });
          // When a user sends a message, remove them from typing
          const msg = payload.new as Message;
          if (msg.participant_id) {
            setTypingUsers(prev => {
              const newMap = new Map(prev);
              for (const [sid, uname] of newMap) {
                if (uname === msg.username) { newMap.delete(sid); break; }
              }
              return newMap;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          // Decrypt updated message before applying to state
          decryptContent(payload.new as Message).then(decryptedMsg => {
            setMessages((prev) => prev.map((m) => (m.id === decryptedMsg.id ? decryptedMsg : m)));
          });
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
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newParticipant = payload.new as Participant;

            setDbParticipants((prev) => {
              const newMap = new Map(prev);
              newMap.set(newParticipant.session_id, newParticipant);
              return newMap;
            });

            if (newParticipant.session_id === sessionId) {
              setParticipant(newParticipant);
              if (newParticipant.is_banned) {
                setError('You have been banned from the room');
                leaveRoom();
              }
            }
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
      // Reactions realtime
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions',
        },
        (payload) => {
          const newReaction = payload.new as Reaction;
          // Validate reaction belongs to a message in this room
          setMessages(currentMessages => {
            const messageInRoom = currentMessages.find(m => m.id === newReaction.message_id);
            if (messageInRoom) {
              setReactions(prev => {
                const newMap = new Map(prev);
                const existing = newMap.get(newReaction.message_id) || [];
                // Avoid duplicates
                if (!existing.find(r => r.id === newReaction.id)) {
                  newMap.set(newReaction.message_id, [...existing, newReaction]);
                }
                return newMap;
              });
            }
            return currentMessages;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'message_reactions',
        },
        (payload) => {
          const oldReaction = payload.old as { id: string; message_id: string };
          // Validate reaction belongs to a message in this room
          setMessages(currentMessages => {
            const messageInRoom = currentMessages.find(m => m.id === oldReaction.message_id);
            if (messageInRoom) {
              setReactions(prev => {
                const newMap = new Map(prev);
                const existing = newMap.get(oldReaction.message_id) || [];
                newMap.set(
                  oldReaction.message_id,
                  existing.filter(r => r.id !== oldReaction.id)
                );
                return newMap;
              });
            }
            return currentMessages;
          });
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            session_id: sessionId,
            username: username,
            joined_at: new Date().toISOString(),
            status: 'online',
            last_seen_at: new Date().toISOString(),
            role: room.host_session_id === sessionId ? 'host' : 'member',
          });
        }
      });

    const timeouts = typingTimeoutsRef.current;

    return () => {
      supabase.removeChannel(channel);
      // Clear all typing timeouts
      timeouts.forEach(t => clearTimeout(t));
      timeouts.clear();
    };
  }, [room, sessionId, username, leaveRoom]);

  useEffect(() => {
    if (!sessionId || !username || !channelRef.current) return;

    const goAway = () => {
      updatePresenceStatus('away');
    };
    const goOnline = () => {
      updatePresenceStatus('online');
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        goAway();
      } else {
        goOnline();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', goAway);
    window.addEventListener('focus', goOnline);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', goAway);
      window.removeEventListener('focus', goOnline);
    };
  }, [sessionId, username, room, updatePresenceStatus]);

  // Join when ready
  useEffect(() => {
    if (roomCode && username && sessionId) {
      joinRoom();
    }
  }, [roomCode, username, sessionId, joinRoom]);

  // Broadcast typing
  const broadcastTyping = useCallback(() => {
    if (!channelRef.current || !sessionId || !username) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { session_id: sessionId, username },
    });
  }, [sessionId, username]);

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

    // Encrypt content before storing (no-op if no key loaded)
    const encryptedContent = await encryptContent(content);

    await supabase.from('messages').insert({
      room_id: r.id,
      participant_id: p.id,
      username: p.username,
      content: encryptedContent,
      message_type: 'text',
      reply_to_id: replyToId || null,
    });
  }, [encryptContent]);

  // Send file
  const sendFile = useCallback(async (fileOrFiles: File | File[]) => {
    const r = roomRef.current;
    const p = participantRef.current;

    if (!r || !p) return;

    if (p.is_muted) {
      toast({ title: 'Muted', description: 'You cannot send files while muted', variant: 'destructive' });
      return;
    }

    const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
    const allowedTypes = ['.txt', '.java', '.c', '.py', '.cpp', '.zip', '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const maxSize = 50 * 1024 * 1024;

    for (const file of files) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 50MB`,
          variant: 'destructive',
        });
        continue;
      }

      if (!allowedTypes.includes(ext)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not allowed`,
          variant: 'destructive',
        });
        continue;
      }

      setUploadingFiles((prev) => [...prev, file.name]);
      try {
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
          continue;
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
      } finally {
        setUploadingFiles((prev) => prev.filter((name) => name !== file.name));
      }
    }
  }, []);

  const updateMessage = useCallback(async (messageId: string, content: string) => {
    const p = participantRef.current;
    if (!p) return;
    // Encrypt edit content before storing
    const encryptedContent = await encryptContent(content);
    await supabase
      .from('messages')
      .update({ content: encryptedContent, edited_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('participant_id', p.id);
  }, [encryptContent]);

  // Toggle reaction
  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!sessionId) return;

    // Check if already reacted
    const existing = reactions.get(messageId)?.find(
      r => r.session_id === sessionId && r.emoji === emoji
    );

    if (existing) {
      // Remove reaction
      await supabase.from('message_reactions').delete().eq('id', existing.id);
    } else {
      // Add reaction
      await supabase.from('message_reactions').insert({
        message_id: messageId,
        session_id: sessionId,
        emoji,
      });
    }
  }, [sessionId, reactions]);

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



  return {
    room,
    messages,
    participants,
    participant,
    isHost,
    loading,
    error,
    sessionId,
    reactions,
    typingUsers,
    uploadingFiles,
    sendMessage,
    sendFile,
    updateMessage,
    toggleLock,
    deleteMessage,
    muteUser,
    kickUser,
    leaveRoom,
    broadcastTyping,
    toggleReaction,
    updatePresenceStatus,
  };
};
