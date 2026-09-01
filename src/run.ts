import { commands } from "./commands/index.ts";
import { EXIT, formatError } from "./output.ts";

const VERSION = "0.1.0";

const HELP = `tod ${VERSION} — operator harness for coding agents

This CLI is built to be run by coding agents on behalf of a non-technical
operator. Prefer these commands over hand-editing tod-managed files: they are
deterministic, idempotent, and refuse unsafe writes.

usage: tod <command> [flags]

commands:
  init    Create a tod workspace in the current directory. Use when the
          operator wants tod set up and no .tod/ directory exists here.
  new     Register a new project in the workspace. Use when the operator
          starts a new app or idea; never scaffolds application code.
  sync    Regenerate tod-managed files and repair adapter symlinks. Use after
          tod-managed files were edited, deleted, or look wrong.
  status  Report work in flight across all projects. Use when the operator
          asks what they are working on.

Run 'tod <command> --help' for when-to-use guidance and flags.
exit codes: 0 success · 1 failure (the message states the fix) · 2 usage error
`;

export async function run(argv: readonly string[]): Promise<number> {
  const [name, ...rest] = argv;

  if (name === undefined || name === "--help" || name === "-h" || name === "help") {
    process.stdout.write(HELP);
    return EXIT.ok;
  }
  if (name === "--version" || name === "-v") {
    process.stdout.write(`${VERSION}\n`);
    return EXIT.ok;
  }

  const command = commands[name];
  if (command === undefined) {
    process.stderr.write(
      formatError({
        what: `unknown command '${name}'`,
        why: `tod has no command named '${name}'`,
        fix: "run 'tod --help' and pick one of: init, new, sync, status",
      }),
    );
    return EXIT.usage;
  }

  if (rest.includes("--help") || rest.includes("-h")) {
    process.stdout.write(command.help);
    return EXIT.ok;
  }

  return command.execute(rest);
}
