import { defaultAllowedRoots } from "../boundary.ts";
import { formatHint, nextHint } from "../hints.ts";
import { EXIT, formatError } from "../output.ts";
import { resolveHome, todPaths } from "../paths.ts";
import { harnessErrorToAgentError, tildify } from "./harness-io.ts";
import type { Command } from "./index.ts";

export const hint: Command = {
  help: `tod hint: print the next operator hint

Use once at the start of a session when tod is active, and show the printed
line to the operator verbatim as the opening line of your first reply. Hints
remind the operator that they can steer Tod in plain language. Each call
advances to the next hint and wraps at the end, so the operator sees them in
turn. Writes only the hint cursor in ~/.tod/.
`,
  execute: async (args) => {
    const unknown = args.find((arg) => arg.startsWith("-"));
    if (unknown !== undefined) {
      process.stderr.write(
        formatError({
          what: `unknown flag '${unknown}'`,
          why: "tod hint takes no flags",
          fix: "run 'tod hint' with no arguments",
        }),
      );
      return EXIT.usage;
    }

    const home = resolveHome();
    const paths = todPaths(home);
    const result = nextHint(paths.hintFile, defaultAllowedRoots(home));
    return result.match({
      ok: (text) => {
        process.stdout.write(`${formatHint(text)}\n`);
        return EXIT.ok;
      },
      err: (error) => {
        if (error._tag === "HintState") {
          process.stderr.write(
            formatError({
              what: "hint state is unreadable",
              why: `${tildify(error.path, home)}: ${error.message}`,
              fix: `delete ${tildify(error.path, home)} (the hint cycle restarts from the first hint), then re-run`,
            }),
          );
          return EXIT.failure;
        }
        process.stderr.write(formatError(harnessErrorToAgentError(error, home)));
        return EXIT.failure;
      },
    });
  },
};
