import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultConfig } from "../src/config.ts";
import { formatHint, HINTS } from "../src/hints.ts";
import { renderBlock } from "../src/template.ts";

const CLI = join(import.meta.dir, "..", "src", "cli.ts");

function makeHome(): string {
  return mkdtempSync(join(tmpdir(), "tod-hint-"));
}

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

describe("HINTS", () => {
  test("are short operator-facing sentences without dashes or tool internals", () => {
    expect(HINTS.length).toBeGreaterThan(3);
    for (const hint of HINTS) {
      expect(hint.split(/[.?!]\s/).length).toBeLessThanOrEqual(2);
      expect(hint.length).toBeLessThanOrEqual(120);
      expect(hint).toContain("Tod");
      expect(hint).not.toMatch(/[–—]|--/);
      expect(hint).not.toContain("~/");
      expect(hint).not.toContain("tod ");
    }
  });

  test("every quoted instruction is one the block tells the agent to honour", () => {
    // The hint promises the operator a phrase works. The block must name it,
    // or the promise is empty.
    const block = renderBlock(defaultConfig);
    const promised = HINTS.flatMap((hint) =>
      [...hint.matchAll(/"(Tod, [^"]+)"/g)].map((m) => m[1]),
    );
    expect(promised.length).toBeGreaterThan(0);
    for (const phrase of promised) {
      const stem = (phrase ?? "").replace(/[.?]$/, "");
      const honoured =
        block.includes(stem) ||
        (stem === "Tod, what am I working on" && block.includes("what am I working on")) ||
        (stem === "Tod, show me" && block.includes("Show your work")) ||
        (stem === "Tod, go back to the last version that worked" &&
          block.includes("roll back to the last good commit"));
      expect(honoured, `block does not honour "${phrase}"`).toBe(true);
    }
  });
});

describe("formatHint", () => {
  test("renders the italic hint line", () => {
    expect(formatHint("Tod too wordy? Say something.")).toBe(
      "_Hint: Tod too wordy? Say something._",
    );
  });
});

describe("tod hint", () => {
  test("prints hints in order, wraps, and persists the cursor under tod's boundary", () => {
    const home = makeHome();
    const seen: string[] = [];
    for (let i = 0; i < HINTS.length + 1; i += 1) {
      const { code, stdout } = runCli(home, "hint");
      expect(code).toBe(0);
      seen.push(stdout.trimEnd());
    }
    expect(seen.slice(0, HINTS.length)).toEqual(HINTS.map(formatHint));
    expect(seen[HINTS.length]).toBe(formatHint(HINTS[0] ?? ""));
    const cursor = JSON.parse(readFileSync(join(home, ".tod", "hints.json"), "utf8"));
    expect(cursor).toEqual({ version: 1, next: 1 });
  });

  test("works before tod init and creates nothing but the cursor file", () => {
    const home = makeHome();
    expect(runCli(home, "hint").code).toBe(0);
    expect(existsSync(join(home, ".tod", "hints.json"))).toBe(true);
    expect(existsSync(join(home, ".tod", "config.json"))).toBe(false);
  });

  test("stops with a fix when the cursor file is malformed", () => {
    const home = makeHome();
    runCli(home, "hint");
    const path = join(home, ".tod", "hints.json");
    writeFileSync(path, "{ not json");
    const { code, stderr } = runCli(home, "hint");
    expect(code).toBe(1);
    expect(stderr).toContain("hint state is unreadable");
    expect(stderr).toContain("fix:");
    expect(readFileSync(path, "utf8")).toBe("{ not json");
  });

  test("rejects flags with a usage error", () => {
    const { code, stderr } = runCli(makeHome(), "hint", "--all");
    expect(code).toBe(2);
    expect(stderr).toContain("fix:");
  });
});
