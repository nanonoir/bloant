// Pure policy logic for the opencode-permissions extension.
//
// Rules live in OpenCode's system config (%ProgramData%\opencode\opencode.json
// on Windows), a file that holds only the permission rules shared by OpenCode
// and Pi. They use the OpenCode V2 format and are evaluated with its semantics
// (ordered
// rules, last match wins, `*`/`?` whole-value wildcards, a trailing ` *` in a
// shell pattern also matches the bare command, any denied resource denies the
// operation).
//
// Intentional differences from OpenCode's runtime (decided with the user):
// - Shell commands are unwrapped before matching: nested shells
//   (bash/sh -c, pwsh/powershell -Command/-EncodedCommand, cmd /c, wsl),
//   Invoke-Expression/iex/eval, git global options (-C, -c, --git-dir, ...)
//   and executable spellings (git.exe, GIT, C:\...\git.exe). OpenCode lets
//   these wrapped forms through.
// - Only the executable name is case-insensitive; arguments are matched
//   case-sensitively, so `git checkout -b` is allowed while `-B` stays denied.
// - Reads are checked against both the cwd-relative and the absolute path, so
//   `**/*.key` also covers files at the project root.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type Effect = "allow" | "deny" | "ask";

export interface Rule {
	action: string;
	resource: string;
	effect: Effect;
}

export interface OpenCodeAgent {
	mode?: string;
	permissions?: Rule[];
}

export interface OpenCodePolicy {
	source: string;
	defaultAgent: string;
	global: Rule[];
	agents: Record<string, OpenCodeAgent>;
	/** Agents that OpenCode commands run directly (for example `/init`). */
	commandAgents: string[];
}

// OpenCode V2 base policy that every agent starts with.
const BASE_RULES: Rule[] = [
	{ action: "*", resource: "*", effect: "allow" },
	{ action: "read", resource: "*.env", effect: "ask" },
	{ action: "read", resource: "*.env.*", effect: "ask" },
	{ action: "read", resource: "*.env.example", effect: "allow" },
];

// Agents that OpenCode runs through commands (`/init`). OpenCode commands
// bypass the orchestrator's `subagent` rules; Pi runs the same commands
// through the subagent tool, so these agents stay launchable.
const COMMAND_AGENTS = ["init"];

// Pi's main session plays OpenCode's orchestrator. The shared file holds only
// rules, so default_agent normally stays in the user's OpenCode config.
const DEFAULT_AGENT = "orchestrator";

/** OpenCode's system config, which holds only the shared permission rules. */
export function defaultConfigPath(): string {
	if (process.env.PI_PERMISSIONS_CONFIG) return process.env.PI_PERMISSIONS_CONFIG;
	if (process.platform === "win32") return path.join(process.env.ProgramData ?? "C:\\ProgramData", "opencode", "opencode.json");
	if (process.platform === "darwin") return "/Library/Application Support/opencode/opencode.json";
	return "/etc/opencode/opencode.json";
}

export function loadOpenCodePolicy(configPath = defaultConfigPath()): OpenCodePolicy {
	const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
	const global = Array.isArray(raw.permissions) ? raw.permissions.filter(isRule) : [];
	const agents: Record<string, OpenCodeAgent> = {};
	for (const [name, value] of Object.entries<any>(raw.agents ?? {})) {
		agents[name] = { mode: value?.mode, permissions: Array.isArray(value?.permissions) ? value.permissions.filter(isRule) : [] };
	}
	return {
		source: configPath,
		defaultAgent: typeof raw.default_agent === "string" ? raw.default_agent : DEFAULT_AGENT,
		global,
		agents,
		commandAgents: COMMAND_AGENTS,
	};
}

function isRule(value: any): value is Rule {
	return value && typeof value.action === "string" && typeof value.resource === "string" && ["allow", "deny", "ask"].includes(value.effect);
}

/** Ordered rules for one agent: base, then global, then agent rules. */
export function rulesFor(policy: OpenCodePolicy, agent: string): Rule[] {
	return [...BASE_RULES, ...policy.global, ...(policy.agents[agent]?.permissions ?? [])];
}

// ---------------------------------------------------------------- matching

