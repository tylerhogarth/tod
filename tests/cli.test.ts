import { describe, expect, test } from "bun:test";
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

describe("tod --help", () => {
  test("exits 0 and lists every command with when-to-use guidance", () => {
    const { code, stdout } = runCli("--help");
    expect(code).toBe(0);
    for (const command of ["init", "sync", "status"]) {
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
  test.each(["init", "sync", "status"])("tod %s --help exits 0", (command) => {
    const { code, stdout } = runCli(command, "--help");
    expect(code).toBe(0);
    expect(stdout).toContain(`tod ${command}`);
    expect(stdout).toContain("Use");
  });
});

describe("unimplemented commands", () => {
  test("tod status fails with guidance", () => {
    const { code, stderr } = runCli("status");
    expect(code).toBe(1);
    expect(stderr).toContain("not implemented");
    expect(stderr).toContain("fix:");
  });
});
