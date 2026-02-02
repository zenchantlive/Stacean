# Responsive & Ergonomic Design Specification

## Core Principles

### 1. Mobile-First, Always
- Design for 375px first, then scale UP
- Every component must work on mobile before desktop
- Test on real devices, not just browser resize

### 2. Relative Units Only
- **NO `px` for layout** - use `rem`, `%`, `vh`, `vw`
- **`px` only for:** borders (1px), shadows, very small decorative elements
- Base font: `16px` = `1rem`

### 3. Touch-Friendly Ergonomics
- Minimum tap target: `44px` (`2.75rem`)
- Thumb-reachable zones for primary actions
- No precision required - generous hit areas

---

## Unit System

### Spacing Scale (rem-based)

```css
:root {
  /* Base: 16px = 1rem */
  --space-2xs: 0.25rem;   /* 4px */
  --space-xs: 0.5rem;     /* 8px */
  --space-sm: 0.75rem;    /* 12px */
  --space-md: 1rem;       /* 16px */
  --space-lg: 1.5rem;     /* 24px */
  --space-xl: 2rem;       /* 32px */
  --space-2xl: 3rem;      /* 48px */
  --space-3xl: 4rem;      /* 64px */
}
```

### Typography Scale (rem-based)

```css
:root {
  --text-xs: 0.75rem;     /* 12px - labels, captions */
  --text-sm: 0.875rem;    /* 14px - secondary text */
  --text-base: 1rem;      /* 16px - body text */
  --text-lg: 1.125rem;    /* 18px - emphasis */
  --text-xl: 1.25rem;     /* 20px - card titles */
  --text-2xl: 1.5rem;     /* 24px - section headers */
  --text-3xl: 2rem;       /* 32px - page titles */
  
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Interactive Element Sizes

```css
:root {
  /* Minimum touch targets */
  --tap-target-min: 2.75rem;    /* 44px - Apple HIG minimum */
  --tap-target-comfortable: 3rem; /* 48px - Google MD recommendation */
  
  /* Button heights */
  --button-sm: 2rem;      /* 32px - compact buttons */
  --button-md: 2.5rem;    /* 40px - default buttons */
  --button-lg: 3rem;      /* 48px - primary CTAs */
  
  /* Input heights */
  --input-height: 2.75rem; /* 44px */
}
```

---

## Breakpoint System

### Mobile-First Breakpoints

```css
/* Mobile: 0 - 639px (default styles) */

/* Tablet: 640px+ */
@media (min-width: 40rem) { /* 640px */ }

/* Desktop: 1024px+ */
@media (min-width: 64rem) { /* 1024px */ }

/* Large Desktop: 1280px+ */
@media (min-width: 80rem) { /* 1280px */ }
```

### Container Widths

```css
.container {
  width: 100%;
  max-width: 80rem; /* 1280px */
  margin: 0 auto;
  padding-inline: var(--space-md); /* 16px sides on mobile */
}

@media (min-width: 40rem) {
  .container {
    padding-inline: var(--space-lg); /* 24px sides on tablet+ */
  }
}
```

---

## Layout System

### Grid (Responsive)

```css
.dashboard-grid {
  display: grid;
  gap: var(--space-md);
  
  /* Mobile: 1 column */
  grid-template-columns: 1fr;
}

