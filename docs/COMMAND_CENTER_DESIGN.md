# The Command Center - Design Specification v2

## Vision
A "Warm Industrial" dashboard that feels like a premium field journal. Mobile-first, focused on your goals, low-noise, and unique.

## Design System: "Warm Industrial"

### Color Palette
- **Canvas:** Warm Cream (`#FDFBF7`) - No pure white, easier on the eyes.
- **Ink:** Deep Charcoal (`#2D2D2D`) - High contrast but softer than black.
- **Accent:** Burnt Terracotta (`#C86B56`) - For primary actions and active states.
- **Secondary:** Sage Green (`#8FA692`) - For success/healthy states.
- **Muted:** Warm Gray (`#A8A29E`) - For metadata and borders.

### Typography
- **Headers:** `Playfair Display` (Serif) - Editorial, confident, warm.
- **Data/Body:** `Inter` (Sans-serif) - Clean, legible.
- **Monospace:** `JetBrains Mono` - Only for timestamps, file paths, and IDs.

### Texture
- Subtle noise overlay (5% opacity) on the background to reduce eye strain.
- Rounded corners: `12px` (soft but precise).
- Subtle borders: `1px solid #E5E5E5`.

---

## Core Modules

### 1. The Header (Personalization)
- **Left:** "The Field Journal" logo (minimal serif type).
- **Right:** "Atlas Status" (Subtle indicator: Online/Idle).
- **Mobile:** Collapsed into a sticky bar. Desktop: Spreads out.

### 2. The Ledger (Memory Stream)
Instead of a chat log, it's a ledger.
- **Format:** `[HH:MM] | ACTION | CONTEXT`
  - Example: `10:22 | RESEARCH | "AI Job Market Trends"`
- **Visuals:** Monospaced font, clean rows. Like a receipt from a high-end store.

### 3. Ecosystem Weather (Project Health)
A map of your projects, but status is "Weather."
- **Asset-Hatch:** ☀️ Sunny (Deployed, Stable)
- **Catwalk Live:** 🌧️ Rainy (In Development, Buggy)
- **TheFeed:** 🌤️ Partly Cloudy (MVP, Needs Polish)
- **Interaction:** Tapping a project expands a drawer with specific details (Git status, last deploy time).

### 4. The Mission Board (Your Goals)
- **Primary Goal:** Large card. "AI Job Search". Progress bar (custom styled, not generic).
- **Secondary:** Smaller cards below.

### 5. Field Notes (Manual Input)
- A floating action button (FAB) or prominent button.
- Opens a modal to "Drop a pin."
- You can leave a note for yourself or me: "Check this link" or "Fix this bug."

---

## Mobile-First Architecture

### The Stack (Default View)
The UI is a vertical stack of cards.
1. Header
2. Ecosystem Weather (Horizontal scroll)
3. The Ledger (Main feed)
4. Field Notes Button (Floating)

### Desktop Expansion
- **Ecosystem Weather:** Moves to the top row, 3 columns.
- **The Ledger:** Splits into a 2-column grid (Main feed left, Detailed stats right).
- **Field Notes:** Becomes a permanent sidebar widget.

---

## Technical Specs

### Framework
- **Next.js 15** (App Router)
- **Tailwind CSS** (with custom color config)
- **Framer Motion** (for smooth card transitions - "stacking" effect on mobile)

### Data Layer
- **`/lib/store.ts`**: A simple state manager (Zustand or React Context) to handle local data.
- **`/scripts/dashboard-telemetry.js`**: Script I run to update `public/state.json`.
- **No Database (Initially):** We use flat files and JSON for simplicity and speed.

### Components to Build
1. `Card.tsx` (Base component with "Warm Industrial" styles)
2. `WeatherWidget.tsx` (Ecosystem status)
3. `LedgerFeed.tsx` (Memory stream)
4. `MissionCard.tsx` (Goal tracker)
5. `FieldNotes.tsx` (Manual input)

---

## Unique Touches
1. **"Slow Fade" Animations:** Nothing pops. Everything fades in slowly (500ms) to feel calm.
2. **"Paper" Feel:** Subtle texture on the background.
3. **"Contextual" Header:** The header text changes based on my status. If I'm "Thinking," the header says "Atlas is Processing..." in small mono font.

---

*This spec is a living document. Updates will be added as we build.*