# SkillSwap — Developer & AI Agent Guidelines

## 1. Project Overview
SkillSwap is a peer-to-peer skill exchange platform designed primarily for college students to trade knowledge (teaching/learning) via a structured credit-based and session-oriented system.

## 2. Phase Scope & Completed Milestones
- **Completed Phases**:
  - **Phase 1**: Architecture & Foundation (Health, DB baseline, Flyway migrations, CORS, API envelopes).
  - **Phase 2**: Auth, User & Student Profiles (Supabase Auth integration, Profile management, Interests/Offerings).
  - **Phase 3**: Skills Catalog & Skill Profiles (Categories, Skills CRUD, Proficiencies, Levels).
  - **Phase 4**: Skill Discovery & Matching Engine (Deterministic multi-factor matching, Learn/Teach/General modes).
  - **Phase 5**: Exchange Requests & Session Management (Offer/counter-offer, Accept/Reject, Scheduled session lifecycle).
  - **Phase 6**: Credit System & Wallet Engine (Credits economy, Balance tracking, Escrow on completion).
  - **Phase 7**: Real-Time Chat & Direct Messaging (WebSocket messaging, Conversation management, Unread tracking).
  - **Phase 8**: Video Calling & WebRTC (One-to-one P2P audio/video calls, Mesh WebRTC, signaling, media controls).
  - **Phase 9**: Screen Sharing & Teaching Mode (Screen Capture API, live track switching, Teaching Mode UX).
  - **Phase 10**: Reviews, Ratings & Safety (1-5 star ratings, reviews, mutual user blocking, reporting, session disputes, moderation console).
  - **Phase 11**: Notifications & Activity Center (Persistent notifications, unread tracking, notification center, notification bell, event-driven creation, preferences).
  - **Phase 12**: Advanced User Experience & Personalization (Personalized dashboard, peer & skill recommendations, profile completeness, viewing & search history, activity timeline).
  - **Phase 13**: Full Testing & Quality Assurance (Backend unit/integration/E2E test suites, security/IDOR auditing, frontend Vitest testing, accessibility & responsive design validation, performance & zero regression verification).
  - **Phase 14**: Production Hardening, Deployment & DevOps (Production environment templates, HTTP security headers, CORS hardening, in-memory rate limiting, liveness/readiness DB probes, Vite bundle chunking optimization, GitHub Actions CI/CD workflows, and production runbooks).
  - **Phase 15**: Production Deployment, Launch & Post-Launch Operations (Production verification, deployment readiness, security sign-off, and operational runbooks).
- **Current Active Phase**: Phase 15 Completed. All milestones (Phases 1–15) complete, validated, and release-ready.

## 3. Engineering Standards
- Maintain strict separation of concerns; no business logic in controllers or database queries in controllers.
- Use DTOs at API boundaries; never expose JPA entities directly.
- Use externalized environment variables for all secrets, credentials, database URLs, and CORS origins.
- Never hardcode or commit secrets or service-role keys.
- Always ensure `docs/` is ignored in `.gitignore`.
