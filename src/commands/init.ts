import { EXIT, formatError } from "../output.ts";
import type { Command } from "./index.ts";

export const init: Command = {
  help: `tod init — install the tod harness for this user

Use when tod is not set up yet. Creates ~/.tod/ (settings, operator memory,
work state, log) and appends tod's delimited instruction block to each
detected agent's global instruction file (~/.agents/AGENTS.md,
~/.claude/CLAUDE.md). Existing file content outside tod's block is never
modified. Asks nothing; onboarding is agent-led and described in the
instruction block. Idempotent: re-running repairs rather than duplicates.
`,
  execute: async () => {
    process.stderr.write(
      formatError({
        what: "'tod init' is not implemented yet",
        why: "this build is a pre-release skeleton",
        fix: "wait for a tod-ai release that includes workspace initialisation",
      }),
    );
    return EXIT.failure;
  },
};
