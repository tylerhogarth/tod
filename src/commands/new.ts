import { EXIT, formatError } from "../output.ts";
import type { Command } from "./index.ts";

export const newProject: Command = {
  help: `tod new — register a new project in the workspace

Use when the operator starts a new app or idea. Creates the project folder,
places tod-managed project instructions and adapter symlinks, initialises a
git repository, and registers the project in work state. Never scaffolds
application code and never chooses a tech stack.
`,
  execute: async () => {
    process.stderr.write(
      formatError({
        what: "'tod new' is not implemented yet",
        why: "this build is a pre-release skeleton",
        fix: "wait for a tod-ai release that includes project registration",
      }),
    );
    return EXIT.failure;
  },
};
