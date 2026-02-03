# Stacean Channel Extension: Architecture & PRD

**Status:** Draft
**Role:** Architect
**Target:** OpenClaw Gateway + Atlas Cockpit (stacean-repo)

## 1. Executive Summary

This document defines the architecture for the "Stacean" channel extension. This channel enables a direct, bidirectional chat interface between the User (via Atlas Cockpit Dashboard) and the Agent (running on OpenClaw Gateway).

**Goal:** Allow the user to chat with the agent directly from the Tasks page in the dashboard, treating the dashboard itself as a messaging platform (similar to WhatsApp or Slack).

## 2. System Architecture

### High-Level Flow

```mermaid
graph LR
    User[User (Browser)] -- 1. Chat UI --> Atlas[Atlas Cockpit (Next.js)]
    Atlas -- 2. Store Msg --> DB[Vercel KV / Database]
    Gateway[OpenClaw Gateway] -- 3. Polls/Syncs --> Atlas
    Gateway -- 4. Agent Reply --> Atlas
    Atlas -- 5. Updates UI --> User
```

### Constraints & Decisions
*   **Transport:** **Polling (Gateway initiated)**.
    *   *Why:* Atlas Cockpit may run on Vercel (Serverless), while Gateway may run on a local machine behind NAT. Vercel cannot initiate a connection to `localhost`. Gateway must initiate outbound connections to Atlas.
*   **Auth:** Shared Secret (Bearer Token).
*   **Format:** Standard OpenClaw Message Format (text, media, reactions).

## 3. API Contract (Atlas Cockpit Side)

Atlas Cockpit MUST expose the following API endpoints for the Gateway to consume.

### 3.1. Sync Messages (Gateway -> Atlas)
Retrieves pending messages from the User to the Agent.

*   **Method:** `GET /api/stacean/sync`
*   **Headers:** `Authorization: Bearer <STACEAN_SECRET>`
*   **Query Params:**
    *   `since`: (Optional) ISO timestamp or Cursor ID of last received message.
*   **Response:**
    ```json
    {
      "cursor": "next_cursor_id",
      "messages": [
        {
          "id": "msg_123",
          "from": "user",
          "text": "Hello Atlas",
          "createdAt": "2026-02-03T10:00:00Z",
          "media": []
        }
      ]
    }
    ```

### 3.2. Receive Injection (Gateway -> Atlas)
Receives messages from the Agent to display to the User.

*   **Method:** `POST /api/stacean/inject`
*   **Headers:** `Authorization: Bearer <STACEAN_SECRET>`
*   **Body:**
    ```json
    {
      "id": "gateway_msg_456",
      "text": "I am working on it.",
      "media": [],
      "createdAt": "..."
    }
    ```

## 4. Gateway Channel Plugin (`extensions/stacean`)

The plugin will be a standard OpenClaw channel extension.

### 4.1. Configuration (`configSchema`)
*   `baseUrl`: URL of the Atlas Cockpit instance (e.g., `https://my-atlas.vercel.app` or `http://localhost:3000`).
*   `secret`: Shared authentication token.
*   `pollIntervalMs`: Default `3000` (3s).

### 4.2. Plugin Structure (`src/channel.ts`)

```typescript
export const staceanPlugin: ChannelPlugin<StaceanAccount> = {
  id: "stacean",
  capabilities: {
    chatTypes: ["direct"], // No groups initially
    reactions: true,
    media: true
  },
  
  // OUTBOUND: Agent sends message -> Atlas
  outbound: {
    deliveryMode: "gateway",
    sendText: async ({ to, text, deps }) => {
      // POST /api/stacean/inject
      await deps.axios.post("/api/stacean/inject", { text, to });
      return { id: "...", timestamp: Date.now() };
    }
  },

  // GATEWAY: Starts the listener
  gateway: {
    startAccount: async (ctx) => {
      // Start Polling Loop
      const loop = setInterval(async () => {
        // GET /api/stacean/sync
        const messages = await fetchMessages();
        for (const msg of messages) {
          ctx.runtime.ingest({
            type: "message",
            text: msg.text,
            from: { id: "user", name: "User" },
            // ...
          });
        }
      }, config.pollIntervalMs);
      
      return () => clearInterval(loop); // Teardown
    }
  }
};
```

## 5. Security & Auth

*   **Token Generation:** User generates a high-entropy secret in Atlas Settings.
*   **Config:** User pastes this secret into `~/.openclaw/clawd.toml` under `channels.stacean.accounts.default.secret`.
*   **Scope:** The token grants read/write access to the "Stacean" chat buffer only.

## 6. Development Plan (Tracer Bullet)

1.  **Atlas:** Create `app/api/stacean/route.ts` (Handles Sync/Inject).
2.  **Atlas:** Create `components/dashboard/ChatTab.tsx`.
3.  **Gateway:** Scaffold `extensions/stacean` in `clawd` repo.
4.  **Integration:** Configure local Gateway to poll local Atlas.
5.  **Test:** Send "ping" from Atlas, verify Gateway logs. Send "pong" from Agent, verify Atlas UI.

