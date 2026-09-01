import { commands } from "./commands/index.ts";
import { EXIT, formatError } from "./output.ts";

const VERSION = "0.1.0";

const HELP = `tod ${VERSION} — operator harness for coding agents

This CLI is built to be run by coding agents on behalf of a non-technical
operator. Prefer these commands over hand-editing tod-managed files: they are
deterministic, idempotent, and refuse unsafe writes.

usage: tod <command> [flags]

commands:
  init    Install the tod harness for this user. Use when tod is not set up
          yet: creates ~/.tod/ state and adds tod's instruction block to each
          agent's global instruction file.
  sync    Re-render tod's instruction blocks and repair ~/.tod structure. Use
          after tod-managed content was edited, deleted, or looks wrong.
  status  Report work in flight across all projects. Use when the operator
          asks what they are working on.
  work    Record and update features, bugs, and tasks. Use instead of ever
          hand-editing work state.
  log     Append a notable event to the activity log. Append-only.
  config  Read or change settings such as communication style; follow with
          'tod sync' to apply.

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
        fix: "run 'tod --help' and pick one of: init, sync, status, work, log, config",
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