const regexCache = new Map<string, RegExp>();

function wildcard(pattern: string, flags: string): RegExp {
	const key = `${flags}:${pattern}`;
	let re = regexCache.get(key);
	if (!re) {
		let source = "";
		for (const ch of pattern) {
			if (ch === "*") source += "[\\s\\S]*";
			else if (ch === "?") source += "[\\s\\S]";
			else source += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
		}
		re = new RegExp(`^${source}$`, flags);
		regexCache.set(key, re);
	}
	return re;
}

export function matches(pattern: string, value: string, caseInsensitive: boolean): boolean {
	const flags = caseInsensitive ? "i" : "";
	if (wildcard(pattern, flags).test(value)) return true;
	// OpenCode: a shell pattern ending in " *" also matches the bare command.
	return pattern.endsWith(" *") && wildcard(pattern.slice(0, -2), flags).test(value);
}

/** Last matching rule wins; no match means `ask` (OpenCode default). */
export function evaluate(rules: Rule[], action: string, resource: string, caseInsensitive: boolean): Rule | undefined {
	let result: Rule | undefined;
	for (const rule of rules) {
		if (matches(rule.action, action, true) && matches(rule.resource, resource, caseInsensitive)) result = rule;
	}
	return result;
}

export interface Decision {
	effect: Effect;
	resource?: string;
	rule?: Rule;
}

/** Any deny denies; otherwise any ask asks; otherwise allow. */
export function decide(rules: Rule[], action: string, resources: string[], caseInsensitive: boolean): Decision {
	let ask: Decision | undefined;
	for (const resource of resources) {
		const rule = evaluate(rules, action, resource, caseInsensitive);
		const effect = rule?.effect ?? "ask";
		if (effect === "deny") return { effect, resource, rule };
		if (effect === "ask" && !ask) ask = { effect, resource, rule };
	}
	return ask ?? { effect: "allow" };
}

// ------------------------------------------------------------------- reads

const IS_WINDOWS = process.platform === "win32";

/** Resources checked for a read: cwd-relative (as OpenCode) and absolute. */
export function readResources(filePath: string, cwd: string): string[] {
	const expanded = filePath.replace(/^@/, "").replace(/^~(?=$|[\\/])/, os.homedir());
	const absolute = path.resolve(cwd, expanded);
	const relative = path.relative(cwd, absolute);
	const resources = [absolute.replace(/\\/g, "/")];
	if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) resources.unshift(relative.replace(/\\/g, "/"));
	return resources;
}

export function decideRead(rules: Rule[], filePath: string, cwd: string): Decision {
	return decide(rules, "read", readResources(filePath, cwd), IS_WINDOWS);
}

// ------------------------------------------------------------------- shell

export type Dialect = "bash" | "powershell" | "cmd";

const SEPARATORS = new Set([";", "&", "|", "\n", "\r", "(", ")", "{", "}"]);
const MAX_DEPTH = 6;

/**
 * Split a command line into simple commands (arrays of unquoted words).
 * Control operators, pipelines, subshells, blocks and command substitutions
 * all become boundaries, so every simple command is checked on its own.
 */
