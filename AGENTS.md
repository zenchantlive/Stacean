# Agent Instructions

## ALWAYS READ THIS FIRST

**Before starting any work, read the `use-skill` skill.** This is your single source of truth for all available skills and when to use them. It auto-discovers new skills as they're added.

```bash
# Scan all available skills
bash skills/use-skill/scripts/scan-skills.sh
```

## MANDATORY: Always Use Agent Swarm Workflow

**FOR EVERY TASK, ALWAYS USE THE `agent-swarm-workflow` SKILL.**

This is not optional. Do not use `coding-agent` or other single-agent approaches. The swarm workflow is the default and only method for all work.

### Why
- Parallel execution via multiple agents (Claude Code, Codex, Gemini)
- Self-coordinating through Agent Mail and Beads
- Distributed, robust, and self-organizing
- Quality loops until code is solid

### How
1. Read `skills/agent-swarm-workflow/SKILL.md` **every time** before starting work
2. Use the **EXACT prompts** specified in that skill
3. Spawn agents via NTM: `ntm spawn <project> --cc=3 --cod=2`
4. Let agents self-coordinate via Agent Mail and BV
5. Run quality loops (self-review → cross-review → random exploration) until clean

### Never
- Use single-agent coding tools directly
- Skip the swarm workflow for "small" tasks
- Deviate from the prompts in the skill file

**When in doubt: read the skill file again. It has all the exact prompts and procedures.**

## Project Tracking

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

### TypeScript Best Practices

```typescript
// Explicit return types on handlers
const handleClick = (event: MouseEvent): void => {
  // ... handler code
};

// Explicit return types on map callbacks
const filteredItems = items.map((item): Item => {
  return item;
};

// Explicit return types on useEffect cleanup
useEffect(() => {
  // ... effect code
  return (): void => {
    // cleanup code
  };
}, []);

// Add displayName to components
MyComponent.displayName = 'MyComponent';
```

### Quality Gates

```bash
# Always run build before committing
npm run build

# Check for TypeScript errors
npm run build 2>&1 | grep -i "error"

# Check for ESLint warnings
npm run build 2>&1 | grep -i "warning"
```

## Sending Media via WhatsApp

When sending screenshots or images to the user:

```bash
# Method: Use message tool with filePath parameter
message action=send target=+15306354284 filePath=/path/to/image.png

# Example with agent-browser screenshot:
agent-browser open http://localhost:8765/mail
agent-browser screenshot /tmp/agent-mail.png
agent-browser close
message action=send target=+15306354284 filePath=/tmp/agent-mail.png
```

**Note:** The `media` parameter with file:// URLs doesn't work. Use `filePath` parameter instead.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

