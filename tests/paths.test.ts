import { describe, expect, test } from "bun:test";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { defaultAllowedRoots } from "../src/boundary.ts";
import { resolveHome } from "../src/paths.ts";

describe("resolveHome", () => {
  test("returns the operator's home directory when TOD_HOME is unset", () => {
    expect(resolveHome({})).toBe(homedir());
  });

  test("treats an empty or blank TOD_HOME as unset", () => {
    expect(resolveHome({ TOD_HOME: "" })).toBe(homedir());
    expect(resolveHome({ TOD_HOME: "   " })).toBe(homedir());
  });

  test("resolves a relative TOD_HOME against the working directory", () => {
    expect(resolveHome({ TOD_HOME: "output" })).toBe(resolve("output"));
  });

  test("keeps an absolute TOD_HOME as given", () => {
    expect(resolveHome({ TOD_HOME: "/tmp/tod-sandbox" })).toBe("/tmp/tod-sandbox");
  });

  test("the boundary allowlist follows the overridden home", () => {
    const home = resolveHome({ TOD_HOME: "/tmp/tod-sandbox" });
    expect(defaultAllowedRoots(home)).toEqual([
      "/tmp/tod-sandbox/.agents",
      "/tmp/tod-sandbox/.claude",
      "/tmp/tod-sandbox/.tod",
    ]);
  });
});