export function splitCommands(input: string, dialect: Dialect, depth = 0): string[][] {
	const commands: string[][] = [];
	let words: string[] = [];
	let word = "";
	let inWord = false;
	const escape = dialect === "bash" ? "\\" : dialect === "powershell" ? "`" : "^";

	const endWord = () => {
		if (inWord) words.push(word);
		word = "";
		inWord = false;
	};
	const endCommand = () => {
		endWord();
		if (words.length) commands.push(words);
		words = [];
	};
	const nested = (text: string) => {
		if (depth < MAX_DEPTH) commands.push(...splitCommands(text, dialect, depth + 1));
	};

	for (let i = 0; i < input.length; i++) {
		const ch = input[i];
		if (ch === escape && dialect !== "cmd" && i + 1 < input.length && input[i + 1] !== "\n") {
			word += input[++i];
			inWord = true;
			continue;
		}
		if (ch === "^" && dialect === "cmd") {
			if (i + 1 < input.length) word += input[++i];
			inWord = true;
			continue;
		}
		if (ch === "'" && dialect !== "cmd") {
			const end = input.indexOf("'", i + 1);
			const stop = end === -1 ? input.length : end;
			word += input.slice(i + 1, stop);
			inWord = true;
			i = stop;
			continue;
		}
		if (ch === '"') {
			inWord = true;
			let j = i + 1;
			for (; j < input.length && input[j] !== '"'; j++) {
				if (dialect !== "cmd" && input[j] === escape && j + 1 < input.length) {
					word += input[++j];
					continue;
				}
				if (dialect !== "cmd" && input[j] === "$" && input[j + 1] === "(") {
					const close = matchingParen(input, j + 1);
					nested(input.slice(j + 2, close));
					word += input.slice(j, close + 1);
					j = close;
					continue;
				}
				if (dialect === "bash" && input[j] === "`") {
					const close = input.indexOf("`", j + 1);
					const stop = close === -1 ? input.length : close;
					nested(input.slice(j + 1, stop));
					j = stop;
					continue;
				}
				word += input[j];
			}
			i = j;
			continue;
		}
		if (dialect === "bash" && ch === "`") {
			endCommand();
			continue;
		}
		if (ch === "$" && input[i + 1] === "(") {
			endCommand();
			i++;
			continue;
		}
		if (SEPARATORS.has(ch)) {
			endCommand();
			continue;
		}
		if (/\s/.test(ch)) {
			endWord();
			continue;
		}
		word += ch;
		inWord = true;
	}
	endCommand();
	return commands;
}

function matchingParen(input: string, open: number): number {
	let level = 0;
	for (let i = open; i < input.length; i++) {
		if (input[i] === "(") level++;
		else if (input[i] === ")" && --level === 0) return i;
	}
	return input.length;
}

function executableName(word: string): string {
	return path.win32.basename(path.posix.basename(word)).toLowerCase().replace(/\.(exe|cmd|bat|com|ps1)$/, "");
}

// Git options that come before the subcommand and take a separate value.
const GIT_OPTIONS_WITH_VALUE = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path", "--super-prefix", "--config-env", "--list-cmds", "--attr-source"]);

const SHELL_KEYWORDS = new Set(["if", "then", "else", "elif", "do", "while", "until", "time"]);

const PREFIX_COMMANDS = new Set(["command", "exec", "builtin", "nohup", "time", "sudo", "doas", "nice", "xargs", "env", "call", "start"]);

/**
 * Expand one simple command into the normalized command strings to check,
 * recursing into nested shells and evaluated strings.
 */
export function normalizeCommand(words: string[], dialect: Dialect, depth = 0): string[] {
	let rest = [...words];
	// Drop variable assignments: `FOO=1 git ...` (bash), `$x = git ...` and
	// `$x=git ...` (PowerShell runs the right-hand side as a command).
	for (;;) {
		if (rest.length >= 2 && rest[1] === "=" && /^\$?[\w:]+$/.test(rest[0])) {
			rest = rest.slice(2);
			continue;
		}
		const assignment = rest.length ? /^(\$?[A-Za-z_][\w:]*)\+?=([\s\S]*)$/.exec(rest[0]) : null;
		if (!assignment) break;
		rest = dialect === "powershell" && assignment[2] ? [assignment[2], ...rest.slice(1)] : rest.slice(1);
	}
	// Shell keywords, call operators and wrapper commands.
	while (rest.length) {
		const head = rest[0];
		const name = executableName(head);
		if (head === "&" || head === "." || head === "!" || SHELL_KEYWORDS.has(head)) rest = rest.slice(1);
		else if (PREFIX_COMMANDS.has(name)) {
			rest = rest.slice(1);
			while (rest.length && (rest[0].startsWith("-") || /^[A-Za-z_]\w*=/.test(rest[0]))) rest = rest.slice(1);
		} else break;
	}
	if (!rest.length) return [];

	const exe = executableName(rest[0]);
	const args = rest.slice(1);
	const nested = (text: string | undefined, inner: Dialect) =>
		text === undefined || depth >= MAX_DEPTH ? [] : expandShell(text, inner, depth + 1);

	if (["bash", "sh", "zsh", "dash", "ksh", "fish"].includes(exe)) {
		const flag = args.findIndex((arg) => /^-[a-z]*c[a-z]*$/.test(arg));
		return flag === -1 ? [[exe, ...args].join(" ")] : [[exe, ...args].join(" "), ...nested(args[flag + 1], "bash")];
	}
	if (exe === "pwsh" || exe === "powershell") {
		return [[exe, ...args].join(" "), ...expandPowerShellArgs(args, depth)];
	}
	if (exe === "cmd") {
		const flag = args.findIndex((arg) => /^\/[ck]$/i.test(arg));
		return flag === -1 ? [[exe, ...args].join(" ")] : [[exe, ...args].join(" "), ...nested(args.slice(flag + 1).join(" "), "cmd")];
	}
	if (exe === "wsl") {
		let i = 0;
		while (i < args.length && args[i].startsWith("-")) i += ["-d", "--distribution", "-u", "--user", "--cd"].includes(args[i]) ? 2 : 1;
		return [[exe, ...args].join(" "), ...nested(args.slice(i).join(" "), "bash")];
	}
	if (exe === "eval") return nested(args.join(" "), "bash");
	if (exe === "invoke-expression" || exe === "iex") {
		const flag = args.findIndex((arg) => /^-c(ommand)?$/i.test(arg));
		return nested(flag === -1 ? args.join(" ") : args[flag + 1], "powershell");
	}
	if (exe === "git") return [["git", ...stripGitOptions(args)].join(" ")];
	return [[exe, ...args].join(" ")];
}

