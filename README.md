# SkillSwap — Peer-to-Peer College Skill Exchange Platform

SkillSwap is a structured peer-to-peer skill exchange platform designed for college students to trade knowledge (peer teaching and learning), earn credits through verified mentorship sessions, match intelligently with fellow students across campuses, and communicate in real time.

> **Current Status**: **Phases 1 through 7 Complete** (Architecture, Profiles & Avatars, Skills Catalog, Discovery & Matching Engine, Exchange Requests & Sessions, Credit Wallet & Escrow Engine, and Real-Time Chat & Direct Messaging).

---

## 1. System Architecture

SkillSwap uses a high-performance modular monolith architecture with a decoupled React frontend, Supabase Auth integration, and a Spring Boot backend supporting both REST APIs and WebSocket STOMP messaging:

```
Browser (React 19 + TypeScript + Vite + Tailwind CSS)
  │
  ├── 1. Supabase Auth & Storage (Sign Up / Sign In / Avatar Uploads / Session Management)
  │      └── Returns JWT Access Token
  │
  ├── 2. Spring Boot REST API (/api/v1) [Port 8081]
  │      ├── Public: /health, /version, /skills, /skills/categories, /swagger-ui.html
  │      └── Protected: /users, /profile, /discovery, /exchange-requests, /sessions, /wallet, /conversations
  │
  └── 3. Spring Boot WebSocket STOMP (/ws) [Port 8081]
         ├── Handshake: Subprotocol / Token Auth Interceptor
         ├── Inbound Messages: /app/chat.sendMessage, /app/chat.markRead
         └── Outbound Topics & Queues: /user/queue/messages, /topic/conversations.{id}
                 │
                 ▼
         PostgreSQL / Supabase Database (Flyway Migrations: V1 through V7)
```

---

## 2. Completed Milestones & Phases

| Phase | Milestone | Core Features |
|---|---|---|
| **Phase 1** | Architecture & Foundation | Spring Boot baseline, Flyway migrations, CORS configuration, centralized error envelope, and system health telemetry. |
| **Phase 2** | Auth, User & Student Profiles | Supabase Auth integration, JWT claim validation, student profile management, photo/avatar uploading, and department/campus tracking. |
| **Phase 3** | Skills Catalog & Skill Profiles | Category taxonomy, catalog search/filter, student teaching & learning skill portfolios, and 4-tier proficiency ratings (Beginner to Expert). |
| **Phase 4** | Skill Discovery & Matching Engine | Deterministic multi-factor match scoring algorithm (Mutual swap, Learn/Teach modes, college proximity, and proficiency alignment). |
| **Phase 5** | Exchange Requests & Session Lifecycle | Exchange proposals, incoming/outgoing request management, session transitions (`SCHEDULED` ➔ `IN_PROGRESS` ➔ `COMPLETED` / `CANCELLED`). |
| **Phase 6** | Credit System & Wallet Engine | Virtual credits economy, initial balance grant, escrow holding during sessions, automated credit settlement upon completion, and ledger audit history. |
| **Phase 7** | Real-Time Chat & Direct Messaging | STOMP over SockJS WebSocket broker, conversation creation, direct messaging, unread counts, and live message dispatching. |
| **Design Polish** | Premium Color System Redesign | Midnight Navy (`#0B1220`), Deep Navy (`#111827`), Emerald (`#10B981`), and Champagne Gold (`#D4AF6A`) luxury theme. |

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + PostCSS + Google Fonts (`Plus Jakarta Sans` & `Inter`) + Lucide React icons
- **Color System**: Midnight Navy (`#0B1220`), Deep Navy (`#111827`), Slate Navy (`#1E293B`), Emerald (`#10B981`), Champagne Gold (`#D4AF6A`), and Warm Ivory (`#F8F5ED`)
- **Real-Time Communication**: `@stomp/stompjs` + `sockjs-client`
- **Routing & Auth Protection**: React Router 7 (`ProtectedRoute`, `PublicOnlyRoute`)
- **Authentication & Storage**: `@supabase/supabase-js` Auth Provider with persistent token injection and avatar bucket uploads
- **State & Networking**: TanStack Query v5 + Centralized `ApiClient` + Zustand client UI store
- **Testing**: Vitest + React Testing Library + jsdom

### Backend
- **Framework**: Java 21+ / Spring Boot 3.3.5
- **Modules**: Spring Web, Spring WebSocket / Messaging, Spring Data JPA, Spring Validation, Spring Security, JJWT (v0.12.6)
- **Real-Time Engine**: STOMP In-Memory Message Broker with `ChannelInterceptor` JWT authentication
- **Database Engine**: PostgreSQL / Supabase (with H2 in-memory test profile)
- **Database Migrations**: Flyway Schema Versioning (`V1` through `V7`)
- **Documentation**: SpringDoc OpenAPI 3.0 / Swagger UI with `BearerAuth` scheme
- **Testing**: JUnit 5 + Mockito + Spring Boot Test + MockMvc

