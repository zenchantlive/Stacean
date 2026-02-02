---
name: use-skill
description: "Meta-skill that catalogs all available skills, explains when and how to use each one, and auto-discovers new skills. ALWAYS read this skill first before starting work to understand what tools are available. Use this as the single source of truth for skill selection."
---

# Use-Skill: Skill Catalog & Usage Guide

> **ALWAYS READ THIS SKILL FIRST** before starting any work. This is your single source of truth for what skills are available and when to use them.

## Quick Start

```bash
# Scan for all available skills
bash skills/use-skill/scripts/scan-skills.sh
```

## Currently Installed Skills

### 🧠 Core Agent Capabilities

| Skill | When to Use | Key Features |
|-------|-------------|--------------|
| **agent-browser** | Headless browser automation outside OpenClaw's built-in browser | Navigate, click, fill forms, screenshots, PDFs, network interception, console inspection |
| **codebase-cartographer** | Understanding large codebases | Rust-based agentlens CLI, generates .agentlens/ docs, finds TODOs, symbols, dependencies |
| **agent-swarm-workflow** | Multi-agent parallel implementation | NTM + Agent Mail + BV coordination, exact prompts for swarm execution |
| **council** | Complex decisions needing multiple expert perspectives | Multi-persona deliberation (architect, analyst, security), 3-turn debate structure |
| **autonomous-skill-orchestrator** | Tasks requiring autonomous execution without babysitting | Freeze intent → plan → execute → loop, strict guardrails |

### 🔧 Development & Code Quality

| Skill | When to Use | Key Features |
|-------|-------------|--------------|
| **skill-creator** | Creating new skills or updating existing ones | init_skill.py, package_skill.py, validation |
| **memory-hygiene** | Vector memory cleanup and optimization | Audit LanceDB, wipe/reseed, disable auto-capture |
| **ai-cron-gen** | Generating cron expressions from natural language | "Every Monday at 3pm" → "0 15 * * 1" |

### 📋 Project Management

| Skill | When to Use | Key Features |
|-------|-------------|--------------|
| **beads-workflow** | Task tracking with bd (beads) | Create, update, sync tasks with git |
| **agent-mail** | Multi-agent coordination via mail system | Inbox/outbox, file reservations, threaded messaging |

### 🌐 External Integrations

| Skill | When to Use | Key Features |
|-------|-------------|--------------|
| **moltbook-interact** | Reading from Moltbook agent social network | Browse posts, analyze (requires API credentials) |

## Skill Selection Decision Tree

```
Starting a task?
├── Need browser automation?
│   └── Use: agent-browser
├── Working with large codebase?
│   └── Use: codebase-cartographer
├── Complex decision with trade-offs?
│   └── Use: council
├── Want to run autonomously without questions?
│   └── Use: autonomous-skill-orchestrator
├── Multi-agent parallel work?
│   └── Use: agent-swarm-workflow
├── Creating/updating a skill?
│   └── Use: skill-creator
├── Memory issues or cleanup needed?
│   └── Use: memory-hygiene
└── Task tracking with beads?
    └── Use: beads-workflow
```

## Auto-Discovery

This skill auto-discovers new skills added after its creation. Run the scan script to update the catalog:

```bash
bash skills/use-skill/scripts/scan-skills.sh
```

## Important Notes

1. **Always check this skill first** - New skills may have been added since last session
2. **Skills can be combined** - Example: Use council to decide architecture, then autonomous-skill-orchestrator to implement
3. **Some skills need setup** - Check each skill's Prerequisites section before first use
4. **Ping the user** - Always announce when activating a skill: "Using skill: [name]"

## Skills to Avoid (Redundant/Broken)

| Skill | Reason | Alternative |
|-------|--------|-------------|
| **god-mode** | CLI not installable, docs incomplete | Manual git/gh commands |
| **agentlens** (npm) | No CLI binary, guidance only | Use codebase-cartographer (Rust CLI) |
| **chromadb-memory** | Redundant - we use LanceDB | Use memory-hygiene |
| **supermemory** | Requires OpenAI API + external DB | Use memory-hygiene |

## References

- Full skill details: See individual SKILL.md files in `skills/[name]/`
- New skills: Check `skills/use-skill/scripts/scan-skills.sh` output
