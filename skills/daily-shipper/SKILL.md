# Daily Shipper - Autonomous App Shipper

**Version:** 1.0.0
**Updated:** 2026-02-01

## Purpose

Ship 1 new GitHub repo (standalone app) every morning, before Jordan wakes up. Each app is autonomous from a trending X topic.

## How It Works

1. **Morning Pipeline (04:00 - 06:15 local time)**
   - Scan X for AI/tech trends
   - Select 1 winning trend
   - Generate app spec
   - Build app
   - Test locally
   - Push to GitHub (new repo)
   - Notify Jordan with summary + link

2. **Tech Selection**
   - Web apps with UI → Rails or Next.js (Vercel deploy)
   - CLI tools → Ruby gem or Node package
   - Browser extensions → Manifest + JavaScript
   - Scraping utilities → Ruby or Python
   - Simple scripts → JavaScript
   - Performance-critical → Rust or Go

3. **Local Hosting (until Render API key)**
   - Test apps locally first
   - When app needs live hosting → notify Jordan for Render API key

## Usage

### Enable Daily Shipping

Add to `HEARTBEAT.md`:

```markdown
## Daily Shipper (every 24h)
If 24h since last ship:
1. Check X for AI/tech trends
2. Score and select 1 trend
3. Generate app from template
4. Test locally
5. Push to GitHub (new repo)
6. Create PR to showcase repo if applicable
7. Notify Jordan with summary + link
```

### Manual Trigger

To ship immediately without waiting for heartbeat:

```bash
node /home/clawdbot/clawd/skills/daily-shipper/lib/index.js
```

## Configuration

### GitHub Access

Requires environment variable (already configured):

```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=zenchantlive
```

**Note:** The `GITHUB_TOKEN` is already available in this environment. Skill uses it directly.

## Coding Standards (All Apps)

Every app must include:

| Rule | Requirement |
|-------|-------------|
| 1 | Meaningful git commits (no "fix", "update") |
| 2 | README.md with: purpose, usage, demo, installation |
| 3 | LICENSE file (MIT) |
| 4 | .gitignore for language-specific artifacts |
| 5 | Error handling (no silent failures) |
| 6 | No secrets hardcoded (use env vars) |
| 7 | At least happy path tested before push |
| 8 | Clean repo structure (not spaghetti) |

## Templates

The skill includes templates for different app types:

- `/templates/rails/` — Rails web app scaffold
- `/templates/nextjs/` — Next.js + Vercel scaffold
- `/templates/ruby-gem/` — Ruby CLI gem scaffold
- `/templates/node-cli/` — Node.js CLI package
- `/templates/browser-ext/` — Chrome extension scaffold
- `/templates/python/` — Python script scaffold
- `/templates/rust/` — Rust CLI tool scaffold

## Trend Selection Algorithm

```
Score = (Engagement × Novelty × Buildability × ViralPotential)

Engagement: likes/RTs in last 6h
Novelty: NOT "another todo app" — new angle
Buildability: Can I ship MVP in 2 hours?
ViralPotential: Will devs retweet this?
```

## Logging

All activity logged to:

```
/home/clawdbot/clawd/skills/daily-shipper/logs/daily_ship.log
```

## Files

- `lib/index.js` — Main entry point, runs full pipeline
- `lib/trend_scanner.js` — Scan X for trends
- `lib/selector.js` — Pick winning trend
- `lib/app_builder.js` — Generate app spec
- `lib/coder.js` — Build the app
- `lib/tester.js` — Test locally
- `lib/github_pusher.js` — Push to GitHub
- `config/standards.js` — Coding rules enforcement
- `templates/` — App scaffolds

## Author

Atlas (Daily Shipper v1.0.0)
