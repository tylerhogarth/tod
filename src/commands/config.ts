import { homedir } from "node:os";
import { defaultAllowedRoots } from "../boundary.ts";
import { configSchema, loadConfig, serialiseConfig } from "../config.ts";
import { writeFileAtomic } from "../fsx.ts";
import { EXIT, formatError } from "../output.ts";
import { todPaths } from "../paths.ts";
import { harnessErrorToAgentError } from "./harness-io.ts";
import type { Command } from "./index.ts";

const SETTABLE = ["technicality", "detail", "focus", "tone"] as const;
type Settable = (typeof SETTABLE)[number];

function optionsFor(key: Settable): readonly string[] {
  return configSchema.shape.communication.shape[key].options;
}

export const config: Command = {
  help: `tod config: read and change tod settings

Use to set the communication dimensions during onboarding and whenever
the operator asks for a different style, then run 'tod sync' so instruction
blocks pick the change up. Never edit ~/.tod/config.json by hand.

usage:
  tod config get
      Print all settings as JSON.
  tod config set communication.<key> <value>
      Keys and values:
        technicality: non-technical | semi-technical | technical
        detail:       concise | balanced | detailed
        focus:        outcomes | balanced | implementation
        tone:         terse | conversational | chatty
`,
  execute: async (args) => {
    const home = homedir();
    const paths = todPaths(home);
    const roots = defaultAllowedRoots(home);
    const [sub, ...rest] = args;

    const loaded = loadConfig(paths.configFile);
    if (loaded.isErr()) {
      process.stderr.write(formatError(harnessErrorToAgentError(loaded.error, home)));
      return EXIT.failure;
    }
    const current = loaded.value;

    if (sub === "get") {
      process.stdout.write(serialiseConfig(current));
      return EXIT.ok;
    }

    if (sub === "set") {
      const [rawKey, value] = rest;
      const key = rawKey?.replace(/^communication\./, "") as Settable | undefined;
      if (!rawKey || value === undefined || !key || !SETTABLE.includes(key)) {
        process.stderr.write(
          formatError({
            what: "invalid 'tod config set' usage",
            why: `expected a settable key and value, got '${rest.join(" ")}'`,
            fix: `run: tod config set communication.<${SETTABLE.join("|")}> <value>; see 'tod config --help' for values`,
          }),
        );
        return EXIT.usage;
      }
      if (!optionsFor(key).includes(value)) {
        process.stderr.write(
          formatError({
            what: `'${value}' is not a valid value for communication.${key}`,
            why: `allowed values are: ${optionsFor(key).join(", ")}`,
            fix: `re-run with one of the allowed values, e.g. tod config set communication.${key} ${optionsFor(key)[0]}`,
          }),
        );
        return EXIT.usage;
      }
      const next = {
        ...current,
        communication: { ...current.communication, [key]: value },
      };
      const written = writeFileAtomic(paths.configFile, serialiseConfig(next), roots);
      if (written.isErr()) {
        process.stderr.write(formatError(harnessErrorToAgentError(written.error, home)));
        return EXIT.failure;
      }
      process.stdout.write(
        written.value === "unchanged"
          ? `communication.${key} was already ${value} (unchanged)\n`
          : `communication.${key} set to ${value}; run 'tod sync' to apply it to instruction blocks\n`,
      );
      return EXIT.ok;
    }

    process.stderr.write(
      formatError({
        what: `unknown 'tod config' subcommand '${sub ?? ""}'`,
        why: "tod config supports get and set",
        fix: "run 'tod config --help'",
      }),
    );
    return EXIT.usage;
  },
};
