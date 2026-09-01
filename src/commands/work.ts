import { homedir } from "node:os";
import { parseArgs } from "node:util";
import { defaultAllowedRoots } from "../boundary.ts";
import { EXIT, formatError } from "../output.ts";
import { todPaths } from "../paths.ts";
import { addItem, loadWorkState, saveWorkState, setStatus } from "../work.ts";
import { harnessErrorToAgentError, tildify } from "./harness-io.ts";
import type { Command } from "./index.ts";

const HELP = `tod work: record and update the operator's work

For agents: keep work state truthful so any session can answer "what is in
flight?". Never edit ~/.tod/work.json by hand; use these subcommands.

usage:
  tod work add <title> --project <name> [--kind feature|bug|task] [--parent <id>]
      Use when the operator starts a feature, reports a bug, or agrees a task.
      Prints the new item id.
  tod work done <id> [<id> ...]
      Use when work finishes. Already-done ids are reported as unchanged.
  tod work status <id> <open|in-progress|done>
      Use to move an item between states.
  tod work list
      Machine-oriented listing of every item and id. For the operator-facing
      view, run 'tod status'.
`;

function fail(what: string, why: string, fix: string): number {
  process.stderr.write(formatError({ what, why, fix }));
  return EXIT.failure;
}

function usage(why: string): number {
  process.stderr.write(
    formatError({ what: "invalid 'tod work' usage", why, fix: "run 'tod work --help'" }),
  );
  return EXIT.usage;
}

export const work: Command = {
  help: HELP,
  execute: async (args) => {
    const home = homedir();
    const paths = todPaths(home);
    const roots = defaultAllowedRoots(home);
    const [sub, ...rest] = args;

    const loaded = loadWorkState(paths.workFile);
    if (loaded.isErr()) {
      return fail(
        "work state is unreadable",
        `${tildify(loaded.error.path, home)}: ${loaded.error.message}`,
        "repair the JSON by hand or move the file aside and re-run 'tod sync' to start fresh (recorded work will be lost)",
      );
    }
    const state = loaded.value;
    const now = new Date().toISOString();

    if (sub === "add") {
      const parsed = parseArgs({
        args: [...rest],
        allowPositionals: true,
        options: {
          project: { type: "string" },
          kind: { type: "string", default: "task" },
          parent: { type: "string" },
        },
      });
      const title = parsed.positionals.join(" ").trim();
      const project = parsed.values.project;
      const kind = parsed.values.kind;
      if (!title) {
        return usage("a title is required: tod work add <title> --project <name>");
      }
      if (!project) {
        return usage("--project <name> is required so work is grouped by the operator's project");
      }
      if (kind !== "feature" && kind !== "bug" && kind !== "task") {
        return usage(`--kind must be feature, bug, or task (got '${kind}')`);
      }
      const parent = parsed.values.parent === undefined ? undefined : Number(parsed.values.parent);
      if (parent !== undefined && !Number.isInteger(parent)) {
        return usage(`--parent must be an item id (got '${parsed.values.parent}')`);
      }
      const added = addItem(state, {
        project,
        title,
        kind,
        ...(parent !== undefined ? { parent } : {}),
        now,
      });
      if (added.isErr()) {
        return fail(
          `unknown parent item #${added.error.id}`,
          "the --parent id does not exist in work state",
          "run 'tod work list' to see valid ids",
        );
      }
      const saved = saveWorkState(paths.workFile, added.value.state, roots);
      if (saved.isErr()) {
        return fail(...saveErrorParts(saved.error, home));
      }
      process.stdout.write(
        `added #${added.value.item.id} ${added.value.item.kind} '${added.value.item.title}' to project '${project}'\n`,
      );
      return EXIT.ok;
    }

    if (sub === "done" || sub === "status") {
      const targetStatus =
        sub === "done" ? "done" : (rest[1] as "open" | "in-progress" | "done" | undefined);
      const ids = (sub === "done" ? rest : rest.slice(0, 1)).map(Number);
      if (ids.length === 0 || ids.some((id) => !Number.isInteger(id))) {
        return usage(
          sub === "done"
            ? "at least one numeric item id is required: tod work done <id> [<id> ...]"
            : "usage: tod work status <id> <open|in-progress|done>",
        );
      }
      if (sub === "status" && !["open", "in-progress", "done"].includes(targetStatus ?? "")) {
        return usage("status must be open, in-progress, or done");
      }
      let current = state;
      const lines: string[] = [];
      for (const id of ids) {
        const result = setStatus(current, id, targetStatus as "open" | "in-progress" | "done", now);
        if (result.isErr()) {
          return fail(
            `unknown work item #${id}`,
            "no item with that id exists in work state",
            "run 'tod work list' to see valid ids",
          );
        }
        current = result.value.state;
        lines.push(
          result.value.changed
            ? `#${id} '${result.value.item.title}' is now ${result.value.item.status}`
            : `#${id} '${result.value.item.title}' was already ${result.value.item.status} (unchanged)`,
        );
      }
      const saved = saveWorkState(paths.workFile, current, roots);
      if (saved.isErr()) {
        return fail(...saveErrorParts(saved.error, home));
      }
      process.stdout.write(`${lines.join("\n")}\n`);
      return EXIT.ok;
    }

    if (sub === "list") {
      if (state.projects.length === 0) {
        process.stdout.write(
          "no work recorded yet; use 'tod work add' when the operator starts something\n",
        );
        return EXIT.ok;
      }
      const lines: string[] = [];
      for (const project of state.projects) {
        lines.push(`project ${project.name}`);
        for (const item of project.items) {
          const parent = item.parent !== undefined ? ` parent=#${item.parent}` : "";
          lines.push(`  #${item.id} ${item.kind} ${item.status}${parent} ${item.title}`);
        }
      }
      process.stdout.write(`${lines.join("\n")}\n`);
      return EXIT.ok;
    }

    return usage(`unknown subcommand '${sub ?? ""}'; expected add, done, status, or list`);
  },
};

function saveErrorParts(
  error: Parameters<typeof harnessErrorToAgentError>[0],
  home: string,
): [string, string, string] {
  const mapped = harnessErrorToAgentError(error, home);
  return [mapped.what, mapped.why, mapped.fix];
}
