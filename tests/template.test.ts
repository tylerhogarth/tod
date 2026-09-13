import { describe, expect, test } from "bun:test";
import { type Config, defaultConfig, type Scale } from "../src/config.ts";
import { renderBlock } from "../src/template.ts";

const SIZE_BUDGET_BYTES = 6 * 1024;
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
      "## Tod",
      "## Session start",
      "## Precedence",
      "## The operator is non-technical",
      "## Requirement gathering",
      "## Response detail",
      "## Reconfiguration",
      "## Decide by risk",
      "## Slice the work",
      "## Show your work",
      "## Writing style",
      "## Work tracking",
      "## Git safety",
      "## tod-managed files",
    ]) {
      expect(block).toContain(heading);
    }
  });

  test("explains what tod is and maps requests to tod commands and skills", () => {
    expect(block).toContain("operating model layered over you");
    expect(block).toContain("instructions, not documentation");
    expect(block).toContain("tod command or skill");
  });

  test("defines Tod as the whole team holding product, engineering, and delivery", () => {
    expect(block).toContain("whole team in one: product, engineering, and delivery");
    expect(block).toContain("concise, friendly, direct");
    expect(block).toContain("Every choice is a trade-off");
    expect(block).toContain("Time is not a dimension; scope is");
    expect(block).toContain(
      "Product decides what, engineering decides how, delivery decides how much now",
    );
  });

  test("activates seamlessly on product work and shows a hint, never asking to opt in", () => {
    expect(block).toContain("Never ask whether the operator wants tod");
    expect(block).toContain("respond as Tod from that message on");
    expect(block).toContain("work normally");
    expect(block).toContain("run `tod hint`");
    expect(block).toContain("verbatim");
  });

  test("defers to higher-priority instructions", () => {
    expect(block).toContain("take precedence over this block");
  });

  test("assumes a non-technical operator at every setting", () => {
    expect(block).toContain("Assume this at every setting");
    expect(block).toContain("consequences, trade-offs, and product impact");
    expect(block).toContain("No jargon");
    expect(block).toContain("define it in one plain sentence");
    expect(block).toContain("file paths, tool names, and internals");
  });

  test("pairs every question with a recommendation", () => {
    expect(block).toContain("Pair each question with a recommendation");
  });

  test("decides by reversibility and waits on risky work", () => {
    expect(block).toContain("then show the result");
    expect(block).toContain("money, accounts, or privacy");
    expect(block).toContain("wait for a yes");
    expect(block).toContain("treat it as risky");
  });

  test("slices work, ends each slice in something checkable, and holds scope", () => {
    expect(block).toContain("One finishable slice at a time");
    expect(block).toContain("ordered list of slices");
    expect(block).toContain("something the operator can see and check");
    expect(block).toContain("Scope creep is the failure mode");
  });

  test("requires operator-checkable evidence before calling work done", () => {
    expect(block).toContain("evidence the operator can check without reading code");
    expect(block).toContain("show before and after");
    expect(block).toContain("show its check passing");
  });

  test("applies direct operator instructions at once and never reconfigures silently", () => {
    expect(block).toContain('"Tod, be less wordy"');
    expect(block).toContain("applied at once with `tod config set` and `tod sync`");
    expect(block).toContain("`tod init` again");
    expect(block).toContain("Never change `~/.tod/config.json` from inferred behaviour");
  });

  test("directs the agent to the deterministic CLI, never hand-edits", () => {
    for (const command of ["`tod work`", "`tod log`", "`tod status`", "`tod sync`", "`tod hint`"]) {
      expect(block).toContain(command);
    }
    expect(block).toContain("Never hand-edit");
    expect(block).toContain("keep it truthful");
  });

  test("does not duplicate the skill's own routing; the installed skill carries it", () => {
    expect(block).not.toContain("Starting something new");
    expect(block).not.toContain("tod skills");
  });

  test("enforces the git workflow in builder terms", () => {
    expect(block).toContain("own branch");
    expect(block).toContain("Never develop directly on main");
    expect(block).toContain("separate versions");
    expect(block).toContain("roll back to the last good commit");
  });

  test("states the writing style it follows itself", () => {
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
