# ShareRoom

**Temporary rooms for quick, account-free sharing.**  
**No history by design.**

---

## What is ShareRoom?

ShareRoom is a lightweight web application for one-time, real-time sharing.  
It lets people create a temporary room, share messages or files, and leave — without accounts and without leaving long-term traces behind.

The product is intentionally constrained.  
If something should be saved permanently, ShareRoom is not the right tool.

---

## What ShareRoom Is

- Temporary, real-time chat rooms  
- Account-free and frictionless  
- Designed for short-lived collaboration  
- Enforced expiry at the database level  
- Focused on the moment, not retention  

---

## What ShareRoom Is Not

- Not a messaging history  
- Not cloud storage  
- Not a document editor  
- Not a collaboration archive  
- Not anonymous by cryptographic guarantee  

These are intentional non-goals.

---

## How It Works

### 1. Create a room
Enter a name and a temporary room is created instantly.

### 2. Share via link or code
Others join the room and can chat or share files in real time.

### 3. Room expires
After expiry, the room and its data become inaccessible via the application.

---

## Core Guarantees

### No accounts
There is no user registration, email, or profile system.

### Time-bounded access
Every room has a fixed expiration time.

### No long-term history
Once a room expires, its content cannot be accessed through the app.

### Backend-enforced rules
Access control and expiry are enforced at the database level using Row Level Security.

---

## Technical Overview

### Frontend

- React 18 + Vite  
- TypeScript  
- Tailwind CSS  
- shadcn/ui (Radix UI primitives)  
- framer-motion (restrained, non-looping animations)  
- TanStack Query for server state  
- Supabase JS for realtime subscriptions  

### Backend

- Supabase (PostgreSQL)  
- Server-side RPCs for atomic operations (room creation)  
- Supabase Realtime for live updates  
- Supabase Storage for temporary file sharing  
- Row Level Security enforcing room expiry  
- Scheduled backend cleanup for storage reclamation  

### Identity Model

- No authentication system  
- Session-scoped identifiers stored client-side  
- No cross-room identity or tracking  

---

## Ephemerality Model (Important)

- Rooms and messages have a fixed `expires_at` timestamp.  

Once expired:
- Data becomes inaccessible via the API  
- Access is blocked by database policies  

Physical deletion occurs later as part of backend cleanup.

Expiry is **access control**, not a promise of immediate secure erasure.  
This distinction is intentional and documented.

---

## Local Development

### Prerequisites

- Node.js (18+ recommended)  
- npm or pnpm  
- Supabase project  

### Setup

```bash
git clone https://github.com/<your-username>/Share-Room.git
cd Share-Room
npm install
