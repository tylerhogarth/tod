import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultAllowedRoots, isWriteAllowed } from "../src/boundary.ts";

function makeHome(): string {
  return mkdtempSync(join(tmpdir(), "tod-boundary-"));
}

describe("defaultAllowedRoots", () => {
  test("covers only the agents, claude, and todai folders under home", () => {
    const roots = defaultAllowedRoots("/home/operator");
    expect(roots).toEqual([
      "/home/operator/agents",
      "/home/operator/claude",
      "/home/operator/todai",
    ]);
  });
});

describe("isWriteAllowed", () => {
  test("allows a path inside an allowed root, even before it exists", () => {
    const home = makeHome();
    const roots = defaultAllowedRoots(home);
    expect(isWriteAllowed(join(home, "todai", "workspace", "AGENTS.md"), roots)).toBe(true);
  });

  test("rejects a path outside every root", () => {
    const home = makeHome();
    const roots = defaultAllowedRoots(home);
    expect(isWriteAllowed(join(home, "Documents", "notes.md"), roots)).toBe(false);
  });

  test("rejects the home directory itself", () => {
    const home = makeHome();
    expect(isWriteAllowed(home, defaultAllowedRoots(home))).toBe(false);
  });

  test("rejects a sibling whose name shares a prefix with a root", () => {
    const home = makeHome();
    const roots = defaultAllowedRoots(home);
    expect(isWriteAllowed(join(home, "todai-evil", "x.md"), roots)).toBe(false);
  });

  test("rejects a symlink that escapes an allowed root", () => {
    const home = makeHome();
    const outside = mkdtempSync(join(tmpdir(), "tod-outside-"));
    const roots = defaultAllowedRoots(home);
    mkdirSync(join(home, "todai"), { recursive: true });
    symlinkSync(outside, join(home, "todai", "escape"));
    expect(isWriteAllowed(join(home, "todai", "escape", "x.md"), roots)).toBe(false);
  });

  test("allows an operator-designated project directory", () => {
    const home = makeHome();
    const project = mkdtempSync(join(tmpdir(), "tod-project-"));
    const roots = defaultAllowedRoots(home);
    expect(isWriteAllowed(join(project, "AGENTS.md"), roots, [project])).toBe(true);
  });
});
