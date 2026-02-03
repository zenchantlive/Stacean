# Stacean Channel Extension — Design (Chat Tab)

## Design Goals
- Add a **Chat tab** without disrupting existing Tasks/Projects/Notes/Ledger tabs
- Clean, minimal UI consistent with current design system
- Mobile‑first, desktop‑friendly

## Placement
- Add a **new tab** labeled **Chat** in `app/tasks/page.tsx`
- Preserve existing tab order; Chat can be last or next to Notes

## Desktop Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Tabs: Tasks | Projects | Notes | Ledger | Chat               │
├─────────────────────────────────────────────────────────────┤
│ [Message list scroll]                                        │
│  You:  Hello…                                                │
│  OpenClaw: Hi Jordan…                                        │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│ [Input box……………………………………][Send]                  │
└─────────────────────────────────────────────────────────────┘
```
- Message bubbles aligned left/right
- Timestamp in subtle text
- System errors appear as inline banner

## Mobile Layout
```
┌─────────────────────────────┐
│ Tabs (scrollable)            │
│ Chat                          │
├─────────────────────────────┤
│ [Message list scroll]         │
│  You: Hello…                  │
│  OpenClaw: Hi…                │
│                               │
├─────────────────────────────┤
│ [Input…] [Send]               │
└─────────────────────────────┘
```
- Input bar fixed at bottom
- Message list scrolls under
- Tap focus to expand input

## Component Structure
- `ChatTab.tsx` (new component)
- `ChatMessageList.tsx`
- `ChatComposer.tsx`
- `useChatMessages.ts` hook

## Visual Style
- Reuse existing colors: background `#09090B`, card `#18181B`
- Accent: `#F97316`
- Bubble colors: outgoing `#F97316/20`, incoming `#27272A`

## Error & Loading States
- Loading spinner during initial fetch
- Error banner for connection failures
- Disabled send button if input empty

## UX Flow
1. User opens Chat tab
2. Messages load (polling)
3. User sends message
4. Input clears immediately
5. Response appears in list

## Accessibility
- Buttons labeled
- Input placeholder text
- Keyboard navigation for send

## Non‑Goals (Design)
- Threading UI
- Attachments UI
- Multi‑agent selector

## Dependencies
- Stacean API routes for send/messages/outbound
- Gateway channel configured
