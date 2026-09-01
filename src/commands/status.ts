import { EXIT, formatError } from "../output.ts";
import type { Command } from "./index.ts";

export const status: Command = {
  help: `tod status — report work in flight across all projects

Use when the operator asks what they are working on, what is open, or which
projects have activity. Reads work state only; changes nothing.
`,
  execute: async () => {
    process.stderr.write(
      formatError({
        what: "'tod status' is not implemented yet",
        why: "this build is a pre-release skeleton",
        fix: "wait for a tod-ai release that includes work-state reporting",
      }),
    );
    return EXIT.failure;
  },
};
