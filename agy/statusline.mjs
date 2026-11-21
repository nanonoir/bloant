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

function getConfiguredMcpCount() {
  try {
    const raw = readFileSync(join(homedir(), ".gemini", "config", "mcp_config.json"), "utf8");
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

function fmtReset(seconds) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return "";
  const days = seconds / 86400;
  if (days >= 1) return `${days.toFixed(1)}d`;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${String(mins).padStart(2, "0")}m`;
  return `${Math.max(1, mins)}m`;
}

function quotaColor(pct) {
  if (pct <= 15) return RED;
  if (pct <= 35) return ORANGE;
  return GREEN;
}

function renderBar(pct, width = 8) {
  const clamped = Math.max(0, Math.min(100, pct));
  const filled = Math.round((clamped / 100) * width);
  const empty = Math.max(0, width - filled);
  const color = quotaColor(clamped);
  return `${color}${"█".repeat(filled)}${BAR_EMPTY}${"░".repeat(empty)}${RESET}`;
}

function formatQuotaWindow(label, win) {
  if (!win || typeof win.remaining_fraction !== "number") return "";
  const pct = Math.round(win.remaining_fraction * 100);
  const color = quotaColor(pct);
  const reset = fmtReset(win.reset_in_seconds);
  return `${MUTED}${label}${RESET} ${renderBar(pct, 8)} ${color}${pct}%${RESET}${reset ? ` ${DIM}${reset}${RESET}` : ""}`;
}

function formatSubagents(subs) {
  if (!Array.isArray(subs) || subs.length === 0) return "";
  let running = 0;
  let done = 0;
  let err = 0;
  for (const s of subs) {
    const st = String(s?.status || s?.state || "").toLowerCase();
    if (st.includes("fail") || st.includes("err")) err++;
    else if (st.includes("done") || st.includes("complete") || st.includes("finish")) done++;
    else running++;
  }
  const segs = [];
  if (running) segs.push(`${ORANGE}● ${running} run${RESET}`);
  if (done) segs.push(`${GREEN}✓ ${done} done${RESET}`);
  if (err) segs.push(`${RED}× ${err} err${RESET}`);
  return segs.join(SEP);
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

  // Line 1: Model + Effort + Context + AGY Quota (5h & 7d)
  const line1 = [];
  const rawModel = data.model?.display_name || data.model?.id || "";
  const effort = data.model?.effort || "";
  // Strip trailing "(Medium)" etc. if effort is also provided separately
  const cleanModel = effort
    ? rawModel.replace(new RegExp(`\\s*\\(${effort}\\)$`, "i"), "").trim()
    : rawModel;

  if (cleanModel) {
    line1.push(effort ? `${BLUE}${cleanModel}${RESET} ${ORANGE}${effort}${RESET}` : `${BLUE}${cleanModel}${RESET}`);
  }

  const ctxPct = data.context_window?.used_percentage;
  const ctxTokens = data.context_window?.total_input_tokens;
  if (typeof ctxPct === "number" || typeof ctxTokens === "number") {
    const tStr = typeof ctxTokens === "number" ? `${fmtTokens(ctxTokens)} ` : "";
    const pStr = typeof ctxPct === "number" ? `(${Math.round(ctxPct)}%)` : "";
    const cColor = typeof ctxPct === "number" && ctxPct >= 80 ? ORANGE : MUTED;
    line1.push(`${cColor}${tStr}${pStr}${RESET}`.trim());
  }

  const q5h = formatQuotaWindow("5h", data.quota?.["gemini-5h"]);
  const q7d = formatQuotaWindow("7d", data.quota?.["gemini-weekly"]);
  if (q5h) line1.push(q5h);
  if (q7d) line1.push(q7d);

  // Line 2: Dir:branch + Subagents (if present) + MCP count + Agent state
  const line2 = [];
  const cwd = data.cwd || data.workspace?.current_dir || process.cwd();
  const branch = getGitBranch(cwd);
  const loc = branch ? `${shortPath(cwd)}:${branch}` : shortPath(cwd);
  if (loc) line2.push(`${MUTED}${loc}${RESET}`);

  const subText = formatSubagents(data.subagents || data.swarm?.workers);
  if (subText) line2.push(subText);

  const mcpCount = getConfiguredMcpCount();
  if (mcpCount > 0) line2.push(`${MUTED}MCP ${GREEN}${mcpCount}${RESET}`);

  const state = data.agent_state;
  if (state && state !== "idle") {
    line2.push(`${ORANGE}● ${state}${RESET}`);
  }

  const out = [line1.join(SEP), line2.join(SEP)].filter(Boolean).join("\n");
  process.stdout.write(out + "\n");
}

main().catch(() => {
  process.stdout.write("\n");
});
