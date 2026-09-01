import { homedir } from "node:os";
import { installHarness } from "../harness.ts";
import { EXIT } from "../output.ts";
import { formatError, harnessErrorToAgentError, renderReport } from "./harness-io.ts";
import type { Command } from "./index.ts";

export const init: Command = {
  help: `tod init: install the tod harness for this user

Use when tod is not set up yet. Creates ~/.tod/ (settings, operator memory,
work state, log) and appends tod's delimited instruction block to each
detected agent's global instruction file (~/.agents/AGENTS.md,
~/.claude/CLAUDE.md). Existing file content outside tod's block is never
modified. Asks nothing; onboarding is agent-led and described in the
instruction block. Idempotent: re-running repairs rather than duplicates.
`,
  execute: async () => {
    const home = homedir();
    const result = installHarness(home, "init");
    return result.match({
      ok: (report) => {
        const summary =
          report.skippedAgents.length === 2
            ? "tod state created, but no agent config folders were found; install a coding agent, then run 'tod sync'"
            : "tod harness installed; agent sessions now load the tod block from their global instructions";
        process.stdout.write(renderReport(report, home, summary));
        return EXIT.ok;
      },
      err: (error) => {
        process.stderr.write(formatError(harnessErrorToAgentError(error, home)));
        return EXIT.failure;
      },
    });
  },
};
