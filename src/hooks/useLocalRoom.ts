import { useState, useEffect } from 'react';
import { localDB } from '@/lib/localStorage';

interface Message {
  id: string;
  room_id: string;
  username: string;
  content: string;
  created_at: string;
}

interface Room {
  id: string;
  code: string;
  name: string;
  host_session_id: string;
  created_at: string;
}

export const useLocalRoom = (roomCode: string | null, username: string | null) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomCode || !username) {
      setLoading(false);
      return;
    }

    try {
      let foundRoom = localDB.getRoom(roomCode.toUpperCase());
      if (!foundRoom) {
        foundRoom = localDB.createRoom({
          code: roomCode.toUpperCase(),
          name: `Room ${roomCode.toUpperCase()}`,
          host_session_id: 'temp-host',
        });
      }

      setRoom(foundRoom);
      const roomMessages = localDB.getMessages(foundRoom.id);
      setMessages(roomMessages);
      setError(null);
    } catch (err) {
      console.error('Error loading room:', err);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [roomCode, username]);

  // Listen for storage changes to sync messages across tabs
  useEffect(() => {
    if (!room) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shareroom_messages') {
        const roomMessages = localDB.getMessages(room.id);
        setMessages(roomMessages);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [room]);

  const sendMessage = async (content: string) => {
    if (!room || !username) return;

    const message = localDB.addMessage({
      room_id: room.id,
      username,
      content,
    });

    setMessages(prev => [...prev, message]);

    // Trigger storage event for other tabs
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'shareroom_messages',
      newValue: localStorage.getItem('shareroom_messages')
    }));
  };

  const leaveRoom = async () => {
    // Simple cleanup for localStorage version
    setRoom(null);
    setMessages([]);
  };

  return {
    room,
    messages,
    participants: [], // Simplified - no real participants tracking
    participant: { username, id: 'local-user' },
    isHost: false, // Simplified
    loading,
    error,
    sendMessage,
    sendFile: async () => { }, // Not implemented for localStorage version
    toggleLock: async () => { },
    deleteMessage: async () => { },
    muteUser: async () => { },
    kickUser: async () => { },
    leaveRoom,
  };
};