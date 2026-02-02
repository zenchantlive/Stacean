# Implementation Specification

## Branch: `ux/dashboard-redesign`
## Repo: `/home/clawdbot/stacean-repo` (Stacean)

---

## Current State Analysis

### Files That Will Change

```
app/
├── page.tsx                    # MAJOR CHANGES - new layout
├── layout.tsx                  # ADD - header component
├── globals.css                 # MODIFY - remove aurora, add tokens
├── tasks/
│   └── page.tsx               # NEW - dedicated tasks route

components/
├── layout/
│   └── Header.tsx             # NEW - persistent header
├── dashboard/
│   ├── DashboardCard.tsx      # NEW - base expandable card
│   ├── AtlasPulse.tsx         # MODIFY - make into card format
│   ├── LedgerFeed.tsx         # MODIFY - make into card format
│   ├── ScreenshotStream.tsx   # MODIFY - make into card format
│   ├── EcosystemMap.tsx       # MODIFY - make into card format
│   ├── FieldNotes.tsx         # MODIFY - make into card format
│   ├── TaskWidget.tsx         # MODIFY - summary card only
│   └── tracker-nav/
│       └── TaskTrackerNav.tsx # DELETE - replaced by tabs in /tasks

lib/
├── styles/
│   └── task-tracker-theme.css # MODIFY - remove sidebar styles
└── design-tokens.css          # NEW - color/spacing tokens
```

---

## Detailed Implementation

### Phase 1: Header Component (Day 1, Part 1)

**Create:** `components/layout/Header.tsx`

```tsx
// Header shows:
// - Logo
// - "Atlas Cockpit" title
// - Status indicator (🟢 Online / 🔴 Offline)
// - Current activity
// - Last heartbeat time

interface HeaderProps {
  status: 'online' | 'offline' | 'unknown';
  currentActivity?: string;
  lastHeartbeat?: string;
}
```

**Modify:** `app/layout.tsx`
- Import Header
- Render Header above {children}
- Add padding-top to main content to account for fixed header

**CSS:**
```css
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--surface-elevated);
  border-bottom: 1px solid var(--border);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}
```

---

### Phase 1: Remove Horizontal Carousel (Day 1, Part 2)

**Modify:** `app/page.tsx`

**Before (Mobile):**
```tsx
<main className="snap-x w-full h-full flex overflow-x-auto snap-mandatory">
  {/* 6 sections, horizontal scroll */}
</main>
```

**After (Mobile):**
```tsx
<main className="flex flex-col gap-4 p-4 pt-20 overflow-y-auto">
  {/* 6 cards, vertical scroll */}
</main>
```

**Before (Desktop):**
```tsx
<main className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
```

**After (Desktop):**
```tsx
<main className="md:grid md:grid-cols-2 xl:grid-cols-3 gap-4 p-4 pt-20">
```

**Key change:** Same layout structure, just different column count based on screen size.

---

### Phase 1: Remove Aurora Effects (Day 1, Part 3)

**Modify:** `app/globals.css`

**Remove:**
```css
.aurora {
  /* Delete entire class */
}
```

**Modify:** `app/page.tsx`

**Remove:**
```tsx
<div className="aurora top-[-50px] left-[-50px]" />
<div className="aurora bottom-[-100px] right-[-50px] opacity-50" />
```

---

### Phase 2: Design Tokens (Day 2, Part 1)

**Create:** `lib/design-tokens.css`

```css
:root {
  /* Colors */
  --color-bg: #0f0d0c;
  --color-surface: #18181B;
  --color-surface-elevated: #1d1917;
  --color-border: rgba(255, 255, 255, 0.05);
  
  --color-text-primary: #f2efed;
  --color-text-secondary: #9a8f86;
  --color-text-muted: #6b615a;
  
  --color-accent: #F97316;
  --color-accent-muted: rgba(249, 115, 22, 0.2);
  
  --color-status-online: #10B981;
  --color-status-offline: #EF4444;
  --color-status-unknown: #6B7280;
  
  --color-sage: #8ea89e;
  --color-teal: #6fa5a2;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Radii */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  
  /* Shadows */
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-elevated: 0 4px 16px rgba(0, 0, 0, 0.4);
}
```

---

### Phase 2: Base Card Component (Day 2, Part 2)

**Create:** `components/dashboard/DashboardCard.tsx`

```tsx
interface DashboardCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onExpand?: () => void;
  isExpandable?: boolean;
}

export function DashboardCard({
  title,
  icon,
  children,
  footer,
  onExpand,
  isExpandable = true
}: DashboardCardProps) {
  return (
    <div className="dashboard-card">
      <header className="card-header">
        <div className="card-icon">{icon}</div>
        <h2 className="card-title">{title}</h2>
        {isExpandable && (
          <button onClick={onExpand} className="card-expand">
            <ChevronRight />
          </button>
        )}
      </header>
      
      <div className="card-content">
        {children}
      </div>
      
      {footer && (
        <footer className="card-footer">
          {footer}
        </footer>
      )}
    </div>
  );
}
```

**CSS:**
```css
.dashboard-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.card-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex: 1;
}

.card-content {
  flex: 1;
  min-height: 120px;
}

.card-footer {
  padding-top: var(--space-sm);
  border-top: 1px solid var(--color-border);
}
```

