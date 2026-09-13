import { describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { installCommand, repositorySlug, skillTag } from "../src/skills.ts";

const ROOT = join(import.meta.dir, "..");
const CLI = join(ROOT, "src", "cli.ts");
const SKILLS_DIR = join(ROOT, "skills");
const SKILL = join(SKILLS_DIR, "tod-create-project");
const packageJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

function runCli(home: string, ...args: string[]) {
  const result = Bun.spawnSync(["bun", CLI, ...args], {
    env: { ...process.env, TOD_HOME: home },
  });
  return {
    code: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

function skillFiles(): string[] {
  const found: string[] = [];
  const stack = [SKILL];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) {
      break;
    }
    for (const entry of readdirSync(current)) {
      const path = join(current, entry);
      if (statSync(path).isDirectory()) {
        stack.push(path);
      } else {
        found.push(path);
      }
    }
  }
  return found;
}

describe("repositorySlug", () => {
  test("reduces the package repository url to owner/repo", () => {
    expect(repositorySlug("git+https://github.com/tylerhogarth/tod.git")).toBe("tylerhogarth/tod");
    expect(repositorySlug("https://github.com/owner/name")).toBe("owner/name");
    expect(repositorySlug("git@github.com:owner/name.git")).toBe("owner/name");
  });

  test("returns undefined rather than guessing when the url is unrecognisable", () => {
    expect(repositorySlug("not a url")).toBeUndefined();
    expect(repositorySlug("https://example.com/owner/name")).toBeUndefined();
  });
});

describe("skillTag", () => {
  test("maps a version to its release tag", () => {
    expect(skillTag("0.2.0")).toBe("v0.2.0");
    expect(skillTag("1.0.0-rc.1")).toBe("v1.0.0-rc.1");
  });
});

describe("installCommand", () => {
  test("pins the install to the tag rather than a branch", () => {
    const command = installCommand("owner/name", "0.2.0", "tod-create-project");
    expect(command).toBe("npx skills add owner/name#v0.2.0 --skill tod-create-project -g -y");
    expect(command).not.toContain("main");
  });
});

describe("tod skills", () => {
  test("prints an install command pinned to the running version", () => {
    const home = mkdtempSync(join(tmpdir(), "tod-skills-"));
    const { code, stdout } = runCli(home, "skills");
    expect(code).toBe(0);
    expect(stdout).toContain(`#v${packageJson.version}`);
    expect(stdout).toContain("npx skills add");
    expect(stdout).toContain("tod-create-project");
  });

  test("reports the skill as installed once the skills tooling has placed it globally", () => {
    const home = mkdtempSync(join(tmpdir(), "tod-skills-"));
    const installed = join(home, ".agents", "skills", "tod-create-project");
    mkdirSync(installed, { recursive: true });
    writeFileSync(join(installed, "SKILL.md"), "---\nname: tod-create-project\n---\n");
    const { code, stdout } = runCli(home, "skills");
    expect(code).toBe(0);
    expect(stdout).toContain("installed tod-create-project");
    expect(stdout).toContain("nothing to do");
    expect(stdout).not.toContain("npx skills add");
  });

  test("init and sync report a missing skill with its install command, and installed once present", () => {
    const home = mkdtempSync(join(tmpdir(), "tod-skills-"));
    mkdirSync(join(home, ".agents"), { recursive: true });
    const init = runCli(home, "init");
    expect(init.code).toBe(0);
    expect(init.stdout).toContain(
      "missing   skill tod-create-project: install with 'npx skills add",
    );
    expect(init.stdout).toContain("if the report above lists a missing skill");

    const installed = join(home, ".agents", "skills", "tod-create-project");
    mkdirSync(installed, { recursive: true });
    writeFileSync(join(installed, "SKILL.md"), "---\nname: tod-create-project\n---\n");
    const sync = runCli(home, "sync");
    expect(sync.code).toBe(0);
    expect(sync.stdout).toContain("installed skill tod-create-project");
    expect(sync.stdout).not.toContain("missing   skill");
  });

  test("changes nothing on disk", () => {
    const home = mkdtempSync(join(tmpdir(), "tod-skills-"));
    const { code } = runCli(home, "skills");
    expect(code).toBe(0);
    expect(existsSync(join(home, ".tod"))).toBe(false);
    expect(readdirSync(home)).toEqual([]);
  });

  test("rejects flags with a usage error naming the fix", () => {
    const home = mkdtempSync(join(tmpdir(), "tod-skills-"));
    const { code, stderr } = runCli(home, "skills", "--install");
    expect(code).toBe(2);
    expect(stderr).toContain("fix:");
  });

  test("help says when to use it and that it writes nothing", () => {
    const home = mkdtempSync(join(tmpdir(), "tod-skills-"));
    const { code, stdout } = runCli(home, "skills", "--help");
    expect(code).toBe(0);
    expect(stdout).toContain("Use when");
    expect(stdout).toContain("writes nothing");
  });
});

describe("the tod-create-project skill", () => {
  test("is laid out where the skills tooling discovers it", () => {
    expect(existsSync(join(SKILL, "SKILL.md"))).toBe(true);
    expect(relative(ROOT, SKILLS_DIR)).toBe("skills");
  });

  test("frontmatter names the directory and routes on triggers, not capabilities", () => {
    const body = readFileSync(join(SKILL, "SKILL.md"), "utf8");
    expect(body.startsWith("---\n")).toBe(true);
    const frontmatter = body.split("---\n")[1] ?? "";
    expect(frontmatter).toContain("name: tod-create-project");
    const description = /description: (.+)/.exec(frontmatter)?.[1] ?? "";
    expect(description.startsWith("Use when")).toBe(true);
    expect(description.length).toBeLessThanOrEqual(1024);
  });

  test("ships one project instruction template and the references it cites", () => {
    const assets = readdirSync(join(SKILL, "assets"));
    expect(assets).toEqual(["project-agents.template.md"]);
    const body = readFileSync(join(SKILL, "SKILL.md"), "utf8");
    for (const reference of ["references/stack.md", "references/verification.md"]) {
      expect(body).toContain(reference);
      expect(existsSync(join(SKILL, reference))).toBe(true);
    }
  });

  test("the template covers the paved road and marks what must be filled in", () => {
    const template = readFileSync(join(SKILL, "assets", "project-agents.template.md"), "utf8");
    expect(template).toContain("bun run check");
    expect(template).toContain("bun run check:full");
    expect(template).toContain("Operator decisions");
    expect(template).toContain("CLAUDE.md");
    expect(template).toMatch(/\{\{[A-Z_]+\}\}/);
  });

  test("states the compiler and static-analysis invariants", () => {
    const verification = readFileSync(join(SKILL, "references", "verification.md"), "utf8");
    for (const flag of ["strict", "noUncheckedIndexedAccess", "exactOptionalPropertyTypes"]) {
      expect(verification).toContain(flag);
    }
  });

  test("recommends tools without pinning versions or scripting their installs", () => {
    // The agent works out current install steps itself, so a command that
    // names a package here would go stale on the next upstream release.
    for (const file of skillFiles()) {
      // The skill's own metadata version is not a dependency pin.
      const body = readFileSync(file, "utf8").replace(/^---\n[\s\S]*?\n---\n/, "");
      expect(body).not.toMatch(/\b(npm|bun|npx|pnpm|yarn)\s+(i|add|install|create)\s+\S/);
      expect(body).not.toMatch(/\d+\.\d+\.\d+/);
    }
  });

  test("carries no absolute paths and no operator data", () => {
    for (const file of skillFiles()) {
      const contents = readFileSync(file, "utf8");
      expect(contents).not.toContain("/Users/");
      expect(contents).not.toContain("/home/");
      expect(contents).not.toMatch(/\s~\//);
    }
  });
});
