# Command Center v2: The Visual Cockpit

## Vision
A real-time, mobile-first dashboard that visualizes Atlas's work state and enables bi-directional communication. Not a blog—a cockpit.

## Core Features

### 1. Atlas Pulse (Status)
- **Status Indicator:** Online / Thinking / Idle.
- **Current Task:** "Refactoring globals.css"
- **Tech:** Pulls from `public/state.json` (polled every 5s).

### 2. Screenshot Stream (The "Visual")
- **Trigger:** Atlas runs `scripts/screenshot.js`.
- **Flow:** Screenshot -> Vercel Blob -> Public URL -> Save to Vercel KV.
- **Display:** Carousel of last 5 screenshots on the dashboard.
- **Frequency:** Updates when Atlas commits a change.

### 3. The Ledger (Timeline)
- **Data:** Pulls from `memory/` files.
- **Display:** Vertical list of recent actions with timestamps and links.
- **UX:** Monospaced font, clean, "receipt" style.

### 4. Field Notes (Input)
- **Input:** Form for Jordan to leave notes.
- **Storage:** Vercel KV (key: `notes`).
- **Display:** Shows last 3 notes at the bottom of the screen.

### 5. Ecosystem Map (Links)
- **Data:** Hardcoded list of projects with status (Green/Red).
- **Display:** Simple list with clickable links.

## Technical Architecture

### Frontend
- **Framework:** Next.js 14 (App Router).
- **Styling:** Tailwind CSS + Framer Motion.
- **Design:** iOS 18 Glassmorphism (Blur, Translucency).
- **Font:** Inter (UI) + JetBrains Mono (Data).

### Storage
- **Images:** Vercel Blob (`@vercel/blob`).
- **State/Notes:** Vercel KV (`@vercel/kv`).

### Cron
- **Atlas Telemetry:** Script to push state to KV.
- **Image Sync:** Script to sync screenshots to Blob.

## Data Flow

1. **Atlas Action:** I complete a task.
2. **Telemetry:** I run `scripts/telemetry.js` -> updates `state.json` and KV.
3. **Screenshot:** I run `scripts/screenshot.js` -> uploads to Blob -> saves URL to KV.
4. **Dashboard:** Polls KV every 5s -> Updates UI.

## Design System ("Warm Industrial" x iOS)

### Colors
- **Background:** Cream (`#FDFBF7`)
- **Text:** Charcoal (`#1E293B`)
- **Accent:** Terracotta (`#C86B56`)
- **Glass:** White/Blur (`bg-white/80 backdrop-blur-md`)

### Components
1. **PhoneContainer:** `max-w-md mx-auto rounded-3xl overflow-hidden`.
2. **Widget:** Full-screen section, swipeable.
3. **Dock:** Fixed bottom nav, glass effect.

## Implementation Steps

### Phase 1: Foundation
- [ ] Setup Vercel Blob and KV.
- [ ] Create `scripts/screenshot-upload.js`.
- [ ] Create `scripts/telemetry.js`.
- [ ] Build Dashboard Layout (Phone container).

### Phase 2: Widgets
- [ ] Implement Atlas Pulse (fetch from KV).
- [ ] Implement Screenshot Stream (fetch from KV).
- [ ] Implement Field Notes (POST to KV).
- [ ] Implement Ledger (read from memory files).

### Phase 3: Polish
- [ ] Add iOS Glassmorphism styles.
- [ ] Add Framer Motion animations.
- [ ] Verify Mobile Responsiveness.

### Phase 4: Testing & Deploy
- [ ] Write integration tests for KV fetch/post.
- [ ] Test screenshot upload flow.
- [ ] Deploy Preview.

## Testing Strategy
1. **Unit:** Test KV fetch functions.
2. **Integration:** Test upload flow (Local -> Blob -> KV -> UI).
3. **Visual:** Use Playwright to verify UI rendering.

## Deployment
- **Strategy:** Ignore Git. Deploy via `npx vercel --prod` after every feature complete.
- **Caching:** Disable build cache for rapid iterations.

## Risks & Mitigations
- **Blob Cost:** Vercel Blob free tier is 5GB. Screenshots are ~100KB. Risk: Low.
- **KV Cost:** Free tier includes 30M requests. Risk: Low.
- **Latency:** Polling every 5s is acceptable. Risk: Low.

---

*Generated: 2026-01-28*
*Status: PLANNING COMPLETE*