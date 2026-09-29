# SkillSwap — Peer-to-Peer Skill Exchange Platform

SkillSwap is a full-stack, real-time peer-to-peer skill exchange platform built with Next.js 16 (App Router), Supabase (Auth, Postgres, RLS, Realtime, Storage), and WebRTC. Users teach skills they excel at to earn credits, and spend credits to book 1-on-1 video sessions with peers to learn new skills.

---

## Architecture & System Overview

- **Frontend & Server Components**: Next.js 16 (React 19, App Router, TypeScript, Tailwind CSS).
- **Authentication & Authorization**: Supabase Auth (Email/Password, Session recovery, Server-side SSR session verification, route protection middleware).
- **Database & Storage**: PostgreSQL with Supabase Row Level Security (RLS) on all tables, stored procedures, audit logging, and Supabase Storage avatars bucket.
- **Credit Engine**: Secure atomic transactions with database-level balance constraints (`CHECK (balance >= 0)`) and immutable ledger tracking (`credit_transactions`).
- **Real-Time Communication**:
  - **Chat**: One-to-one messaging via Supabase Realtime postgres_changes broadcast.
  - **Notifications**: Instant unread badges and updates for bookings, requests, and completions.
  - **Video Calls & Screen Sharing**: WebRTC peer-to-peer video, audio, and screen sharing with SDP/ICE signaling via Supabase Realtime broadcast channels and STUN/TURN fallback.
- **Reviews & Ratings**: Post-session verified rating system (1–5 stars with written reviews) linked exclusively to completed sessions.

---

## Tech Stack

| Domain | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI & Styling | React 19, Tailwind CSS, Lucide Icons |
| Database | PostgreSQL (Supabase) |
| Auth & Security | Supabase Auth (SSR Cookie Auth), RLS Policies, Strict CSP, Security Headers |
| Realtime | Supabase Realtime Channels |
| Media & Video | WebRTC (`RTCPeerConnection`), Screen Capture API |
| Testing | Node.js Test Runner / TSX |
| Deployment | Vercel / Docker / Node.js Standalone |

---

## Environment Variables

Copy `.env.example` to `.env.local` for development:

```bash
cp .env.example .env.local
```

| Variable | Description | Example / Default |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Base canonical domain of the web app | `http://localhost:3000` (Dev) / `https://yourdomain.com` (Prod) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project API URL | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Client Key (JWT) | `eyJhbGciOi...` |
| `NEXT_PUBLIC_TURN_SERVER_URL` | *(Optional)* TURN server URL for restricted NAT/firewalls | `turn:turn.example.com:3478?transport=udp` |
| `NEXT_PUBLIC_TURN_USERNAME` | *(Optional)* TURN server username | `turn_user` |
| `NEXT_PUBLIC_TURN_CREDENTIAL` | *(Optional)* TURN server password / credential | `turn_password` |

---

## Database Migrations & Supabase Setup

All migrations are stored in chronological sequence under `supabase/migrations/`:

1. `20260922000000_initial_schema.sql` — Profiles, Skills, User Skills, Availability.
2. `20260922010000_phase6_profiles_storage_skills.sql` — Avatars storage bucket and storage RLS.
3. `20260922020000_phase7_discovery_connections.sql` — Connection requests and matchmaking indexes.
4. `20260922030000_phase8_credits_system.sql` — Credit balances and immutable transaction ledger.
5. `20260922040000_phase9_sessions_booking.sql` — Sessions booking engine, state machine, and credit reservation.
6. `20260922050000_phase10_realtime_chat.sql` — Conversations, participants, and realtime messages.
7. `20260922060000_phase12_notifications_scheduling.sql` — Notifications schema and realtime triggers.
8. `20260924000000_phase13_reviews_ratings.sql` — Post-session review system and rating aggregates.
9. `20260925000000_phase14_security_hardening.sql` — Strict RLS audit, defense-in-depth functions, and data isolation.

### Applying Migrations Locally via Supabase CLI
```bash
npx supabase start
npx supabase db push
```

### Applying Migrations to Remote Production Supabase
```bash
npx supabase link --project-ref your-project-id
npx supabase db push
```

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# (Edit .env.local with your Supabase credentials)

# 3. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

## Quality & Testing Commands

SkillSwap includes end-to-end integration and security test suites verifying multi-user data isolation, atomic credit spending/earning, RLS enforcement, and WebRTC signaling.

```bash
# Run complete test suite (Phase 14 Security Hardening + Phase 15 Multi-User End-to-End)
npm test

# Type-check the codebase
npx tsc --noEmit

# Run ESLint check
npm run lint

# Build production bundle
npm run build
```

---

## Production Deployment Guide (Vercel)

### 1. Configure Supabase Production Project
1. Enable Email Auth in Supabase Dashboard -> Authentication -> Providers.
2. Under **Authentication -> URL Configuration**:
   - **Site URL**: `https://your-production-domain.com`
   - **Redirect URLs**: Add `https://your-production-domain.com/**`
3. Ensure Realtime is enabled for `conversations`, `messages`, and `notifications` tables under **Database -> Publications (`supabase_realtime`)**.

### 2. Configure Vercel Project
1. Link your repository in [Vercel](https://vercel.com).
2. Set Environment Variables in the Vercel Project Settings:
   - `NEXT_PUBLIC_APP_URL` = `https://your-production-domain.com`
   - `NEXT_PUBLIC_SUPABASE_URL` = Your production Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your production Supabase Anon Key
   - *(Optional)* TURN server credentials for enterprise firewall traversal.
3. Build Settings:
   - Framework: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Deploy the project.

---

## Security Model

- **Row Level Security (RLS)**: Enforced on 100% of public database tables. No user can read or write rows belonging to other users unless explicitly allowed by an established connection or confirmed session.
- **Server Identity Verification**: User identity is verified server-side (`auth.uid()`) to eliminate client-spoofed identities.
- **Balance Invariants**: Database check constraints prevent credit balances from ever dipping below zero.
- **HTTP Security Headers**: Strict Content-Security-Policy (CSP), HTTP Strict Transport Security (HSTS), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Search Engine Privacy**: Private user dashboards and communication routes (`/dashboard/*`) are disallowed in `robots.txt` and protected by authentication middleware.
