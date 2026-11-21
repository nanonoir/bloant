import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// OpenCode-inspired truecolor ANSI palette
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BLUE = "\x1b[38;2;92;156;245m";
const GREEN = "\x1b[38;2;127;216;143m";
const ORANGE = "\x1b[38;2;250;178;131m";
const RED = "\x1b[38;2;239;107;115m";
const MUTED = "\x1b[38;2;138;138;138m";
const BAR_EMPTY = "\x1b[38;2;64;64;64m";
const SEP = ` ${DIM}·${RESET} `;

function shortPath(p) {
  if (!p) return "";
  const home = homedir().replace(/\\/g, "/");
  let norm = p.replace(/\\/g, "/");
  if (norm.toLowerCase().startsWith(home.toLowerCase())) {
    norm = "~" + norm.slice(home.length);
  }
  return norm;
}

function getGitBranch(cwd) {
  if (!cwd) return "";
  try {
    return execFileSync("git", ["-C", cwd, "rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf8",
      timeout: 350,
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
    }).trim();
  } catch {
    return "";
  }
}

function getConfiguredEffort() {
  try {
    const raw = readFileSync(join(homedir(), ".claude", "settings.json"), "utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed?.effortLevel === "string" ? parsed.effortLevel : "";
  } catch {
    return "";
  }
}

function getConfiguredMcpCount() {
  try {
    const raw = readFileSync(join(homedir(), ".claude.json"), "utf8");
    const parsed = JSON.parse(raw);
    return Object.keys(parsed?.mcpServers ?? {}).length;
  } catch {
    return 0;
  }
}

function fmtTokens(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtReset(resetsAt) {
  if (resetsAt == null) return "";
  let seconds = 0;
  if (typeof resetsAt === "number" && Number.isFinite(resetsAt)) {
    const nowSec = Math.floor(Date.now() / 1000);
    seconds = resetsAt > 1_000_000_000_000 ? Math.floor(resetsAt / 1000) - nowSec : resetsAt - nowSec;
  } else if (typeof resetsAt === "string") {
    const ms = Date.parse(resetsAt);
    if (Number.isFinite(ms)) seconds = Math.floor((ms - Date.now()) / 1000);
  }
  if (seconds <= 0) return "";
  const days = seconds / 86400;
  if (days >= 1) return `${days.toFixed(1)}d`;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${String(mins).padStart(2, "0")}m`;
  return `${Math.max(1, mins)}m`;
}

function quotaColor(remainingPct) {
  if (remainingPct <= 15) return RED;
  if (remainingPct <= 35) return ORANGE;
  return GREEN;
}

function renderBar(remainingPct, width = 8) {
  const clamped = Math.max(0, Math.min(100, remainingPct));
  const filled = Math.round((clamped / 100) * width);
  const empty = Math.max(0, width - filled);
  const color = quotaColor(clamped);
  return `${color}${"█".repeat(filled)}${BAR_EMPTY}${"░".repeat(empty)}${RESET}`;
}

function formatRateLimit(label, win) {
  if (!win || typeof win.used_percentage !== "number") return "";
  const remaining = Math.max(0, Math.min(100, Math.round(100 - win.used_percentage)));
  const color = quotaColor(remaining);
  const reset = fmtReset(win.resets_at);
  return `${MUTED}${label}${RESET} ${renderBar(remaining, 8)} ${color}${remaining}%${RESET}${reset ? ` ${DIM}${reset}${RESET}` : ""}`;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8").trim();
}

async function main() {
  const raw = await readStdin();
  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {}
  }

  // Line 1: Model + Effort + Context + Rate limits (5h & 7d)
  const line1 = [];
  const rawModel = data.model?.display_name || data.model?.id || "";
  const effort = data.model?.effort || data.effort_level || getConfiguredEffort();
  if (rawModel) {
    line1.push(effort ? `${BLUE}${rawModel}${RESET} ${ORANGE}${effort}${RESET}` : `${BLUE}${rawModel}${RESET}`);
  }

  const ctxPct = data.context_window?.used_percentage;
  const ctxTokens =
    data.context_window?.current_usage?.input_tokens ??
    data.context_window?.total_input_tokens;
  if (typeof ctxPct === "number" || typeof ctxTokens === "number") {
    const tStr = typeof ctxTokens === "number" ? `${fmtTokens(ctxTokens)} ` : "";
    const pStr = typeof ctxPct === "number" ? `(${Math.round(ctxPct)}%)` : "";
    const cColor = typeof ctxPct === "number" && ctxPct >= 80 ? ORANGE : MUTED;
    line1.push(`${cColor}${tStr}${pStr}${RESET}`.trim());
  }

  const r5h = formatRateLimit("5h", data.rate_limits?.five_hour);
  const r7d = formatRateLimit("7d", data.rate_limits?.seven_day);
  if (r5h) line1.push(r5h);
  if (r7d) line1.push(r7d);

  // Line 2: Dir:branch + MCP count + Session cost
  const line2 = [];
  const cwd = data.workspace?.current_dir || data.cwd || process.cwd();
  const branch = getGitBranch(cwd);
  const loc = branch ? `${shortPath(cwd)}:${branch}` : shortPath(cwd);
  if (loc) line2.push(`${MUTED}${loc}${RESET}`);

  const mcpCount = getConfiguredMcpCount();
  if (mcpCount > 0) line2.push(`${MUTED}MCP ${GREEN}${mcpCount}${RESET}`);

  const cost = data.cost?.total_cost_usd;
  if (typeof cost === "number" && cost > 0) {
    line2.push(`${MUTED}$${cost.toFixed(2)}${RESET}`);
  }

  const out = [line1.join(SEP), line2.join(SEP)].filter(Boolean).join("\n");
  process.stdout.write(out + "\n");
}

main().catch(() => {
  process.stdout.write("\n");
});
