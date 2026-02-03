# Stacean Channel - Active State

**Current Status:** Implementation Phase (Lead Agent takeover)
**Project:** stacean-repo
**Last Updated:** 2026-02-02 23:46 PST

## 🎯 Goals
Implement a bidirectional communication channel between OpenClaw Gateway and the Atlas Cockpit (Dashboard) to allow Jordan to chat with agents directly from the UI.

## 📄 Key References
- **PRD:** `/home/clawdbot/stacean-repo/docs/STACEAN_CHANNEL_PRD.md`
- **UI Design:** `/home/clawdbot/stacean-repo/docs/STACEAN_UI_DESIGN.md`
- **Gateway Contract:** `/home/clawdbot/stacean-repo/docs/STACEAN_GATEWAY_CONTRACT.md`

## ✅ Completed
- [x] **Architecture defined:** Bidirectional sync via polling mechanism.
- [x] **Gateway Contract drafted:** Defined endpoints (`/api/stacean/sync`, `/api/stacean/inject`).
- [x] **Subagent Swarm Onboarding:** Created beads and registered agents in Agent Mail.
- [x] **KV Storage Layer (Atlas):** Implemented `lib/integrations/kv/chat.ts` for message persistence.

## 🚧 In Progress
- [ ] **API Routes (Atlas):** Implementing the sync and inject logic.
- [ ] **Chat UI (Atlas):** Integrating the "Live Comms" tab into `app/tasks/page.tsx`.
- [ ] **Gateway Plugin:** Scaffolding the channel extension in `clawd`.

## 📋 Remaining Tasks
1. **Implement API Endpoints:** `/api/stacean/sync` (polling) and `/api/stacean/inject` (agent inbound).
2. **Build Chat Component:** Create `ChatTab.tsx` with optimistic UI and auto-scroll.
3. **Gateway Extension:** Write the polling loop and delivery logic in the `stacean` plugin.
4. **E2E Testing:** Verify "Ping/Pong" between Dashboard and Gateway.
5. **Security:** Implement and verify shared secret authentication.

## ⚠️ Known Issues / Risks
- **Test Framework Mismatch:** Existing project tests use Jest, but project is moving to Vitest.
- **Task Status Schema:** Legacy 'todo' vs new 'open' status drift.
