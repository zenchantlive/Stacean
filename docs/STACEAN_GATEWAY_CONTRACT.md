# Stacean Gateway Contract

**Status:** Draft
**Version:** 1.0
**Project:** Stacean Channel Extension

## Overview

This contract defines the **API endpoints that Atlas Cockpit must expose** for the OpenClaw Gateway to consume, and the **Gateway channel plugin configuration**.

---

## Part 1: Atlas Cockpit API Endpoints

Atlas Cockpit (`stacean-repo`) MUST expose the following endpoints under `/api/stacean`.

### 1.1. Sync Messages (Gateway → Atlas)

**Endpoint:** `GET /api/stacean/sync`

**Purpose:** Retrieve pending messages from User to Agent.

**Headers:**
```
Authorization: Bearer <STACEAN_SECRET>
```

**Query Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `since` | string | No | ISO timestamp or cursor ID of last received message |

**Success Response:** `200 OK`
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

**Error Response:** `401 Unauthorized`
```json
{
  "error": "Unauthorized"
}
```

---

### 1.2. Receive Injection (Gateway → Atlas)

**Endpoint:** `POST /api/stacean/inject`

**Purpose:** Receive messages from Agent to display to User.

**Headers:**
```
Authorization: Bearer <STACEAN_SECRET>
Content-Type: application/json
```

**Request Body:**
```json
{
  "id": "gateway_msg_456",
  "text": "I am working on it.",
  "media": [],
  "createdAt": "2026-02-03T10:01:00Z"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "id": "gateway_msg_456"
}
```

**Error Response:** `401 Unauthorized` or `400 Bad Request`
```json
{
  "error": "Unauthorized"
}
```

---

## Part 2: Gateway Channel Plugin

The OpenClaw Gateway will run a channel plugin at `extensions/stacean`.

### 2.1. Configuration Schema

```typescript
interface StaceanConfig {
  baseUrl: string;      // e.g., "http://localhost:3000" or "https://my-atlas.vercel.app"
  secret: string;       // Shared authentication token
  pollIntervalMs: number; // Default: 3000 (3 seconds)
}
```

**Example `~/.openclaw/clawd.toml`:**
```toml
[channels.stacean.accounts.default]
baseUrl = "http://localhost:3000"
secret = "your-generated-secret-here"
pollIntervalMs = 3000
```

---

### 2.2. Plugin Structure

```typescript
export const staceanPlugin: ChannelPlugin<StaceanAccount> = {
  id: "stacean",
  name: "Stacean",
  
  capabilities: {
    chatTypes: ["direct"],
    reactions: true,
    media: true
  },
  
  configSchema: {
    type: "object",
    properties: {
      baseUrl: { type: "string" },
      secret: { type: "string" },
      pollIntervalMs: { type: "number", default: 3000 }
    }
  },
  
  // OUTBOUND: Agent sends message → Atlas
  outbound: {
    deliveryMode: "gateway",
    
    sendText: async ({ to, text, deps, config }) => {
      const response = await deps.axios.post(
        `${config.baseUrl}/api/stacean/inject`,
        {
          id: generateId(),
          text,
          to,
          media: [],
          createdAt: new Date().toISOString()
        },
        {
          headers: { Authorization: `Bearer ${config.secret}` }
        }
      );
      return { id: response.data.id, timestamp: Date.now() };
    },
    
    sendMedia: async ({ to, media, deps, config }) => {
      // Similar structure for media
    }
  },
  
  // GATEWAY: Starts the polling listener
  gateway: {
    startAccount: async (ctx) => {
      const config = ctx.config;
      const runtime = ctx.runtime;
      
      // Cursor for sync
      let lastCursor: string | null = null;
      
      // Polling loop
      const interval = setInterval(async () => {
        try {
          const response = await deps.axios.get(
            `${config.baseUrl}/api/stacean/sync`,
            {
              params: lastCursor ? { since: lastCursor } : {},
              headers: { Authorization: `Bearer ${config.secret}` }
            }
          );
          
          const { cursor, messages } = response.data;
          if (cursor) lastCursor = cursor;
          
          for (const msg of messages) {
            await runtime.ingest({
              type: "message",
              text: msg.text,
              from: { id: "user", name: "User" },
              timestamp: new Date(msg.createdAt).getTime(),
              messageId: msg.id
            });
          }
        } catch (err) {
          console.error("Stacean sync error:", err);
        }
      }, config.pollIntervalMs);
      
      // Teardown function
      return () => clearInterval(interval);
    }
  }
};
```

---

## Part 3: Implementation Checklist

### Atlas Cockpit (stacean-repo)
- [ ] `GET /api/stacean/sync` endpoint
- [ ] `POST /api/stacean/inject` endpoint
- [ ] KV storage for messages (sorted sets)
- [ ] Shared secret generation in Settings
- [ ] Chat UI (`ChatTab.tsx` and components)

### OpenClaw Gateway (clawd)
- [ ] `extensions/stacean/` folder structure
- [ ] Channel plugin implementation (`src/channel.ts`)
- [ ] Config schema
- [ ] Documentation

### Integration
- [ ] Configure local Gateway to poll local Atlas
- [ ] Test sync and inject endpoints
- [ ] Verify end-to-end chat flow

---

## Part 4: Security Notes

1. **Secret Generation:** Use a high-entropy random string (≥ 32 bytes)
2. **Secret Storage:** Store securely in environment variables or config file
3. **Transport:** Always use HTTPS in production
4. **Token Validation:** Atlas must validate `Authorization` header on every request
