interface Room {
  id: string;
  code: string;
  name: string;
  host_session_id: string; // was host_fingerprint
  created_at: string;
}

interface Message {
  id: string;
  room_id: string;
  username: string;
  content: string;
  created_at: string;
}

export const localDB = {
  createRoom: (room: Omit<Room, 'id' | 'created_at'>): Room => {
    const rooms = JSON.parse(localStorage.getItem('shareroom_rooms') || '[]');

    // Check if room code already exists
    const existing = rooms.find((r: Room) => r.code === room.code);
    if (existing) return existing;

    const newRoom: Room = {
      ...room,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
    };

    rooms.push(newRoom);
    localStorage.setItem('shareroom_rooms', JSON.stringify(rooms));

    return newRoom;
  },

  getRoom: (code: string): Room | null => {
    const rooms = JSON.parse(localStorage.getItem('shareroom_rooms') || '[]');
    return rooms.find((room: Room) => room.code === code) || null;
  },

  addMessage: (message: Omit<Message, 'id' | 'created_at'>): Message => {
    const newMessage: Message = {
      ...message,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
    };

    const messages = JSON.parse(localStorage.getItem('shareroom_messages') || '[]');
    messages.push(newMessage);
    localStorage.setItem('shareroom_messages', JSON.stringify(messages));

    return newMessage;
  },

  getMessages: (roomId: string): Message[] => {
    const messages = JSON.parse(localStorage.getItem('shareroom_messages') || '[]');
    return messages.filter((msg: Message) => msg.room_id === roomId);
  }
};