---

## 4. Repository Structure

```
SkillSwap/
├── frontend/                     # React 19 + TypeScript Vite Frontend
│   ├── src/
│   │   ├── auth/                 # Supabase AuthContext, useAuth, ProtectedRoute, PublicOnlyRoute
│   │   ├── components/           # Reusable UI primitives, Discovery, Exchange, Chat, Sessions, Skills
│   │   ├── layouts/              # AppLayout shell with Midnight Navy top nav, sidebar & footer
│   │   ├── pages/                # Dashboard, Discover, Requests, Sessions, Messages, Wallet, Profile, etc.
│   │   ├── hooks/                # TanStack Query & WebSocket custom hooks (useChat, useWallet, useDiscovery, etc.)
│   │   ├── services/             # Centralized ApiClient, chatService, walletService, sessionService, etc.
│   │   ├── types/                # TypeScript API contracts & WebSocket payload models
│   │   └── routes/               # React Router configuration
│   ├── index.html                # Typography imports & root mount
│   ├── tailwind.config.js        # Design tokens & semantic color system
│   └── package.json
│
├── backend/                      # Spring Boot REST & WebSocket Backend
│   ├── src/main/java/com/skillswap/
│   │   ├── common/               # Config (CORS, Security, OpenAPI, WebSocket), Exceptions, Filters
│   │   ├── chat/                 # Real-time Chat (WebSocket Controller, REST Controller, Entities, Services)
│   │   ├── wallet/               # Credit Engine (Wallet Entity, Transaction Ledger, Escrow Service)
│   │   ├── session/              # Exchange Sessions (Session Entity, Lifecycle Service, Controller)
│   │   ├── exchange/             # Exchange Requests (Proposal Entity, State Machine, Controller)
│   │   ├── discovery/            # Matching Engine (Discovery Service, Multi-Factor Scoring)
│   │   ├── skill/                # Skills Catalog (Catalog Entities, User Skills, Proficiencies)
│   │   ├── profile/              # Student Profiles (Profile Entity, College & Department Tracking)
│   │   ├── user/                 # User Identity (User Entity, Supabase Mapping)
│   │   ├── health/               # GET /api/v1/health
│   │   └── SkillSwapApplication.java
│   ├── src/main/resources/
│   │   ├── application.yml       # Production & Default configurations
│   │   ├── application-dev.yml   # Development profile
│   │   ├── application-test.yml  # Isolated test profile
│   │   └── db/migration/         # Flyway SQL migration scripts (V1 through V7)
│   ├── src/test/                 # JUnit 5 & MockMvc unit/integration test suites
│   ├── pom.xml
│   └── mvnw & mvnw.cmd           # Maven Wrapper
│
├── AGENTS.md                     # AI Agent & Developer Guidelines
└── README.md                     # Project documentation
```

---

## 5. Environment Configuration

Copy the sample environment files:

```bash
# Frontend environment
cp frontend/.env.example frontend/.env

# Backend environment
cp backend/.env.example backend/.env
```

### Key Variables

| Variable | Scope | Default / Example | Purpose |
|---|---|---|---|
| `VITE_API_URL` | Frontend | `http://localhost:8081/api/v1` | Base URL for Spring Boot REST API |
| `VITE_WS_URL` | Frontend | `http://localhost:8081/ws` | WebSocket connection endpoint |
| `VITE_SUPABASE_URL` | Frontend | `https://your-project.supabase.co` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | `your-supabase-anon-key` | Public Supabase Anon Key |
| `SERVER_PORT` | Backend | `8081` | Spring Boot HTTP/WS listening port |
| `DATABASE_URL` | Backend | `jdbc:postgresql://localhost:5432/skillswap` | PostgreSQL JDBC Connection URL |
| `DATABASE_USERNAME` | Backend | `postgres` | Database username |
| `DATABASE_PASSWORD` | Backend | `postgres` | Database password |
| `SUPABASE_JWT_SECRET` | Backend | `your-supabase-jwt-secret` | Supabase JWT Secret for token authentication |
| `CORS_ALLOWED_ORIGINS` | Backend | `http://localhost:5173,http://127.0.0.1:5173` | Allowed frontend origins |

---

## 6. Running Locally

### 1. Start the Backend
```bash
cd backend

# Run with development profile (PostgreSQL / Supabase)
./mvnw spring-boot:run

# Or run with self-contained test profile (in-memory database)
./mvnw spring-boot:run -Dspring-boot.run.profiles=test
```
Backend will start on: **`http://localhost:8081`**

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend development server will start on: **`http://localhost:5173`**

