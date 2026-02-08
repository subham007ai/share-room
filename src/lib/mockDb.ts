// import { generateRoomCode } from './fingerprint'; // Removed

const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Types matching the Supabase schema
export interface Room {
    id: string;
    code: string;
    name: string;
    host_session_id: string;
    is_locked: boolean;
    created_at: string;
    last_activity_at: string;
}

export interface Participant {
    id: string;
    room_id: string;
    username: string;
    session_id: string;
    is_muted: boolean;
    is_banned: boolean;
    joined_at: string;
}

export interface Message {
    id: string;
    room_id: string;
    participant_id: string | null;
    username: string;
    content: string | null;
    message_type: 'text' | 'file' | 'system';
    reply_to_id: string | null;
    file_url: string | null;
    file_name: string | null;
    file_type: string | null;
    is_system: boolean;
    created_at: string;
}

type EventCallback = () => void;

class MockDb {
    private channel: BroadcastChannel;
    private listeners: Map<string, Set<EventCallback>> = new Map();

    constructor() {
        this.channel = new BroadcastChannel('shareroom_db_sync');
        this.channel.onmessage = (event) => {
            this.notifyListeners(event.data.type);
        };
    }

    private notifyListeners(type: string) {
        const callbacks = this.listeners.get(type);
        if (callbacks) {
            callbacks.forEach(cb => cb());
        }
    }

    subscribe(type: string, callback: EventCallback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)?.add(callback);
        return () => {
            this.listeners.get(type)?.delete(callback);
        };
    }

    private getItems<T>(key: string): T[] {
        const items = localStorage.getItem(key);
        return items ? JSON.parse(items) : [];
    }

    private setItems<T>(key: string, items: T[]) {
        localStorage.setItem(key, JSON.stringify(items));
        this.notifyListeners(key);
        this.channel.postMessage({ type: key });
    }

    // Room Methods
    async createRoom(name: string, host_session_id: string): Promise<Room> {
        const rooms = this.getItems<Room>('rooms');
        const newRoom: Room = {
            id: crypto.randomUUID(),
            code: generateRoomCode(),
            name,
            host_session_id,
            is_locked: false,
            created_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
        };
        rooms.push(newRoom);
        this.setItems('rooms', rooms);
        return newRoom;
    }

    async getRoomByCode(code: string): Promise<Room | null> {
        const rooms = this.getItems<Room>('rooms');
        return rooms.find(r => r.code === code) || null;
    }

    async getRoomById(id: string): Promise<Room | null> {
        const rooms = this.getItems<Room>('rooms');
        return rooms.find(r => r.id === id) || null;
    }

    // Participant Methods
    async joinRoom(roomId: string, username: string, session_id: string): Promise<Participant> {
        const participants = this.getItems<Participant>('participants');
        let participant = participants.find(p => p.room_id === roomId && p.session_id === session_id);

        if (participant) {
            // Update username if changed
            if (participant.username !== username) {
                participant.username = username;
                this.setItems('participants', participants);
            }
            return participant;
        }

        participant = {
            id: crypto.randomUUID(),
            room_id: roomId,
            username,
            session_id,
            is_muted: false,
            is_banned: false,
            joined_at: new Date().toISOString(),
        };

        participants.push(participant);
        this.setItems('participants', participants);

        // Add system message
        await this.addMessage({
            room_id: roomId,
            participant_id: participant.id,
            username: 'System',
            content: `${username} joined the room`,
            message_type: 'system',
            is_system: true,
        } as any);

        return participant;
    }

    async getParticipants(roomId: string): Promise<Participant[]> {
        const participants = this.getItems<Participant>('participants');
        return participants.filter(p => p.room_id === roomId && !p.is_banned);
    }

    // Message Methods
    async getMessages(roomId: string): Promise<Message[]> {
        const messages = this.getItems<Message>('messages');
        return messages
            .filter(m => m.room_id === roomId)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    async addMessage(msg: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
        const messages = this.getItems<Message>('messages');
        const newMessage: Message = {
            ...msg,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
        };
        messages.push(newMessage);
        this.setItems('messages', messages);
        return newMessage;
    }

    async deleteMessage(id: string) {
        const messages = this.getItems<Message>('messages');
        const filtered = messages.filter(m => m.id !== id);
        this.setItems('messages', filtered);
    }

    // Management
    async toggleLock(roomId: string) {
        const rooms = this.getItems<Room>('rooms');
        const room = rooms.find(r => r.id === roomId);
        if (room) {
            room.is_locked = !room.is_locked;
            this.setItems('rooms', rooms);
        }
    }

    async leaveRoom(roomId: string, participantId: string) {
        const participants = this.getItems<Participant>('participants');
        const messages = this.getItems<Message>('messages');

        const participantIndex = participants.findIndex(p => p.id === participantId);
        if (participantIndex === -1) return;

        const username = participants[participantIndex].username;

        // Remove participant
        participants.splice(participantIndex, 1);
        this.setItems('participants', participants);

        // Add leave message
        await this.addMessage({
            room_id: roomId,
            participant_id: participantId,
            username: 'System',
            content: `${username} left the room`,
            message_type: 'system',
            is_system: true,
        } as any);
    }
}

export const mockDb = new MockDb();
