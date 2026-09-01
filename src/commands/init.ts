import { installHarness } from "../harness.ts";
import { EXIT } from "../output.ts";
import { resolveHome } from "../paths.ts";
import { formatError, harnessErrorToAgentError, renderReport } from "./harness-io.ts";
import type { Command } from "./index.ts";

/**
 * The CLI never prompts, so onboarding is agent-led: init prints the wizard
 * and the agent holds the conversation, then records answers via `tod config
 * set` and applies them with `tod sync`. The script is predefined so every
 * operator gets the same onboarding, delivered in the Tod persona.
 */
const ONBOARDING = `
onboarding: deliver this script to the operator as Tod, verbatim, as a single
message with both questions. Wait for both answers before recording.

  Hi, I'm Tod. I want building software to feel easy and that's my job. Let's get started:

  When building together, how persistent should I be when asking exploratory questions on a scale from 1 to 5?
  1 = don't ask, just build what I say
  5 = ask questions, help me clarify what I want

  When telling you about what I've built, how detailed should I be from 1 to 5?
  1 = don't care, be concise
  5 = tell me about what you've built and why

record the answers, then apply them:
  tod config set requirement-gathering <1-5>
  tod config set response-detail <1-5>
  tod sync
`;

export const init: Command = {
  help: `tod init: install the tod harness and run onboarding

Use for first-time setup and whenever the operator wants to reconfigure tod.
Creates ~/.tod/ state if missing and appends tod's delimited instruction
block to each detected agent's global instruction file (~/.agents/AGENTS.md,
~/.claude/CLAUDE.md); content outside tod's block is never modified. Every
run ends with the two-question onboarding wizard for you to conduct with the
operator; record the answers with 'tod config set', then run 'tod sync'.
Idempotent: re-running repairs rather than duplicates.
`,
  execute: async () => {
    const home = resolveHome();
    const result = installHarness(home, "init");
    return result.match({
      ok: (report) => {
        const summary =
          report.skippedAgents.length === 2
            ? "tod state created, but no agent config folders were found; install a coding agent, then run 'tod sync'"
            : "tod harness installed; agent sessions now load the tod block from their global instructions";
        process.stdout.write(renderReport(report, home, summary) + ONBOARDING);
        return EXIT.ok;
      },
      err: (error) => {
        process.stderr.write(formatError(harnessErrorToAgentError(error, home)));
        return EXIT.failure;
      },
    });
  },
};
