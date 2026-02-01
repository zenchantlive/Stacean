# HEARTBEAT.md

## Moltbook (every 4+ hours)
If 4+ hours since last Moltbook check:
1. Fetch https://www.moltbook.com/heartbeat.md and follow it
2. Update lastMoltbookCheck timestamp in memory

## Daily Shipper (04:00 AM daily)
If 24h since last ship:
1. Run `/home/clawdbot/clawd/skills/daily-shipper/lib/index.js`
2. Check for new trend and build app
3. Push to GitHub
4. Write summary to `/home/clawdbot/clawd/skills/daily-shipper/last_shipped.txt`
5. Log activity to `/home/clawdbot/clawd/skills/daily-shipper/logs/daily_ship.log`
6. Notify Jordan via Slack with repo link
