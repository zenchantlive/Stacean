#!/usr/bin/env tsx
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const WATCH_PATH = path.join(process.cwd(), ".beads", "issues.jsonl");
const DEBOUNCE_MS = 1500;
let timer: NodeJS.Timeout | null = null;

function runSync() {
  exec("npx tsx scripts/sync-beads-to-kv.ts", (err, stdout, stderr) => {
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    if (err) console.error("[bd:watch] sync error:", err.message);
  });
}

function scheduleSync() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(runSync, DEBOUNCE_MS);
}

if (!fs.existsSync(WATCH_PATH)) {
  console.error("Beads JSONL not found:", WATCH_PATH);
  process.exit(1);
}

console.log("[bd:watch] Watching", WATCH_PATH);
runSync();

fs.watch(WATCH_PATH, { persistent: true }, () => {
  scheduleSync();
});
