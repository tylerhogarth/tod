import { EXIT, formatError } from "../output.ts";
import type { Command } from "./index.ts";

export const init: Command = {
  help: `tod init — create a tod workspace in the current directory

Use when the operator wants tod set up and no .tod/ directory exists here.
Creates tod-managed instructions, agent adapter symlinks, a seed operator
profile, and empty work state. Asks nothing; onboarding is agent-led and
described in the generated instructions. Idempotent: re-running repairs
rather than overwrites.
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
