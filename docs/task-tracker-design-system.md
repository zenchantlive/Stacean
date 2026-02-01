# Design System — Task Tracker Remake

**Theme:** Dark taupe base with aurora-like subdued accents
**Tone:** Clean, powerful, touch-first, ergonomic

---

## 1) Color Tokens

> All colors use CSS variables for easy theming. Values below are suggestions for the initial pass.

```css
:root {
  /* Base */
  --bg-0: #0f0d0c;        /* deep taupe-black */
  --bg-1: #141110;        /* taupe layer */
  --bg-2: #1d1917;        /* card base */
  --text-0: #f2efed;      /* primary */
  --text-1: #cfc7c1;      /* secondary */
  --text-2: #9a8f86;      /* muted */

  /* Aurora accents */
  --sage: #8ea89e;
  --teal: #6fa5a2;
  --moss: #6d7d66;
  --ember: #b46b4f;

  /* Status */
  --open: #6fa5a2;
  --in-progress: #8ea89e;
  --review: #b7a98a;
  --done: #7b8b7d;
  --tombstone: #5b4b47;

  /* Utility */
  --border: rgba(255,255,255,0.06);
  --shadow: 0 10px 30px rgba(0,0,0,0.4);
}
```

---

## 2) Typography

- **Display:** `"TAN Dots"` or `"Satoshi"` (choose final)
- **Body:** `"Ibarra Real Nova"` or `"Source Serif 4"`
- **Mono accents:** `"IBM Plex Mono"`

Scale (rem-based):
- H1: 2.0rem
- H2: 1.5rem
- H3: 1.25rem
- Body: 1rem
- Small: 0.875rem
- Micro: 0.75rem

---

## 3) Spacing & Layout

- Base unit: **0.25rem**
- Radii: 0.75rem (cards), 999px (chips)
- Grid: 12-col desktop, stacked mobile
- Padding: 1rem–2rem typical; 2.5rem+ for hero sections

---

## 4) Core Components

### Buttons
- Primary: filled, aurora glow edge
- Secondary: outline, subtle hover
- Icon button: circular, 40–44px target

### Status Chips
- Pill with icon + label
- Always includes text (accessibility)
- Color derived from status token

### Cards
- Soft shadow, thin border, slight gradient top edge
- Hover raises card + glows edge

### Inputs
- Full-width, 44px height
- Focus ring in sage/teal

---

## 5) Motion

- Page load: staggered card fade-in
- Hover: subtle glow + translateY(-2px)
- State change: fade + slide (150–250ms)

---

## 6) Iconography

- Thin-line icons with rounded ends
- Consistent stroke width
- Avoid overly sharp or playful icons

---

## 7) Accessibility

- Minimum 4.5:1 contrast on text
- 44px min touch targets
- Keyboard focus visible

---

## 8) Status Mapping (Beads)

Wire format → UI label
- `open` → Open
- `in_progress` → In‑Progress
- `review` → Review
- `done` → Done
- `tombstone` → Tombstone

---

## 9) Empty & Loading States

- Empty: minimal illustration + CTA
- Loading: shimmer skeletons in taupe gradient