---

## 7. API & WebSocket Specifications

### Public Endpoints
- `GET /api/v1/health`: System health status and database connectivity
- `GET /api/v1/version`: API version and build metadata
- `GET /api/v1/skills/categories`: Retrieve all skill categories
- `GET /api/v1/skills`: Search and filter catalog skills (`?search=...&categoryId=...`)
- `GET /api/v1/skills/{id}`: Retrieve skill metadata by ID
- `GET /swagger-ui.html`: Interactive Swagger API documentation

### Protected REST Endpoints (`Authorization: Bearer <token>`)
- **User & Profile**:
  - `GET /api/v1/users/me` — Retrieve current authenticated user
  - `GET /api/v1/profile/me` & `PUT /api/v1/profile/me` — Manage student profile
  - `GET /api/v1/profile/me/skills` — Retrieve student's teaching & learning skills
  - `POST /api/v1/profile/me/skills` — Add skill to user portfolio
  - `PUT /api/v1/profile/me/skills/{id}` — Update skill proficiency or notes
  - `DELETE /api/v1/profile/me/skills/{id}` — Remove skill from profile
  - `GET /api/v1/profile/{userId}` — View public student profile
- **Discovery & Matching Engine**:
  - `GET /api/v1/discovery` — Run matching query (`?mode=MUTUAL|LEARN|TEACH&college=...&skillId=...`)
- **Exchange Requests**:
  - `GET /api/v1/exchange-requests/incoming` — Incoming exchange proposals
  - `GET /api/v1/exchange-requests/outgoing` — Sent exchange proposals
  - `POST /api/v1/exchange-requests` — Propose a skill exchange
  - `POST /api/v1/exchange-requests/{id}/accept` — Accept proposal (schedules session)
  - `POST /api/v1/exchange-requests/{id}/reject` — Decline proposal
  - `POST /api/v1/exchange-requests/{id}/cancel` — Cancel pending proposal
- **Exchange Sessions**:
  - `GET /api/v1/sessions` — List user sessions (`?status=SCHEDULED|IN_PROGRESS|COMPLETED`)
  - `GET /api/v1/sessions/{id}` — Retrieve session details
  - `POST /api/v1/sessions/{id}/start` — Transition to `IN_PROGRESS`
  - `POST /api/v1/sessions/{id}/complete` — Mark completed (triggers escrow release)
  - `POST /api/v1/sessions/{id}/cancel` — Cancel session
- **Credit Wallet & Ledger**:
  - `GET /api/v1/wallet` — View credit balance and escrow amounts
  - `GET /api/v1/wallet/transactions` — Transaction history and audit ledger
  - `POST /api/v1/wallet/settle/{sessionId}` — Settle session credits
- **Availability Management**:
  - `GET /api/v1/availability/me` — Retrieve student's recurring weekly availability slots
  - `GET /api/v1/availability/users/{userId}` — View peer's recurring availability slots
  - `POST /api/v1/availability` — Create weekly availability slot (validates time order & overlap)
  - `PUT /api/v1/availability/{id}` — Update recurring slot
  - `DELETE /api/v1/availability/{id}` — Remove recurring slot
- **Session Scheduling & Rescheduling**:
  - `POST /api/v1/sessions/{id}/schedule` — Schedule session time window (with conflict detection)
  - `POST /api/v1/sessions/{id}/reschedule` — Reschedule session and notify counterpart
  - `GET /api/v1/sessions/{id}/schedule` — Retrieve confirmed session schedule
- **In-App Notifications**:
  - `GET /api/v1/notifications` — List notifications with pagination and unread filter
  - `GET /api/v1/notifications/unread-count` — Count unread notifications
  - `PUT /api/v1/notifications/{id}/read` — Mark notification read
  - `PUT /api/v1/notifications/read-all` — Mark all notifications read
  - `DELETE /api/v1/notifications/{id}` — Delete notification
  - `GET /api/v1/notifications/preferences` & `PUT /api/v1/notifications/preferences` — Manage notification preferences

### WebSocket STOMP Endpoints (`/ws`)
- **Handshake**: `SockJS` connection with STOMP protocol
- **Publish Destination**:
  - `/app/chat.sendMessage` — Dispatch real-time chat message
  - `/app/chat.markRead` — Mark message stream as read
- **Subscribe Destinations**:
  - `/user/queue/messages` — Direct incoming messages
  - `/topic/conversations.{id}` — Live conversation room events

---

## 8. Running Tests & Quality Verification

### Frontend Test Suite
```bash
cd frontend
npm test
npm run build
```

### Backend Test Suite
```bash
cd backend
./mvnw test
./mvnw clean package -DskipTests
```
