import { appendFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { defaultAllowedRoots, describeBoundary, isWriteAllowed } from "../boundary.ts";
import { EXIT, formatError } from "../output.ts";
import { resolveHome, todPaths } from "../paths.ts";
import { tildify } from "./harness-io.ts";
import type { Command } from "./index.ts";

export const log: Command = {
  help: `tod log: append an entry to the operator's activity log

Use when something notable happens that the operator or a future
session would want to know (a feature shipped, a decision made, a problem
fixed). One line per event. The log is append-only; nothing rewrites it.

usage: tod log <message> [--project <name>]
`,
  execute: async (args) => {
    const home = resolveHome();
    const paths = todPaths(home);
    const roots = defaultAllowedRoots(home);

    const parsed = parseArgs({
      args: [...args],
      allowPositionals: true,
      options: { project: { type: "string" } },
    });
    const message = parsed.positionals.join(" ").trim();
    if (!message) {
      process.stderr.write(
        formatError({
          what: "invalid 'tod log' usage",
          why: "a message is required",
          fix: "run: tod log <message> [--project <name>]",
        }),
      );
      return EXIT.usage;
    }

    if (!isWriteAllowed(paths.logFile, roots)) {
      process.stderr.write(
        formatError({
          what: "refused to write outside tod's boundary",
          why: `${tildify(paths.logFile, home)} resolves outside the allowed folders`,
          fix: `tod only writes inside: ${describeBoundary(roots)}. Check HOME and any symlinks on the path`,
        }),
      );
      return EXIT.failure;
    }

    const entry = {
      at: new Date().toISOString(),
      message,
      ...(parsed.values.project !== undefined ? { project: parsed.values.project } : {}),
    };
    try {
      // Appending is the one write that skips temp-file-plus-rename: a rename
      // would rewrite the whole file, and the log's guarantee is append-only.
      appendFileSync(paths.logFile, `${JSON.stringify(entry)}\n`, "utf8");
    } catch (cause) {
      process.stderr.write(
        formatError({
          what: `could not append to ${tildify(paths.logFile, home)}`,
          why: cause instanceof Error ? cause.message : String(cause),
          fix: "run 'tod init' if tod is not set up yet, otherwise check file permissions",
        }),
      );
      return EXIT.failure;
    }
    process.stdout.write("logged\n");
    return EXIT.ok;
  },
};