@media (min-width: 40rem) {
  .dashboard-grid {
    /* Tablet: 2 columns */
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 64rem) {
  .dashboard-grid {
    /* Desktop: 3 columns */
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Card Sizing

```css
.dashboard-card {
  /* Fluid height based on content */
  min-height: 12rem; /* 192px minimum */
  
  /* Responsive padding */
  padding: var(--space-md);
}

@media (min-width: 40rem) {
  .dashboard-card {
    padding: var(--space-lg);
  }
}
```

---

## Ergonomic Touch Zones

### Mobile Thumb Reach Map

```
┌─────────────────────────────────────┐
│                                     │
│          HARD TO REACH              │
│         (avoid primary actions)     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│          COMFORTABLE                │
│       (secondary actions OK)        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│          EASY TO REACH              │
│    ★ PRIMARY ACTIONS HERE ★         │
│       (bottom 40% of screen)        │
│                                     │
└─────────────────────────────────────┘
```

### Application to Atlas Cockpit

```css
/* Header: top of screen - status only, no actions required */
.header {
  height: 3.5rem; /* 56px */
  /* Status indicator - glanceable, no tap needed */
}

/* Cards: middle zone - browsable */
.dashboard-card {
  /* Tap anywhere on card to expand */
  cursor: pointer;
}

/* Primary actions: bottom zone - easy thumb reach */
.primary-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-md);
  padding-bottom: calc(var(--space-md) + env(safe-area-inset-bottom));
}

/* FAB: bottom right - natural thumb position */
.fab {
  position: fixed;
  bottom: calc(var(--space-lg) + env(safe-area-inset-bottom));
  right: var(--space-lg);
  width: var(--tap-target-comfortable);
  height: var(--tap-target-comfortable);
}
```

---

## Safe Area Handling

### For Notched Devices (iPhone X+)

```css
:root {
  /* Fallback for non-notched devices */
  --safe-top: 0px;
  --safe-bottom: 0px;
  --safe-left: 0px;
  --safe-right: 0px;
}

@supports (padding: env(safe-area-inset-top)) {
  :root {
    --safe-top: env(safe-area-inset-top);
    --safe-bottom: env(safe-area-inset-bottom);
    --safe-left: env(safe-area-inset-left);
    --safe-right: env(safe-area-inset-right);
  }
}

/* Apply to fixed elements */
.header {
  padding-top: calc(var(--space-md) + var(--safe-top));
}

.bottom-bar {
  padding-bottom: calc(var(--space-md) + var(--safe-bottom));
}
```

---

## Component Specifications

### Header

```css
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: calc(3.5rem + var(--safe-top));
  padding-top: var(--safe-top);
  padding-inline: var(--space-md);
  
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  
  background: var(--color-surface-elevated);
  border-bottom: 1px solid var(--color-border);
  z-index: 100;
}

/* Logo */
.header-logo {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
}

/* Title - hide on very small screens */
.header-title {
  font-size: var(--text-base);
  font-weight: 600;
  
  /* Hide on narrow screens */
  @media (max-width: 25rem) { /* 400px */
    display: none;
  }
}

/* Status - always visible, right aligned */
.header-status {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
}
```

### Dashboard Card

```css
.dashboard-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  
  /* Minimum touch target for entire card */
  min-height: var(--tap-target-min);
  
  /* Smooth interactions */
  transition: transform 0.2s, box-shadow 0.2s;
}

.dashboard-card:active {
  transform: scale(0.98);
}

@media (hover: hover) {
  .dashboard-card:hover {
    box-shadow: var(--shadow-elevated);
  }
}

/* Card header */
.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.card-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-text-secondary);
}

.card-title {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

/* Card content */
.card-content {
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--color-text-primary);
}

/* Card footer with actions */
.card-footer {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--color-border);
}

.card-action {
  /* Ensure minimum tap target */
  min-height: var(--tap-target-min);
  padding: var(--space-sm) var(--space-md);
  
  font-size: var(--text-sm);
  font-weight: 500;
  
  border-radius: var(--radius-sm);
  transition: background 0.2s;
}
```

### Buttons

```css
.button {
  /* Minimum touch target */
  min-height: var(--button-md);
  min-width: var(--tap-target-min);
  
  padding: var(--space-sm) var(--space-md);
  
  font-size: var(--text-sm);
  font-weight: 500;
  
  border-radius: var(--radius-sm);
  
  /* Remove default styles */
  border: none;
  background: transparent;
  cursor: pointer;
  
  /* Flexbox for icon + text */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
}

.button-primary {
  background: var(--color-accent);
  color: white;
}

.button-secondary {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}
```

---

## Checklist for Every Component

Before shipping any component, verify:

- [ ] **No hardcoded px** for layout/spacing (only rem, %, vh/vw)
- [ ] **Touch targets ≥ 44px** (2.75rem) for all interactive elements
- [ ] **Works at 375px** width without horizontal scroll
- [ ] **Safe areas respected** for fixed elements
- [ ] **Text readable** without zooming (min 14px / 0.875rem)
- [ ] **Sufficient contrast** (4.5:1 for text, 3:1 for UI)
- [ ] **Focus states visible** for keyboard users
- [ ] **Hover states only on hover-capable** devices
- [ ] **Active states** for touch feedback

---

## Anti-Patterns to Avoid

### ❌ DON'T

```css
/* Hardcoded pixels */
.card { width: 300px; padding: 16px; }

/* Fixed heights that break on content overflow */
.card { height: 200px; }

/* Hover-only interactions on touch devices */
.button:hover { /* only style */ }

/* Tiny touch targets */
.icon-button { width: 24px; height: 24px; }

/* Ignoring safe areas */
.bottom-nav { position: fixed; bottom: 0; }
```

### ✅ DO

```css
/* Relative units */
.card { width: 100%; max-width: 20rem; padding: var(--space-md); }

/* Min-height, not fixed height */
.card { min-height: 12rem; }

/* Hover only when supported */
@media (hover: hover) {
  .button:hover { /* style */ }
}

/* Adequate touch targets */
.icon-button { width: var(--tap-target-min); height: var(--tap-target-min); }

/* Safe area aware */
.bottom-nav { 
  position: fixed; 
  bottom: 0;
  padding-bottom: calc(var(--space-md) + env(safe-area-inset-bottom));
}
```

---

## Testing Protocol

### Device Testing Matrix

| Device | Width | Test For |
|--------|-------|----------|
| iPhone SE | 375px | Smallest common phone |
| iPhone 14 Pro | 393px | Notch + Dynamic Island |
| iPhone 14 Pro Max | 430px | Large phone |
| iPad Mini | 768px | Tablet breakpoint |
| iPad Pro | 1024px | Desktop breakpoint |
| Desktop | 1280px+ | Full layout |

### Manual Test Checklist

1. **Thumb reach test**: Can I tap primary actions with one hand?
2. **Glance test**: Can I see status in < 1 second?
3. **Scroll test**: Does content scroll smoothly? Any jank?
4. **Orientation test**: Does it work in landscape?
5. **Zoom test**: Does it break at 200% zoom?
6. **Dark mode test**: Is contrast sufficient?

---

*This spec ensures the app is mobile-first, ergonomic, and uses relative units throughout.*