---

### Phase 2: Loading & Error States (Day 2, Part 3)

**Create:** `components/ui/LoadingSkeleton.tsx`

```tsx
export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="loading-skeleton">
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="skeleton-line"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}
```

**Create:** `components/ui/ErrorState.tsx`

```tsx
export function ErrorState({ 
  message = "Failed to load",
  onRetry 
}: { 
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error-state">
      <AlertCircle className="error-icon" />
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry}>Retry</button>
      )}
    </div>
  );
}
```

---

### Phase 3: Tasks Route (Day 3)

**Create:** `app/tasks/page.tsx`

```tsx
export default function TasksPage() {
  const [activeView, setActiveView] = useState<'stack' | 'lens' | 'energy'>('stack');
  
  return (
    <div className="tasks-page">
      {/* View Tabs */}
      <div className="view-tabs">
        <button 
          className={activeView === 'stack' ? 'active' : ''}
          onClick={() => setActiveView('stack')}
        >
          <Layers /> Objective Stack
        </button>
        <button 
          className={activeView === 'lens' ? 'active' : ''}
          onClick={() => setActiveView('lens')}
        >
          <Bot /> Agent Lens
        </button>
        <button 
          className={activeView === 'energy' ? 'active' : ''}
          onClick={() => setActiveView('energy')}
        >
          <Zap /> Energy Map
        </button>
      </div>
      
      {/* View Content */}
      <div className="view-content">
        {activeView === 'stack' && <ObjectiveStackView />}
        {activeView === 'lens' && <AgentLensView />}
        {activeView === 'energy' && <EnergyMapView />}
      </div>
    </div>
  );
}
```

**Modify:** `components/dashboard/TaskWidget.tsx`

Convert to summary card only:
```tsx
export function TaskWidget() {
  // Show: active task count, top 3 tasks, quick add, "Manage →" link
  
  return (
    <DashboardCard
      title="Tasks"
      icon={<CheckSquare />}
      footer={
        <div className="task-footer">
          <button onClick={handleQuickAdd}>+ Add Task</button>
          <Link href="/tasks">Manage →</Link>
        </div>
      }
    >
      <div className="task-summary">
        <p className="task-count">3 active • 2 completed today</p>
        <ul className="task-preview">
          <li>□ Fix login bug</li>
          <li>□ Review PR #42</li>
          <li>□ Update docs</li>
        </ul>
      </div>
    </DashboardCard>
  );
}
```

**Delete:** `components/dashboard/tracker-nav/TaskTrackerNav.tsx`
- Remove all references
- Remove CSS for `.task-desktop-rail` and `.task-mobile-dock-top`

---

### Phase 4: Polish (Day 4-5)

1. **Keyboard Navigation**
   - Tab through cards
   - Enter to expand
   - Escape to close expanded

2. **Focus States**
   - Visible focus rings
   - Consistent across all interactive elements

3. **Responsive Testing**
   - Test at 375px (iPhone SE)
   - Test at 768px (iPad)
   - Test at 1280px (Desktop)
   - Test at 1920px (Large desktop)

4. **Performance**
   - Audit with Lighthouse
   - Remove unused CSS
   - Lazy load non-critical components

---

## File Checklist

### New Files
- [ ] `components/layout/Header.tsx`
- [ ] `components/dashboard/DashboardCard.tsx`
- [ ] `components/ui/LoadingSkeleton.tsx`
- [ ] `components/ui/ErrorState.tsx`
- [ ] `lib/design-tokens.css`
- [ ] `app/tasks/page.tsx`

### Modified Files
- [ ] `app/page.tsx` - New layout
- [ ] `app/layout.tsx` - Add header
- [ ] `app/globals.css` - Remove aurora, import tokens
- [ ] `components/dashboard/AtlasPulse.tsx` - Card format
- [ ] `components/dashboard/LedgerFeed.tsx` - Card format
- [ ] `components/dashboard/ScreenshotStream.tsx` - Card format
- [ ] `components/dashboard/EcosystemMap.tsx` - Card format
- [ ] `components/dashboard/FieldNotes.tsx` - Card format
- [ ] `components/dashboard/TaskWidget.tsx` - Summary only

### Deleted Files
- [ ] `components/dashboard/tracker-nav/TaskTrackerNav.tsx`

### Deleted Code
- [ ] Aurora effects in page.tsx
- [ ] Horizontal carousel in page.tsx
- [ ] `.task-desktop-rail` CSS
- [ ] `.task-mobile-dock-top` CSS

---

## Testing Checklist

- [ ] Header shows correct status
- [ ] Cards display on mobile (1 column)
- [ ] Cards display on desktop (2-3 columns)
- [ ] Cards expand when clicked
- [ ] Loading states appear during fetch
- [ ] Error states appear on failure
- [ ] /tasks route works
- [ ] View tabs switch correctly
- [ ] Keyboard navigation works
- [ ] No horizontal scroll on mobile
- [ ] No console errors

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing functionality | Medium | High | Test each change incrementally |
| CSS conflicts | Medium | Medium | Use design tokens, namespace classes |
| State management issues | Low | Medium | Keep state simple, lift when needed |
| Performance regression | Low | Medium | Lighthouse audit before/after |

---

*Ready to implement. Waiting for approval.*
