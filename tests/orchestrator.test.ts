import { beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLI = join(import.meta.dir, "..", "src", "cli.ts");

function makeHome(): string {
  const home = mkdtempSync(join(tmpdir(), "tod-orch-"));
  mkdirSync(join(home, ".agents"), { recursive: true });
  mkdirSync(join(home, ".claude"), { recursive: true });
  return home;
}

function runCli(home: string, ...args: string[]): { code: number; stdout: string; stderr: string } {
  const result = Bun.spawnSync(["bun", CLI, ...args], { env: { ...process.env, HOME: home } });
  return {
    code: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

describe("tod work", () => {
  const home = makeHome();

  beforeAll(() => {
    expect(runCli(home, "init").code).toBe(0);
  });

  test("add records features, child tasks, and multiple projects", () => {
    const feature = runCli(
      home,
      "work",
      "add",
      "Onboarding flow",
      "--project",
      "my-app",
      "--kind",
      "feature",
    );
    expect(feature.code).toBe(0);
    expect(feature.stdout).toContain("added #1 feature 'Onboarding flow' to project 'my-app'");

    const task = runCli(
      home,
      "work",
      "add",
      "Email validation",
      "--project",
      "my-app",
      "--parent",
      "1",
    );
    expect(task.code).toBe(0);
    expect(task.stdout).toContain("#2");

    expect(
      runCli(home, "work", "add", "Fix crash", "--project", "recipes", "--kind", "bug").code,
    ).toBe(0);
  });

  test("list shows every item with ids", () => {
    const { code, stdout } = runCli(home, "work", "list");
    expect(code).toBe(0);
    expect(stdout).toContain("project my-app");
    expect(stdout).toContain("#1 feature open Onboarding flow");
    expect(stdout).toContain("parent=#1");
    expect(stdout).toContain("project recipes");
  });

  test("status reports in-flight work and hides done items by default", () => {
    const before = runCli(home, "status");
    expect(before.code).toBe(0);
    expect(before.stdout).toContain("2 projects, 3 items in flight");
    expect(before.stdout).toContain("Onboarding flow");

    expect(runCli(home, "work", "done", "3").code).toBe(0);

    const after = runCli(home, "status");
    expect(after.stdout).toContain("2 items in flight");
    expect(after.stdout).not.toContain("Fix crash");

    const all = runCli(home, "status", "--all");
    expect(all.stdout).toContain("2 items in flight, 1 done");
    expect(all.stdout).toContain("Fix crash");
  });

  test("status subcommand moves items and accepts ids with the '#' prefix", () => {
    const moved = runCli(home, "work", "status", "#1", "in-progress");
    expect(moved.code).toBe(0);
    expect(moved.stdout).toContain("#1 'Onboarding flow' is now in-progress");
    expect(runCli(home, "work", "list").stdout).toContain("#1 feature in-progress");
  });

  test("non-numeric ids fail with the id format, not a bare usage string", () => {
    for (const args of [
      ["work", "status", "w1", "in-progress"],
      ["work", "done", "w2"],
    ]) {
      const { code, stderr } = runCli(home, ...args);
      expect(code).toBe(2);
      expect(stderr).toContain("item ids are numbers, with or without the '#'");
      expect(stderr).toContain(`'${args[2]}'`);
    }
  });

  test("done is idempotent and reports unchanged", () => {
    const again = runCli(home, "work", "done", "3");
    expect(again.code).toBe(0);
    expect(again.stdout).toContain("already done (unchanged)");
  });

  test("unknown ids fail with guidance", () => {
    const { code, stderr } = runCli(home, "work", "done", "99");
    expect(code).toBe(1);
    expect(stderr).toContain("unknown work item #99");
    expect(stderr).toContain("tod work list");
  });

  test("malformed work state stops every command without changes", () => {
    const workFile = join(home, ".tod", "work.json");
    const healthy = readFileSync(workFile, "utf8");
    writeFileSync(workFile, "{broken");

    for (const args of [
      ["work", "add", "X", "--project", "p"],
      ["work", "done", "1"],
      ["status"],
    ]) {
      const { code, stderr } = runCli(home, ...args);
      expect(code).toBe(1);
      expect(stderr).toContain("work state is unreadable");
      expect(stderr).toContain("fix:");
    }
    expect(readFileSync(workFile, "utf8")).toBe("{broken");
    writeFileSync(workFile, healthy);
  });
});

describe("tod log", () => {
  const home = makeHome();

  beforeAll(() => {
    expect(runCli(home, "init").code).toBe(0);
  });

  test("appends JSON lines and never rewrites earlier entries", () => {
    expect(runCli(home, "log", "onboarding complete").code).toBe(0);
    expect(runCli(home, "log", "shipped login", "--project", "my-app").code).toBe(0);

    const lines = readFileSync(join(home, ".tod", "log.jsonl"), "utf8")
      .trim()
      .split("\n");
    expect(lines).toHaveLength(2);
    const first = JSON.parse(lines[0] ?? "");
    const second = JSON.parse(lines[1] ?? "");
    expect(first.message).toBe("onboarding complete");
    expect(first.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(second.project).toBe("my-app");
  });

  test("requires a message", () => {
    const { code, stderr } = runCli(home, "log");
    expect(code).toBe(2);
    expect(stderr).toContain("fix:");
  });
});

describe("tod config", () => {
  const home = makeHome();

  beforeAll(() => {
    expect(runCli(home, "init").code).toBe(0);
  });

  test("get prints settings and set changes them", () => {
    expect(JSON.parse(runCli(home, "config", "get").stdout).requirementGathering).toBe(3);

    const set = runCli(home, "config", "set", "requirement-gathering", "5");
    expect(set.code).toBe(0);
    expect(set.stdout).toContain("tod sync");
    expect(JSON.parse(runCli(home, "config", "get").stdout).requirementGathering).toBe(5);
  });

  test("sync renders changed settings into instruction blocks", () => {
    expect(runCli(home, "sync").code).toBe(0);
    const agents = readFileSync(join(home, ".agents", "AGENTS.md"), "utf8");
    expect(agents).toContain("Requirement gathering (set to 5 of 5)");
    expect(agents).toContain("before any implementation");
  });

  test("setting the same value again reports unchanged", () => {
    const again = runCli(home, "config", "set", "requirement-gathering", "5");
    expect(again.code).toBe(0);
    expect(again.stdout).toContain("unchanged");
  });

  test("rejects values off the 1-5 scale", () => {
    const { code, stderr } = runCli(home, "config", "set", "response-detail", "7");
    expect(code).toBe(2);
    expect(stderr).toContain("allowed values");
    expect(stderr).toContain("1 to 5");
  });

  test("rejects unknown keys and names the settable ones", () => {
    const { code, stderr } = runCli(home, "config", "set", "communication.tone", "terse");
    expect(code).toBe(2);
    expect(stderr).toContain("requirement-gathering");
    expect(stderr).toContain("response-detail");
  });
});
