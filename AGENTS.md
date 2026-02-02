# Agent Instructions

## ALWAYS READ THIS FIRST

**Before starting any work, read the `use-skill` skill.** This is your single source of truth for all available skills and when to use them. It auto-discovers new skills as they're added.

```bash
# Scan all available skills
bash skills/use-skill/scripts/scan-skills.sh
```

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

