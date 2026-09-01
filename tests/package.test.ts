import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dir, "..");
const packageJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

describe("package metadata", () => {
  test("publishes as tod-ai with a tod binary from the node bundle", () => {
    expect(packageJson.name).toBe("tod-ai");
    expect(packageJson.bin.tod).toBe("./dist/cli.js");
    expect(packageJson.files).toEqual(["dist"]);
    expect(packageJson.license).toBe("MIT");
    expect(packageJson.scripts.prepublishOnly).toContain("check");
    expect(packageJson.scripts.prepublishOnly).toContain("build");
  });

  test("the node bundle builds and runs without bun", () => {
    const build = Bun.spawnSync(["bun", "run", "scripts/build.ts"], { cwd: ROOT });
    expect(build.exitCode).toBe(0);
    const version = Bun.spawnSync(["node", "dist/cli.js", "--version"], { cwd: ROOT });
    expect(version.exitCode).toBe(0);
    expect(version.stdout.toString().trim()).toBe(packageJson.version);
  });
});

describe("repository hygiene", () => {
  test("committed files never contain this machine's home path", () => {
    const needle = homedir();
    const files: string[] = ["README.md", "AGENTS.md", "package.json", "tsconfig.json"];
    const stack = ["src", "tests", "scripts", ".github"].map((dir) => join(ROOT, dir));
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        break;
      }
      for (const entry of readdirSync(current)) {
        const full = join(current, entry);
        if (statSync(full).isDirectory()) {
          stack.push(full);
        } else {
          files.push(relative(ROOT, full));
        }
      }
    }
    for (const file of files) {
      const content = readFileSync(join(ROOT, file), "utf8");
      expect(content.includes(needle), `${file} contains the local home path`).toBe(false);
    }
  });
});
