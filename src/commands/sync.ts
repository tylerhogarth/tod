import { homedir } from "node:os";
import { installHarness } from "../harness.ts";
import { EXIT } from "../output.ts";
import { formatError, harnessErrorToAgentError, renderReport } from "./harness-io.ts";
import type { Command } from "./index.ts";

export const sync: Command = {
  help: `tod sync: re-render tod's instruction blocks and repair state

Use after tod-managed content was edited, deleted, or looks wrong, or after
changing settings with 'tod config'. Only touches content inside tod's own
marker blocks and tod-owned structural files; operator memory, work state,
the log, and all content outside the markers are never modified. Idempotent.
`,
  execute: async () => {
    const home = homedir();
    const result = installHarness(home, "sync");
    return result.match({
      ok: (report) => {
        process.stdout.write(renderReport(report, home, "tod harness is in sync"));
        return EXIT.ok;
      },
      err: (error) => {
        process.stderr.write(formatError(harnessErrorToAgentError(error, home)));
        return EXIT.failure;
      },
    });
  },
};
