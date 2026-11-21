// Enforces the permission rules shared with OpenCode (its system config,
// %ProgramData%\opencode\opencode.json on Windows) inside Pi. See policy.ts for the matching semantics and the intentional
// differences from OpenCode's runtime.
//
// Enforcement points:
// - tool_call for `bash`/`powershell` (also agy native commands routed through
//   the Antigravity approval gate, and nested codemode calls) and `read`.
// - pi-subagents capability ceiling: which agents the session may launch,
//   following the OpenCode agent that matches the active profile.
// - pi-subagents required child extensions: this file is loaded into every
//   native child session, including foreground children that otherwise skip
//   ambient extensions; launches on runners that cannot load it are rejected.

import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { allowedSubagents, decideRead, decideShell, defaultConfigPath, loadOpenCodePolicy, rulesFor, type Decision, type OpenCodePolicy } from "./policy.ts";

const SUBAGENTS_ROOT = path.join(os.homedir(), ".pi", "agent", "npm", "node_modules", "pi-subagents", "bundle");
const PROFILE_ENTRY = "pi-agents-profile-cycler";
// Delegation tools that start an agent outside pi-subagents. OpenCode has no
// such tools, so they fall under the orchestrator's `subagent` rules.
const EXTERNAL_DELEGATION_TOOLS = new Set(["AskAntigravity"]);

const selfPath = (() => {
	try {
		return fileURLToPath(import.meta.url);
	} catch {
		return path.join(os.homedir(), ".pi", "agent", "extensions", "opencode-permissions", "index.ts");
	}
})();

async function importSubagents(name: string): Promise<any | undefined> {
	try {
		return await import(pathToFileURL(path.join(SUBAGENTS_ROOT, `${name}.js`)).href);
	} catch {
		return undefined;
	}
}

export default function (pi: ExtensionAPI) {
	let policy: OpenCodePolicy | undefined;
	let loadError: string | undefined;
	let ceilingApi: any;
	let ceiling: { update(options: any): void; dispose(): void } | undefined;
	let childRegistration: { dispose(): void } | undefined;
	let ceilingKey = "";

	const load = () => {
		try {
			policy = loadOpenCodePolicy();
			loadError = undefined;
		} catch (error) {
			policy = undefined;
			loadError = `opencode-permissions: cannot load the shared permission rules from ${defaultConfigPath()} (${(error as Error).message}); blocking guarded tools.`;
		}
	};

	/** OpenCode agent for the session: the active profile when OpenCode has a
	 *  primary agent of that name (for example `teacher`), else default_agent. */
	const activeAgent = (ctx: ExtensionContext): string => {
		if (!policy) return "";
		let profile: string | undefined;
		for (const entry of ctx.sessionManager.getEntries() as any[]) {
			if (entry?.type === "custom" && entry.customType === PROFILE_ENTRY && typeof entry.data?.profile === "string") profile = entry.data.profile;
		}
		return profile && policy.agents[profile]?.mode === "primary" ? profile : policy.defaultAgent;
	};

	const syncCeiling = (ctx: ExtensionContext) => {
		if (!policy || !ceilingApi) return;
		const allowed = allowedSubagents(policy, activeAgent(ctx));
		const key = allowed?.join(",") ?? "*";
		if (key === ceilingKey) return;
		ceilingKey = key;
		if (!allowed) {
			ceiling?.dispose();
			ceiling = undefined;
			return;
		}
		const options = { sessionId: ctx.sessionManager.getSessionId(), source: "opencode-permissions", ceiling: { allowedAgents: allowed } };
		if (ceiling) ceiling.update(options);
		else ceiling = ceilingApi.registerSubagentCapabilityCeiling(options);
	};

	const enforce = async (decision: Decision, what: string, ctx: ExtensionContext) => {
		if (decision.effect === "allow") return undefined;
		const rule = decision.rule ? ` (rule ${decision.rule.action} "${decision.rule.resource}" -> ${decision.rule.effect})` : "";
		if (decision.effect === "ask" && ctx.hasUI) {
			const ok = await ctx.ui.confirm("Permission required", `${what}: ${decision.resource}${rule}`);
			if (ok) return undefined;
		}
		return { block: true, reason: `Permission denied: ${what} "${decision.resource}"${rule}` };
	};

	pi.on("session_start", async (_event, ctx) => {
		load();
		if (loadError) {
			if (ctx.hasUI) ctx.ui.notify(loadError, "error");
			return;
		}
		const sessionId = ctx.sessionManager.getSessionId();
		const [ceilingModule, requiredApi] = await Promise.all([importSubagents("capability-ceiling"), importSubagents("required-child-extensions")]);
		ceilingApi = ceilingModule;
		ceiling?.dispose();
		childRegistration?.dispose();
		ceiling = undefined;
		ceilingKey = "";
		try {
			childRegistration = requiredApi?.registerRequiredChildExtensions({
				sessionId,
				extensions: [{ id: "opencode-permissions", path: selfPath }],
				requireForAllRunners: true,
			});
		} catch (error) {
			if (ctx.hasUI) ctx.ui.notify(`opencode-permissions: child enforcement unavailable (${(error as Error).message})`, "warning");
		}
		syncCeiling(ctx);
	});

	pi.on("session_shutdown", async () => {
		ceiling?.dispose();
		childRegistration?.dispose();
		ceiling = undefined;
		childRegistration = undefined;
		ceilingKey = "";
	});

	pi.on("before_agent_start", async (_event, ctx) => {
		syncCeiling(ctx);
	});

	pi.on("tool_call", async (event, ctx) => {
		const name = event.toolName;
		const input = event.input as Record<string, unknown>;
		const guarded = name === "bash" || name === "powershell" || name === "read" || name === "subagent" || EXTERNAL_DELEGATION_TOOLS.has(name);
		if (!guarded) return undefined;
		if (!policy) return { block: true, reason: loadError ?? "opencode-permissions: policy not loaded" };
		const rules = rulesFor(policy, activeAgent(ctx));

		if (name === "bash" || name === "powershell") {
			const command = typeof input.command === "string" ? input.command : "";
			return enforce(decideShell(rules, command, name === "bash" ? "bash" : "powershell"), "shell", ctx);
		}
		if (name === "read") {
			const file = typeof input.path === "string" ? input.path : "";
			return enforce(decideRead(rules, file, ctx.cwd), "read", ctx);
		}
		if (name === "subagent") {
			// The capability ceiling enforces the agent list; refresh it in case
			// the profile changed since the turn started.
			syncCeiling(ctx);
			return undefined;
		}
		const allowed = allowedSubagents(policy, activeAgent(ctx));
		if (allowed && !allowed.includes(name)) return { block: true, reason: `Permission denied: subagent "${name}" is not allowed by the permission policy` };
		return undefined;
	});
}
