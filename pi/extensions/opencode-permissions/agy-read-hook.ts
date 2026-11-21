// agy PreToolUse hook: applies the shared `read` rules to Antigravity's
// native file-read tools, which run inside agy and never reach Pi's
// tool_call. Registered globally in ~/.gemini/config/hooks.json; it only
// enforces when agy runs under Pi (PI_CODING_AGENT=true), so standalone
// Antigravity sessions are unaffected.
//
// agy treats empty output as allow and `{}` as deny, so every path prints an
// explicit decision. Inside Pi a policy load failure denies (fail closed).

import { decideRead, loadOpenCodePolicy, rulesFor } from "./policy.ts";

const PATH_KEYS = ["AbsolutePath", "Path", "FilePath", "TargetFile", "File", "path", "file_path"];

function reply(decision: "allow" | "deny", reason?: string): never {
	process.stdout.write(JSON.stringify(reason ? { decision, reason } : { decision }));
	process.exit(0);
}

if (process.env.PI_CODING_AGENT !== "true") reply("allow");

let body = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) body += chunk;

try {
	const payload = JSON.parse(body || "{}");
	const args = payload?.toolCall?.args ?? {};
	const cwd = Array.isArray(payload?.workspacePaths) && typeof payload.workspacePaths[0] === "string" ? payload.workspacePaths[0] : process.cwd();
	const policy = loadOpenCodePolicy();
	const rules = rulesFor(policy, policy.defaultAgent);
	for (const key of PATH_KEYS) {
		const file = args[key];
		if (typeof file !== "string" || !file) continue;
		const decision = decideRead(rules, file, cwd);
		if (decision.effect !== "allow") {
			const rule = decision.rule ? ` (rule read "${decision.rule.resource}" -> ${decision.rule.effect})` : "";
			reply("deny", `Permission denied: read "${decision.resource}"${rule}`);
		}
	}
	reply("allow");
} catch (error) {
	reply("deny", `opencode-permissions read hook failed: ${(error as Error).message}`);
}
