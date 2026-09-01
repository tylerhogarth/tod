import { homedir } from "node:os";
import { EXIT, formatError } from "../output.ts";
import { todPaths } from "../paths.ts";
import { loadWorkState, type WorkState } from "../work.ts";
import { tildify } from "./harness-io.ts";
import type { Command } from "./index.ts";

function renderStatus(state: WorkState, showAll: boolean): string {
  const lines: string[] = [];
  let open = 0;
  for (const project of state.projects) {
    const visible = project.items.filter((item) => showAll || item.status !== "done");
    open += project.items.filter((item) => item.status !== "done").length;
    if (visible.length === 0 && !showAll) {
      continue;
    }
    lines.push(`${project.name}`);
    for (const item of visible) {
      const indent = item.parent !== undefined ? "    " : "  ";
      lines.push(
        `${indent}#${item.id} ${item.kind.padEnd(7)} ${item.status.padEnd(11)} ${item.title}`,
      );
    }
  }
  const header =
    state.projects.length === 0
      ? "no work recorded yet"
      : `${state.projects.length} project${state.projects.length === 1 ? "" : "s"}, ${open} item${open === 1 ? "" : "s"} in flight`;
  return [header, ...lines].join("\n");
}

export const status: Command = {
  help: `tod status — report work in flight across all projects

Use when the operator asks what they are working on, what is open, or which
projects have activity. Reads work state only; changes nothing. Pass --all to
include completed items.
`,
  execute: async (args) => {
    const home = homedir();
    const paths = todPaths(home);
    const loaded = loadWorkState(paths.workFile);
    if (loaded.isErr()) {
      process.stderr.write(
        formatError({
          what: "work state is unreadable",
          why: `${tildify(loaded.error.path, home)}: ${loaded.error.message}`,
          fix: "repair the JSON by hand or move the file aside and re-run 'tod sync' to start fresh (recorded work will be lost)",
        }),
      );
      return EXIT.failure;
    }
    process.stdout.write(`${renderStatus(loaded.value, args.includes("--all"))}\n`);
    return EXIT.ok;
  },
};
