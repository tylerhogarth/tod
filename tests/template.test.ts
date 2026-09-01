import { describe, expect, test } from "bun:test";
import { type Config, defaultConfig, type Scale } from "../src/config.ts";
import { renderBlock } from "../src/template.ts";

const SIZE_BUDGET_BYTES = 4 * 1024;
const SCALE: readonly Scale[] = [1, 2, 3, 4, 5];

function allConfigs(): Config[] {
  const configs: Config[] = [];
  for (const requirementGathering of SCALE) {
    for (const responseDetail of SCALE) {
      configs.push({ version: 2, requirementGathering, responseDetail });
    }
  }
  return configs;
}

describe("renderBlock content", () => {
  const block = renderBlock(defaultConfig);

  test("carries every required section", () => {
    for (const heading of [
      "# tod: operator harness",
      "## Tod persona",
      "## Session start",
      "## Precedence",
      "## The operator is non-technical",
      "## Requirement gathering",
      "## Response detail",
      "## Reconfiguration",
      "## Writing style",
      "## Work tracking",
      "## Git safety",
      "## tod-managed files",
    ]) {
      expect(block).toContain(heading);
    }
  });

  test("explains what tod is and maps requests to tod commands and skills", () => {
    expect(block).toContain("operator harness layered on top of you");
    expect(block).toContain("operating layer, not documentation");
    expect(block).toContain("tod CLI command or tod skill");
  });

  test("defines the Tod persona", () => {
    expect(block).toContain("lively product engineer");
    expect(block).toContain("concise and friendly");
    expect(block).toContain("interact as Tod");
  });

  test("offers tod per session instead of assuming it is active", () => {
    expect(block).toContain("Are we building with Tod today?");
    expect(block).toContain("operate normally");
  });

  test("defers to higher-priority instructions", () => {
    expect(block).toContain("take precedence over this block");
  });

  test("assumes a non-technical operator at every setting", () => {
    expect(block).toContain("non-technical at every setting");
    expect(block).toContain("non-technical client");
    expect(block).toContain("without jargon");
  });

  test("makes reconfiguration discoverable and never silent", () => {
    expect(block).toContain("tod can be reconfigured");
    expect(block).toContain("`tod init` again");
    expect(block).toContain("Never change `~/.tod/config.json` from inferred behaviour");
  });

  test("directs the agent to the deterministic CLI, never hand-edits", () => {
    for (const command of ["tod status", "tod work", "tod log", "tod config", "tod sync"]) {
      expect(block).toContain(command);
    }
    expect(block).toContain("Never hand-edit");
  });

  test("enforces the git workflow in builder terms", () => {
    expect(block).toContain("own branch");
    expect(block).toContain("Never develop directly on main");
    expect(block).toContain("separate versions");
  });

  test("sets the operator-facing writing rules", () => {
    expect(block).toContain("Never use em dashes");
    expect(block).toContain("Lead with the answer");
    expect(block).toContain("one idea per sentence");
    expect(block).toContain("international English");
  });

  test("keeps tod's implementation stack out of operator instructions", () => {
    for (const leak of ["Bun", "TypeScript", "Biome", "zod", "better-result"]) {
      expect(block).not.toContain(leak);
    }
  });
});

describe("renderBlock configuration", () => {
  test("requirement gathering scales from eager to pushy", () => {
    const eager = renderBlock({ ...defaultConfig, requirementGathering: 1 });
    const pushy = renderBlock({ ...defaultConfig, requirementGathering: 5 });
    expect(eager).toContain("Requirement gathering (set to 1 of 5)");
    expect(eager).toContain("make reasonable assumptions, and start building");
    expect(pushy).toContain("Requirement gathering (set to 5 of 5)");
    expect(pushy).toContain("before any implementation");
  });

  test("response detail scales from concise to detailed", () => {
    const concise = renderBlock({ ...defaultConfig, responseDetail: 1 });
    const detailed = renderBlock({ ...defaultConfig, responseDetail: 5 });
    expect(concise).toContain("Response detail (set to 1 of 5)");
    expect(concise).toContain("Skip mechanism and background");
    expect(detailed).toContain("Response detail (set to 5 of 5)");
    expect(detailed).toContain("why each decision was made");
  });

  test("rendering is deterministic and every configuration is distinct", () => {
    const configs = allConfigs();
    const blocks = configs.map(renderBlock);
    expect(new Set(blocks).size).toBe(configs.length);
    for (const [index, config] of configs.entries()) {
      expect(renderBlock(config)).toBe(blocks[index] as string);
    }
  });

  test("every configuration stays inside the size budget", () => {
    for (const config of allConfigs()) {
      expect(Buffer.byteLength(renderBlock(config), "utf8")).toBeLessThan(SIZE_BUDGET_BYTES);
    }
  });

  test("no configuration renders an em or en dash", () => {
    for (const config of allConfigs()) {
      const block = renderBlock(config);
      expect(block).not.toContain("—");
      expect(block).not.toContain("–");
    }
  });
});