function stripGitOptions(args: string[]): string[] {
	let i = 0;
	while (i < args.length && args[i].startsWith("-")) {
		const arg = args[i];
		i += GIT_OPTIONS_WITH_VALUE.has(arg) ? 2 : 1;
	}
	return args.slice(i);
}

function expandPowerShellArgs(args: string[], depth: number): string[] {
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (/^[-/]e(c|nc|ncodedcommand|ncodedc\w*)?$/i.test(arg) && args[i + 1]) {
			const decoded = Buffer.from(args[i + 1], "base64").toString("utf16le");
			return expandShell(decoded, "powershell", depth + 1);
		}
		if (/^[-/]c(o(m(m(a(n(d)?)?)?)?)?)?$/i.test(arg)) return expandShell(args.slice(i + 1).join(" "), "powershell", depth + 1);
		if (/^[-/](f|file)$/i.test(arg)) return [];
		if (/^[-/](executionpolicy|ep|ex|workingdirectory|wd|windowstyle|w|configurationname|outputformat|o|inputformat|if|settingsfile)$/i.test(arg)) {
			i++;
			continue;
		}
		if (arg.startsWith("-") || arg.startsWith("/")) continue;
		// Positional text is treated as a command (Windows PowerShell behavior).
		return expandShell(args.slice(i).join(" "), "powershell", depth + 1);
	}
	return [];
}

/** All normalized simple commands contained in a command line. */
export function expandShell(command: string, dialect: Dialect, depth = 0): string[] {
	return splitCommands(command, dialect, depth).flatMap((words) => normalizeCommand(words, dialect, depth));
}

export function decideShell(rules: Rule[], command: string, dialect: Dialect): Decision {
	const resources = expandShell(command, dialect);
	return decide(rules, "shell", resources.length ? resources : [command.trim()], false);
}

// --------------------------------------------------------------- subagents

/**
 * Agents a session may launch, or `undefined` when OpenCode allows any agent.
 * Agents run by OpenCode commands (`/init`) stay launchable because Pi runs
 * those commands through the subagent tool.
 */
export function allowedSubagents(policy: OpenCodePolicy, agent: string): string[] | undefined {
	const rules = rulesFor(policy, agent);
	if (evaluate(rules, "subagent", "\u0000unlisted-agent", false)?.effect !== "deny") return undefined;
	const names = new Set([...Object.keys(policy.agents), ...policy.commandAgents]);
	const allowed = [...names].filter((name) => evaluate(rules, "subagent", name, false)?.effect === "allow");
	return [...new Set([...allowed, ...policy.commandAgents])];
}
