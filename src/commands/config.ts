import { defaultAllowedRoots } from "../boundary.ts";
import { type Config, loadConfig, type Scale, serialiseConfig } from "../config.ts";
import { writeFileAtomic } from "../fsx.ts";
import { EXIT, formatError } from "../output.ts";
import { resolveHome, todPaths } from "../paths.ts";
import { harnessErrorToAgentError } from "./harness-io.ts";
import type { Command } from "./index.ts";

const SETTABLE = {
  "requirement-gathering": "requirementGathering",
  "response-detail": "responseDetail",
} as const;
type SettableKey = keyof typeof SETTABLE;

function isSettable(key: string): key is SettableKey {
  return key in SETTABLE;
}

function parseScale(value: string): Scale | null {
  const parsed = Number(value);
  return parsed === 1 || parsed === 2 || parsed === 3 || parsed === 4 || parsed === 5
    ? parsed
    : null;
}

export const config: Command = {
  help: `tod config: read and change tod's two behaviour settings

Use to record the operator's answers to the 'tod init' onboarding questions,
and whenever the operator asks to reconfigure; run 'tod sync' afterwards so
instruction blocks pick the change up. Never edit ~/.tod/config.json by hand.

usage:
  tod config get
      Print all settings as JSON.
  tod config set <key> <1-5>
      Keys:
        requirement-gathering: 1 (eager: assume and build) to
                               5 (pushy: explore requirements together first)
        response-detail:       1 (concise: outcomes and short summaries) to
                               5 (detailed: decisions and mechanisms)
`,
  execute: async (args) => {
    const home = resolveHome();
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
      const [key, value] = rest;
      if (key === undefined || value === undefined || !isSettable(key)) {
        process.stderr.write(
          formatError({
            what: "invalid 'tod config set' usage",
            why: `expected a settable key and value, got '${rest.join(" ")}'`,
            fix: `run: tod config set <${Object.keys(SETTABLE).join("|")}> <1-5>; see 'tod config --help'`,
          }),
        );
        return EXIT.usage;
      }
      const scale = parseScale(value);
      if (scale === null) {
        process.stderr.write(
          formatError({
            what: `'${value}' is not a valid value for ${key}`,
            why: "allowed values are the whole numbers 1 to 5",
            fix: `re-run with a value on the scale, e.g. tod config set ${key} 3`,
          }),
        );
        return EXIT.usage;
      }
      const next: Config = { ...current, [SETTABLE[key]]: scale };
      const written = writeFileAtomic(paths.configFile, serialiseConfig(next), roots);
      if (written.isErr()) {
        process.stderr.write(formatError(harnessErrorToAgentError(written.error, home)));
        return EXIT.failure;
      }
      process.stdout.write(
        written.value === "unchanged"
          ? `${key} was already ${scale} (unchanged)\n`
          : `${key} set to ${scale}; run 'tod sync' to apply it to instruction blocks\n`,
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
