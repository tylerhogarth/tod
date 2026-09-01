import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BLOCK_BEGIN, BLOCK_END } from "../src/markers.ts";

const CLI = join(import.meta.dir, "..", "src", "cli.ts");

function makeHome(options: { agents?: string | null; claude?: string | null } = {}): string {
  const home = mkdtempSync(join(tmpdir(), "tod-home-"));
  if (options.agents !== null) {
    mkdirSync(join(home, ".agents"), { recursive: true });
    if (options.agents) {
      writeFileSync(join(home, ".agents", "AGENTS.md"), options.agents);
    }
  }
  if (options.claude !== null) {
    mkdirSync(join(home, ".claude"), { recursive: true });
    if (options.claude) {
      writeFileSync(join(home, ".claude", "CLAUDE.md"), options.claude);
    }
  }
  return home;
}

function runCli(home: string, ...args: string[]): { code: number; stdout: string; stderr: string } {
  const result = Bun.spawnSync(["bun", CLI, ...args], {
    env: { ...process.env, HOME: home },
  });
  return {
    code: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

function read(home: string, ...parts: string[]): string {
  return readFileSync(join(home, ...parts), "utf8");
}

describe("tod init", () => {
  test("installs state and blocks, preserving pre-existing instruction content", () => {
    const agentsContent = "# My agents rules\n\nAlways be brief.\n";
    const claudeContent = "# My claude rules\n\nUse British English.\n";
    const home = makeHome({ agents: agentsContent, claude: claudeContent });

    const { code, stdout } = runCli(home, "init");
    expect(code).toBe(0);

    for (const file of ["config.json", "operator.md", "work.json", "log.jsonl"]) {
      expect(stdout).toContain(`created   ~/.tod/${file}`);
    }

    const agents = read(home, ".agents", "AGENTS.md");
    const claude = read(home, ".claude", "CLAUDE.md");
    expect(agents.startsWith(agentsContent)).toBe(true);
    expect(claude.startsWith(claudeContent)).toBe(true);
    for (const content of [agents, claude]) {
      expect(content).toContain(BLOCK_BEGIN);
      expect(content).toContain(BLOCK_END);
      expect(content).toContain("operator harness");
    }
  });

  test("creates instruction files when the agent folder exists without one", () => {
    const home = makeHome({ agents: "", claude: "" });
    expect(runCli(home, "init").code).toBe(0);
    expect(read(home, ".agents", "AGENTS.md")).toContain(BLOCK_BEGIN);
    expect(read(home, ".claude", "CLAUDE.md")).toContain(BLOCK_BEGIN);
  });

  test("skips agents whose config folder is absent and reports it", () => {
    const home = makeHome({ agents: null, claude: "" });
    const { code, stdout } = runCli(home, "init");
    expect(code).toBe(0);
    expect(stdout).toContain("skipped");
    expect(read(home, ".claude", "CLAUDE.md")).toContain(BLOCK_BEGIN);
  });

  test("re-running is a no-op", () => {
    const home = makeHome({ agents: "# Mine\n", claude: "# Mine too\n" });
    expect(runCli(home, "init").code).toBe(0);
    const agentsBefore = read(home, ".agents", "AGENTS.md");
    const operatorBefore = read(home, ".tod", "operator.md");

    const second = runCli(home, "init");
    expect(second.code).toBe(0);
    expect(second.stdout).not.toContain("created");
    expect(second.stdout).not.toContain("updated");
    for (const file of ["config.json", "operator.md", "work.json", "log.jsonl"]) {
      expect(second.stdout).toContain(`unchanged ~/.tod/${file}`);
    }
    expect(read(home, ".agents", "AGENTS.md")).toBe(agentsBefore);
    expect(read(home, ".tod", "operator.md")).toBe(operatorBefore);
  });

  test("every run ends with the two-question onboarding wizard", () => {
    const home = makeHome({ agents: "", claude: "" });
    const first = runCli(home, "init");
    const second = runCli(home, "init");
    for (const { stdout } of [first, second]) {
      expect(stdout).toContain("onboarding");
      expect(stdout).toContain("as Tod, verbatim");
      expect(stdout).toContain("single\nmessage with both questions");
      expect(stdout).toContain("Hi, I'm Tod.");
      expect(stdout).toContain("how persistent should I be");
      expect(stdout).toContain("how detailed should I be");
      expect(stdout).toContain("tod config set requirement-gathering");
      expect(stdout).toContain("tod config set response-detail");
      expect(stdout).toContain("tod sync");
      expect(stdout).not.toContain("technical proficiency");
      expect(stdout).not.toContain("—");
    }
  });
});

describe("tod sync", () => {
  test("fails with guidance before init", () => {
    const home = makeHome();
    const { code, stderr } = runCli(home, "sync");
    expect(code).toBe(1);
    expect(stderr).toContain("fix: run 'tod init' first");
  });

  test("restores a hand-edited block and a deleted structural file", () => {
    const home = makeHome({ agents: "# Mine\n", claude: "" });
    expect(runCli(home, "init").code).toBe(0);
    const healthy = read(home, ".agents", "AGENTS.md");

    const vandalised = healthy.replace("operator harness", "pirate ship");
    writeFileSync(join(home, ".agents", "AGENTS.md"), vandalised);
    rmSync(join(home, ".tod", "work.json"));

    const { code } = runCli(home, "sync");
    expect(code).toBe(0);
    expect(read(home, ".agents", "AGENTS.md")).toBe(healthy);
    expect(read(home, ".tod", "work.json")).toContain('"projects"');
  });

  test("never touches operator memory, work state, log, or content outside markers", () => {
    const home = makeHome({ agents: "# Precious operator notes\n", claude: "" });
    expect(runCli(home, "init").code).toBe(0);

    writeFileSync(join(home, ".tod", "operator.md"), "# Customised memory\n");
    writeFileSync(join(home, ".tod", "work.json"), '{"version":1,"nextId":2,"projects":[]}\n');
    writeFileSync(join(home, ".tod", "log.jsonl"), '{"at":"sometime","message":"hello"}\n');

    const { code } = runCli(home, "sync");
    expect(code).toBe(0);
    expect(read(home, ".tod", "operator.md")).toBe("# Customised memory\n");
    expect(read(home, ".tod", "work.json")).toBe('{"version":1,"nextId":2,"projects":[]}\n');
    expect(read(home, ".tod", "log.jsonl")).toBe('{"at":"sometime","message":"hello"}\n');
    expect(read(home, ".agents", "AGENTS.md").startsWith("# Precious operator notes\n")).toBe(true);
  });

  test("stops without changes on malformed markers and names the fix", () => {
    const home = makeHome({ agents: "", claude: "" });
    expect(runCli(home, "init").code).toBe(0);

    const broken = `${BLOCK_BEGIN}\nleft open with no end marker\n`;
    writeFileSync(join(home, ".agents", "AGENTS.md"), broken);
    const claudeBefore = read(home, ".claude", "CLAUDE.md");

    const { code, stderr } = runCli(home, "sync");
    expect(code).toBe(1);
    expect(stderr).toContain("error:");
    expect(stderr).toContain("fix:");
    expect(read(home, ".agents", "AGENTS.md")).toBe(broken);
    expect(read(home, ".claude", "CLAUDE.md")).toBe(claudeBefore);
  });

  test("fails with guidance on invalid config", () => {
    const home = makeHome({ agents: "", claude: "" });
    expect(runCli(home, "init").code).toBe(0);
    writeFileSync(join(home, ".tod", "config.json"), "{not json");

    const { code, stderr } = runCli(home, "sync");
    expect(code).toBe(1);
    expect(stderr).toContain("configuration is invalid");
    expect(stderr).toContain("fix:");
  });
});
