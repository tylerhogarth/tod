import { EXIT, formatError } from "../output.ts";
import type { Command } from "./index.ts";

export const sync: Command = {
  help: `tod sync — regenerate tod-managed files and repair adapters

Use after tod-managed files were edited, deleted, or look wrong, or after
changing workspace configuration. Only touches content inside tod's own
marker blocks and tod-owned files; operator memory, work state, and operator
content in shared files are never modified. Idempotent.
`,
  execute: async () => {
    process.stderr.write(
      formatError({
        what: "'tod sync' is not implemented yet",
        why: "this build is a pre-release skeleton",
        fix: "wait for a tod-ai release that includes sync",
      }),
    );
    return EXIT.failure;
  },
};
