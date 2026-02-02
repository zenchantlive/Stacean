# Agent Swarm Workflow Setup - Stacean

**Date:** 2026-02-02
**Status:** ✅ COMPLETE

## Overview

This document describes the agent-swarm-workflow setup for parallel agent execution in the Stacean (Atlas Cockpit) project.

## Prerequisites Status

### ✅ 1. Agent Mail Server
- **Status:** Running on port 8765
- **URL:** http://localhost:8765
- **Token:** Configured (see MCP Agent Mail)
- **Access:** `am` command available

**To start Agent Mail:**
```bash
cd /home/clawdbot/clawd/mcp_agent_mail
./scripts/run_server_with_token.sh
# or simply:
am
```

### ✅ 2. NTM (Named Tmux Manager)
- **Status:** Installed
- **Location:** /home/linuxbrew/.linuxbrew/bin/ntm
- **Version:** Available

**Basic Commands:**
```bash
# List sessions
ntm list

# Create new session
ntm create myproject

# Attach to session
ntm attach myproject

# Robot mode (for non-interactive shells)
ntm --robot-spawn=myproject --spawn-cc=1 --spawn-wait --json
```

### ✅ 3. Beads (bd) Task Tracker
- **Status:** Configured and working
- **Data:** `/home/clawdbot/stacean-repo/.beads/issues.jsonl`
- **Commands:**
  ```bash
  bd ready              # Find available work
  bd show <id>          # View issue details
  bd update <id> --status in_progress  # Claim work
  bd close <id>         # Complete work
  bd sync               # Sync with git
  ```

### ✅ 4. BV (Beads Viewer)
- **Status:** Available for task prioritization
- **Robot Commands:**
  ```bash
  bv --robot-triage     # Get priority recommendations
  bv --robot-next       # Get single top pick
  bv --robot-plan       # Get parallel execution tracks
  bv --robot-insights   # Get graph analytics
  ```

### ✅ 5. Agent Swarm Workflow Skill
- **Status:** Available via scan-skills.sh
- **Location:** /home/clawdbot/clawd/skills/agent-swarm-workflow/SKILL.md
- **Discovery:** Via `skills/use-skill/scripts/scan-skills.sh`

## Swarm Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         BEADS                               │
│     (Task graph with dependencies, priorities, status)      │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌─────────────────────────────┐  ┌─────────────────────────┐
│        BV                   │  │     AGENT MAIL          │
│  (What to work on)          │  │  (Coordination layer)   │
└─────────────────────────────┘  └─────────────────────────┘
         │                            │
         └──────────────┬─────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    NTM + AGENTS                             │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐     │
│  │ CC  │  │ CC  │  │ Cod │  │ Gmi │  │ CC  │  │ Cod │     │
│  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Council Roles (Default)

1. **Architect** - Map architecture, risks, integration points
2. **Analyst** - Validate requirements, identify gaps
3. **Implementer** - Choose bead and start implementation
4. **Reviewer** - Review code for bugs/quality

## Starting a Swarm (OpenClaw)

**Using sessions_spawn from OpenClaw:**

```text
# Architect
sessions_spawn(task="[Council Role: Architect] Read AGENTS.md + README.md. Map architecture, risks, and integration points. Then pick the highest‑impact bead via bv --robot-triage.")

# Analyst
sessions_spawn(task="[Council Role: Analyst] Read AGENTS.md + README.md. Validate requirements vs PRD, identify gaps, then pick a bead to implement.")

# Implementer
sessions_spawn(task="[Council Role: Implementer] Read AGENTS.md + README.md. Choose a bead and start implementation. Coordinate via Agent Mail.")

# Reviewer
sessions_spawn(task="[Council Role: Reviewer] Review other agents' code for bugs/quality. Use the cross-review prompt and report fixes.")
```

## Alternative: NTM (Non-interactive)

```bash
# Spawn agents in robot mode
ntm --robot-spawn=stacean --spawn-cc=0 --spawn-cod=0 --spawn-gmi=0 --spawn-wait --json

# Send initial prompt
ntm --robot-send=stacean --msg-file initial_prompt.txt --json

# Attach to monitor
ntm attach stacean
```

## Agent Mail Integration

Each agent should:
1. **Register** with Agent Mail at session start
2. **Reserve files** before editing
3. **Announce work** via messages with bead ID in thread_id
4. **Check inbox** between tasks
5. **Release reservations** when done

**Example workflow:**
```python
# Register agent
ensure_project(project_key="/home/clawdbot/stacean-repo")
register_agent(project_key="/home/clawdbot/stacean-repo", program="Claude Code", model="Opus 4", name="Reviewer")

# Reserve files before editing
file_reservation_paths(project_key="/home/clawdbot/stacean-repo", agent_name="Reviewer", paths=["app/**/*.tsx"], ttl_seconds=3600, exclusive=true)

# Announce work
send_message(project_key="/home/clawdbot/stacean-repo", to=["Architect", "Analyst", "Implementer"], subject="[clawd-xxx] Starting work", body_md="Working on feature X", thread_id="clawd-xxx")
```

## Quality Loops

After completing work, agents should run:

1. **Self-review** - Review own code
2. **Cross-review** - Review other agents' code
3. **Random exploration** - Deep dive into random code paths

## Files Modified During This Setup

- **Created:** `docs/agent-swarm-setup.md` (this file)
- **Verified:** NTM installation
- **Verified:** Agent Mail server running
- **Verified:** Skills scan includes agent-swarm-workflow
- **Verified:** BV available for task prioritization

## Next Steps (Optional)

1. **Create alias for Agent Mail:**
   ```bash
   alias am='cd /home/clawdbot/clawd/mcp_agent_mail && ./scripts/run_server_with_token.sh'
   ```

2. **Add to AGENTS.md:** Include the Agent Mail + Beads integration blurb

3. **Configure pre-commit guard:** For file reservation enforcement

4. **Create spawn script:** For easy swarm startup:
   ```bash
   # scripts/start-swarm.sh
   #!/bin/bash
   ntm --robot-spawn=stacean --spawn-cc=3 --spawn-cod=1 --spawn-gmi=0 --spawn-wait --json
   ```

## References

- **Skill:** /home/clawdbot/clawd/skills/agent-swarm-workflow/SKILL.md
- **AGENTS.md:** /home/clawdbot/stacean-repo/AGENTS.md
- **Beads:** /home/clawdbot/stacean-repo/.beads/issues.jsonl
- **Agent Mail:** /home/clawdbot/clawd/mcp_agent_mail/README.md

---

*Setup completed: 2026-02-02*
