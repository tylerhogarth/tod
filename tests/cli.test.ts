import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLI = join(import.meta.dir, "..", "src", "cli.ts");

function runCli(...args: string[]): { code: number; stdout: string; stderr: string } {
  const result = Bun.spawnSync(["bun", CLI, ...args]);
  return {
    code: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

function runSandboxed(
  home: string,
  ...args: string[]
): { code: number; stdout: string; stderr: string } {
  const result = Bun.spawnSync(["bun", CLI, ...args], {
    env: { ...process.env, TOD_HOME: home },
  });
  return {
    code: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

describe("tod --help", () => {
  test("exits 0 and lists every command with when-to-use guidance", () => {
    const { code, stdout } = runCli("--help");
    expect(code).toBe(0);
    for (const command of ["init", "sync", "status", "work", "log", "config"]) {
      expect(stdout).toContain(command);
    }
    expect(stdout).toContain("Use when");
    expect(stdout).toContain("coding agents");
  });

  test("no arguments behaves like --help", () => {
    const { code, stdout } = runCli();
    expect(code).toBe(0);
    expect(stdout).toContain("usage: tod");
  });
});

describe("tod --version", () => {
  test("prints a semver and exits 0", () => {
    const { code, stdout } = runCli("--version");
    expect(code).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("unknown command", () => {
  test("exits 2 with an error that names the fix", () => {
    const { code, stderr } = runCli("deploy");
    expect(code).toBe(2);
    expect(stderr).toContain("error:");
    expect(stderr).toContain("fix:");
    expect(stderr).toContain("tod --help");
  });
});

describe("command help", () => {
  test.each(["init", "sync", "status", "work", "log", "config"])(
    "tod %s --help exits 0",
    (command) => {
      const { code, stdout } = runCli(command, "--help");
      expect(code).toBe(0);
      expect(stdout).toContain(`tod ${command}`);
      expect(stdout).toContain("Use");
    },
  );
});

describe("writing style", () => {
  test("help output contains no em or en dashes", () => {
    const outputs = [
      runCli("--help").stdout,
      ...["init", "sync", "status", "work", "log", "config"].map(
        (command) => runCli(command, "--help").stdout,
      ),
    ];
    for (const output of outputs) {
      expect(output).not.toContain("—");
      expect(output).not.toContain("–");
    }
  });
});

describe("TOD_HOME override", () => {
  test("init recreates the home structure under the override, not the real home", () => {
    const sandbox = mkdtempSync(join(tmpdir(), "tod-sandbox-"));
    const { code } = runSandboxed(sandbox, "init");
    expect(code).toBe(0);
    expect(existsSync(join(sandbox, ".tod", "config.json"))).toBe(true);
    expect(existsSync(join(sandbox, ".tod", "work.json"))).toBe(true);
  });

  test("work written under the override is read back by status", () => {
    const sandbox = mkdtempSync(join(tmpdir(), "tod-sandbox-"));
    expect(runSandboxed(sandbox, "init").code).toBe(0);
    const added = runSandboxed(sandbox, "work", "add", "Ship it", "--project", "demo");
    expect(added.code).toBe(0);
    const { code, stdout } = runSandboxed(sandbox, "status");
    expect(code).toBe(0);
    expect(stdout).toContain("Ship it");
  });
});
