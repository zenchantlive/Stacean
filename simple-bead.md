Unify navigation and fix competing nav systems

---

### Current Issues

**Mobile:**
- Main page has bottom dock AND task widget has top dock
- Navigation is confusing with multiple active indicators

**Desktop:**
- Main page has top nav bar
- TaskTrackerNav has left rail showing on main page
- ActiveTaskBar component exists but is never used
- Desktop nav uses scrollIntoView() but no state persistence

**Architecture:**
- Fragmented navigation with no unified paradigm
- Orphaned ActiveTaskBar component
- Phone container still forces tiny layout on desktop

### Tasks

- Remove TaskTrackerNav from main page
- Remove ActiveTaskBar orphan
- Fix phone container CSS (remove max-width constraint)
- Implement unified navigation state
- Fix mobile dock spacing
- Fix desktop nav interaction
