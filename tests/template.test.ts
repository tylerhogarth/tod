import { describe, expect, test } from "bun:test";
import { type Config, configSchema, defaultConfig } from "../src/config.ts";
import { renderBlock } from "../src/template.ts";

const SIZE_BUDGET_BYTES = 8 * 1024;

function allConfigs(): Config[] {
  const shape = configSchema.shape.communication.shape;
  const configs: Config[] = [];
  for (const technicality of shape.technicality.options) {
    for (const detail of shape.detail.options) {
      for (const focus of shape.focus.options) {
        for (const tone of shape.tone.options) {
          configs.push({ version: 1, communication: { technicality, detail, focus, tone } });
        }
      }
    }
  }
  return configs;
}

describe("renderBlock content", () => {
  const block = renderBlock(defaultConfig);

  test("carries every required harness section", () => {
    for (const heading of [
      "# tod: operator harness",
      "## Operator memory",
      "## Communication",
      "### Writing style",
      "## Your role: the operator's team",
      "## Work tracking",
      "## Git safety",
      "## tod-managed files",
    ]) {
      expect(block).toContain(heading);
    }
  });

  test("directs the agent through onboarding", () => {
    expect(block).toContain("onboarding");
    expect(block).toContain("~/.tod/operator.md");
    expect(block).toContain("capability gaps");
    expect(block).toContain("tod config set");
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

  test("composes the virtual team from capability gaps", () => {
    for (const role of [
      "product manager",
      "engineering manager",
      "software engineer",
      "architect",
    ]) {
      expect(block).toContain(role);
    }
    expect(block).toContain("one voice");
  });

  test("sets the operator-facing writing rules", () => {
    expect(block).toContain("Never use em dashes");
    expect(block).toContain("Lead with the answer");
    expect(block).toContain("One idea per sentence");
    expect(block).toContain("international English");
  });

  test("keeps tod's implementation stack out of operator instructions", () => {
    for (const leak of ["Bun", "TypeScript", "Biome", "zod", "better-result"]) {
      expect(block).not.toContain(leak);
    }
  });
});

describe("renderBlock configuration", () => {
  test("communication dimensions change the rendered rules", () => {
    const nonTechnical = renderBlock(defaultConfig);
    const technical = renderBlock({
      version: 1,
      communication: {
        technicality: "technical",
        detail: "concise",
        focus: "implementation",
        tone: "terse",
      },
    });
    expect(technical).not.toBe(nonTechnical);
    expect(technical).toContain("engineer-to-engineer");
    expect(nonTechnical).toContain("non-technical");
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
