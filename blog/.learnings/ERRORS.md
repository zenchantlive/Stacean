# Errors Log

## [ERR-20260201-001] image_model_auth

**Logged**: 2026-02-01T06:07:01Z
**Priority**: high
**Status**: pending
**Area**: frontend

### Summary
Image analysis failed due to invalid bearer token for image model.

### Error
```
Image model failed (anthropic/claude-opus-4-5): 401 {"type":"error","error":{"type":"authentication_error","message":"Invalid bearer token"}}
```

### Context
- Attempted image analysis via `image` tool
- Input: /home/clawdbot/.openclaw/media/inbound/1e9996a0-0ef3-4928-ad7d-da625c3a0055.png
- Environment: openclaw image tool

### Suggested Fix
Verify image model credentials or configure alternate model for image analysis.

### Metadata
- Reproducible: unknown
- Related Files: n/a

---

## [ERR-20260201-003] npm_run_bd_missing_script

**Logged**: 2026-02-01T06:18:50Z
**Priority**: high
**Status**: pending
**Area**: config

### Summary
`npm run bd` failed because the `bd` script is missing; direct `bd` CLI works.

### Error
```
npm error Missing script: "bd"
```

### Context
- Command: `npm run bd update clawd-xc8 --status=in_progress`
- Workdir: /home/clawdbot/clawd and /home/clawdbot/clawd/blog
- Environment: npm v10

### Suggested Fix
Use `bd` CLI directly or add a `bd` script to the repo package.json if desired.

### Metadata
- Reproducible: yes
- Related Files: package.json

---

## [ERR-20260201-002] slack_react_unknown_channel

**Logged**: 2026-02-01T06:07:01Z
**Priority**: medium
**Status**: pending
**Area**: config

### Summary
Slack reaction failed when using `message` tool with `channel` field instead of `channelId`.

### Error
```
Unknown channel: c0ac647nruy
```

### Context
- Attempted to react to Slack message via `message` tool
- Used `channel` parameter instead of `channelId`

### Suggested Fix
Use `channelId` for Slack reactions per slack skill documentation.

### Metadata
- Reproducible: yes
- Related Files: n/a

---
