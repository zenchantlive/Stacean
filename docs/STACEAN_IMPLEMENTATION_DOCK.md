# Stacean Channel Extension Implementation

This document serves as the design dock for the Stacean Channel implementation, referencing the original PRDs and Gateway Contract.

## Reference PRDs
- [Stacean Channel PRD](/home/clawdbot/stacean-repo/docs/STACEAN_CHANNEL_PRD.md)
- [Stacean UI Design](/home/clawdbot/stacean-repo/docs/STACEAN_UI_DESIGN.md)
- [Stacean Gateway Contract](/home/clawdbot/stacean-repo/docs/STACEAN_GATEWAY_CONTRACT.md)

## Implementation Status

### 1. Atlas Cockpit (stacean-repo)
- ✅ **KV Storage**: Implemented in `lib/integrations/kv/chat.ts` using Vercel KV with timeline indexing (sorted sets).
- ✅ **API Endpoints**:
  - `GET /api/stacean/sync`: Polling endpoint for Gateway to get user messages.
  - `POST /api/stacean/sync`: (Refactored to match Gateway Contract) Injection endpoint for Agent messages.
  - `GET /api/stacean/chat`: UI endpoint for message history.
  - `POST /api/stacean/chat`: UI endpoint for sending user messages.
- ✅ **UI Components**:
  - `components/chat/ChatTab.tsx`: Main chat interface with polling and auto-scroll.
  - `app/tasks/page.tsx`: Integrated Chat tab into the main cockpit layout.

### 2. OpenClaw Gateway (clawd)
- ✅ **Extension Scaffold**: Created `extensions/stacean/package.json`.
- ✅ **Plugin Logic**: Implemented `extensions/stacean/src/index.ts` with polling and outbound delivery.

### 3. Testing Plan
- [ ] **Unit Tests**: Verify KV adapter logic for message retrieval/storage.
- [ ] **Integration Tests**: Verify API endpoints with valid/invalid secrets.
- [ ] **E2E Test**:
  1. Set `STACEAN_SECRET` in environment.
  2. Send message from Cockpit UI.
  3. Verify message is stored in KV.
  4. Poll `/api/stacean/sync` and verify message is retrieved.
  5. POST to `/api/stacean/sync` (inject) and verify message appears in Cockpit UI.

## Next Steps
1. Finalize environment variables (`STACEAN_SECRET`).
2. Run automated tests for the KV adapter.
3. Perform end-to-end manual verification in the dashboard.
