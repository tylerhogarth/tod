import pkg from "../../package.json";
import { EXIT, formatError } from "../output.ts";
import { resolveHome } from "../paths.ts";
import { type SkillStatus, skillStatuses, skillTag } from "../skills.ts";
import type { Command } from "./index.ts";

function render(version: string, statuses: readonly SkillStatus[]): string {
  const missing = statuses.filter((skill) => !skill.installed);
  const lines = [`tod ${version} skills, pinned to tag ${skillTag(version)}.`, ""];
  if (missing.length === 0) {
    lines.push("All tod skills are installed; nothing to do.");
  } else {
    lines.push("Install the missing skills with:", "");
    for (const skill of missing) {
      lines.push(`  ${skill.command}`);
    }
  }
  lines.push("", "skills:");
  for (const skill of statuses) {
    lines.push(`  ${skill.installed ? "installed" : "missing  "} ${skill.name}  ${skill.summary}`);
  }
  lines.push(
    "",
    "The tag pins the skill to this tod version, so the two never disagree.",
    "This command prints only: it installs nothing and writes nothing.",
    "If the install fails on an unresolved tag, the release was not tagged; report",
    "that rather than installing from a branch.",
  );
  return `${lines.join("\n")}\n`;
}

export const skills: Command = {
  help: `tod skills: report tod's agent skills and how to install any that are missing

Use when 'tod init' or 'tod sync' reports a missing skill, or when you are
unsure whether a tod skill is installed. Prints an install command pinned to
the tag matching this tod version, so the skill and the CLI agree. Installs
nothing, writes nothing, and makes no network request.
`,
  execute: async (args) => {
    const unknown = args.find((arg) => arg.startsWith("-"));
    if (unknown !== undefined) {
      process.stderr.write(
        formatError({
          what: `unknown flag '${unknown}'`,
          why: "tod skills takes no flags",
          fix: "run 'tod skills' with no arguments",
        }),
      );
      return EXIT.usage;
    }

    const statuses = skillStatuses(resolveHome());
    if (statuses.some((skill) => skill.command === undefined)) {
      process.stderr.write(
        formatError({
          what: "cannot determine the tod repository",
          why: `package metadata does not contain a recognisable GitHub URL: '${pkg.repository.url}'`,
          fix: "report this as a tod bug; do not guess a repository to install skills from",
        }),
      );
      return EXIT.failure;
    }

    process.stdout.write(render(pkg.version, statuses));
    return EXIT.ok;
  },
};
