// Run: node --test policy.test.ts
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { allowedSubagents, decideRead, decideShell, loadOpenCodePolicy, rulesFor } from "./policy.ts";

const policy = loadOpenCodePolicy();
const rules = rulesFor(policy, "orchestrator");
const shell = (command: string, dialect: "bash" | "powershell" = "bash") => decideShell(rules, command, dialect).effect;

test("policy comes from the shared OpenCode system config", () => {
	assert.equal(policy.source, path.join(process.env.ProgramData ?? "C:\\ProgramData", "opencode", "opencode.json"));
	assert.equal(policy.defaultAgent, "orchestrator");
	assert.deepEqual(policy.commandAgents, ["init"]);
});

test("allowed commands stay allowed", () => {
	for (const command of [
		"git status",
		"git status --short",
		"git log --oneline -5",
		"git restore --staged src/a.ts",
		"git checkout main",
		"git checkout -b feat",
		"git switch -c feat",
		"git push origin main",
		"git push -u origin feat",
		"git stash",
		"git stash pop",
		"git branch -d old",
		"git commit -m 'feat: x'",
		"npm test",
		"echo 'git clean -fd'",
		"rg 'git reset --hard' docs",
	]) assert.equal(shell(command), "allow", command);
});

test("OpenCode deny rules stay denied", () => {
	for (const command of [
		"git reset --hard",
		"git reset HEAD~1 --hard",
		"git clean -n",
		"git clean -fdx",
		"git push --force",
		"git push origin main --force-with-lease",
		"git push -f origin main",
		"git push origin -f",
		"git push origin +main",
		"git push --mirror",
		"git push origin --delete feat",
		"git push -d origin feat",
		"git push origin :feat",
		"git checkout -- file.txt",
		"git checkout .",
		"git checkout main .",
		"git checkout --force main",
		"git checkout -f main",
		"git checkout -B feat",
		"git switch --discard-changes main",
		"git switch -f main",
		"git restore file.txt",
		"git restore --worktree --staged file.txt",
		"git restore --staged -W file.txt",
		"git restore --staged --source=HEAD~1 file.txt",
		"git branch -f main HEAD~1",
		"git branch --force main",
		"git stash drop",
		"git stash clear",
		"git filter-branch --all",
		"git filter-repo --path x",
		"GIT clean -n",
	]) assert.equal(shell(command), "deny", command);
});

test("compound commands check every subcommand", () => {
	for (const command of [
		"echo hi; git clean -n",
		"echo hi && git reset --hard",
		"false || git stash drop",
		"echo a | git stash drop",
		"(cd sub && git clean -fd)",
		"echo $(git clean -n)",
		'echo "$(git clean -n)"',
		"echo `git clean -n`",
		"if true; then git reset --hard; fi",
		"FOO=1 git clean -n",
	]) assert.equal(shell(command), "deny", command);
	for (const command of ["if ($true) { git reset --hard }", "$x = git clean -n", "$x=git clean -n", "& git clean -n", "Write-Output a | git stash drop"]) {
		assert.equal(shell(command, "powershell"), "deny", command);
	}
});

test("wrapped forms are unwrapped (intentional hardening over OpenCode)", () => {
	const encoded = Buffer.from("git clean -n", "utf16le").toString("base64");
	for (const command of [
		'powershell -NoProfile -Command "git clean -n"',
		"pwsh -c 'git reset --hard'",
		`powershell -EncodedCommand ${encoded}`,
		'cmd /c "git clean -n"',
		'cmd.exe /C "echo a & git clean -n"',
		'bash -c "git clean -n"',
		"sh -lc 'git push --force'",
		'Invoke-Expression "git clean -n"',
		'iex "git clean -n"',
		'eval "git clean -n"',
		"git -C . clean -n",
		"git -c core.x=y clean -n",
		"git --no-pager --git-dir=.git reset --hard",
		"git.exe clean -n",
		'"C:/Program Files/Git/cmd/git.exe" clean -n',
		"/usr/bin/git clean -n",
		"env GIT_DIR=.git git clean -n",
		"wsl git clean -n",
	]) assert.equal(shell(command), "deny", command);
});

test("read rules", () => {
	const cwd = path.join(os.tmpdir(), "permtest");
	for (const file of [".env", ".env.example", "sub/.env.local", "app.env", "secrets/s.txt", "sub/a.key", "root.key", "cert.pem", "credentials.json", path.join(os.homedir(), ".ssh", "id_ed25519"), "~/.aws/credentials", "~/.config/gh/hosts.yml"]) {
		assert.equal(decideRead(rules, file, cwd).effect, "deny", file);
	}
	for (const file of ["ok.txt", "src/env.ts", "README.md", path.join(os.homedir(), ".config", "opencode", "opencode.json")]) {
		assert.equal(decideRead(rules, file, cwd).effect, "allow", file);
	}
});

test("subagent allowlists follow agent rules", () => {
	const orchestrator = allowedSubagents(policy, "orchestrator");
	assert.deepEqual([...(orchestrator ?? [])].sort(), ["archiver", "designer", "explorer", "fix-agent", "implementer", "init", "reviewer", "specs-writer"]);
	assert.deepEqual(allowedSubagents(policy, "teacher"), ["init"]);
	assert.deepEqual(allowedSubagents(policy, "explorer"), ["init"]);
});
