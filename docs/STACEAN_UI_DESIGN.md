# Stacean Channel Extension: UI Design

**Status:** Draft
**Role:** Architect
**Context:** Atlas Cockpit (/tasks route)

## 1. Integration Point

The chat interface will live in the `/tasks` route, integrated into the existing Tab system defined in `PLAN_FINAL.md`.

*   **Current Tabs:** Objective Stack | Agent Lens | Energy Map
*   **New Tab:** **Live Comms** (or just "Chat")

## 2. Desktop Design

### Layout
*   **Position:** Within the main content area of `/tasks`, replacing the "Objective Stack" view when selected.
*   **Structure:**
    *   **Header:** "Live Comms: Gateway [Online/Offline]" indicator.
    *   **Message List:** Scrollable area with message bubbles.
        *   User: Right aligned, blue/accent color.
        *   Agent: Left aligned, gray/neutral color.
        *   Timestamps: Subtle, on hover.
    *   **Input Area:** Fixed at bottom.
        *   Textarea (auto-expanding).
        *   "Send" button (icon).
        *   Attachment button (future).

### Interaction
*   **Enter:** Sends message.
*   **Shift+Enter:** New line.
*   **Polling:** UI polls `SWR` or `useQuery` every 3s to fetch new messages from `api/stacean/sync` (or internal DB endpoint).

## 3. Mobile Design

### Layout
*   **Navigation:** Accessible via the Tab switcher in the `/tasks` view.
*   **View:** Optimized for thumb reach.
    *   Input bar sticks to keyboard.
    *   Message list manages scroll position to stay at bottom.

### Mobile Specifics
*   **Keyboard Avoidance:** Must ensure input area doesn't get hidden behind soft keyboard.
*   **Touch Targets:** Send button min 44x44px.

## 4. Components

### `components/chat/ChatTab.tsx`
Main container. Fetches data, handles layout.

### `components/chat/MessageBubble.tsx`
Renders a single message.
*   Props: `text`, `from` (user|agent), `timestamp`, `status` (sending|sent|error).

### `components/chat/ChatInput.tsx`
Input field + Send action.

## 5. Data Model (Frontend)

```typescript
type ChatMessage = {
  id: string;
  direction: 'inbound' (Agent->User) | 'outbound' (User->Agent);
  content: string;
  createdAt: number;
  status?: 'pending' | 'sent' | 'failed'; // For outbound
}
```

## 6. Implementation Notes

*   Use `useSWR` for polling the message list.
*   Optimistic UI updates: When user sends, add to list immediately as "pending".
*   Error handling: If Gateway sync fails, show red retry icon on message.
