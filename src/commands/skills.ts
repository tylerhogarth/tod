import pkg from "../../package.json";
import { EXIT, formatError } from "../output.ts";
import type { Command } from "./index.ts";

/**
 * Skills ship from the tod repository, not from the npm package, so an agent
 * installs them straight from git. Pinning to the tag that matches the running
 * version keeps the skill and the CLI in step: an agent on tod 0.2.0 gets the
 * skill as it was at v0.2.0. This command only prints; installing is the
 * agent's job, and tod writes nothing outside its own boundary.
 */

interface SkillSummary {
  name: string;
  summary: string;
}

const SKILLS: readonly SkillSummary[] = [
  {
    name: "tod-create-project",
    summary: "Scaffold a new project on tod's engineering paved road, with deterministic checks.",
  },
];

/** `git+https://github.com/owner/repo.git` to `owner/repo`. */
export function repositorySlug(url: string): string | undefined {
  const match = /github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/.exec(url.trim());
  const owner = match?.[1];
  const name = match?.[2];
  return owner === undefined || name === undefined ? undefined : `${owner}/${name}`;
}

/** The release tag carrying the skills for a given tod version. */
export function skillTag(version: string): string {
  return `v${version}`;
}

export function installCommand(slug: string, version: string, skill: string): string {
  return `npx skills add ${slug}#${skillTag(version)} --skill ${skill} -g -y`;
}

function render(slug: string, version: string): string {
  const lines = [
    `tod ${version} skills, pinned to tag ${skillTag(version)}.`,
    "",
    "Install with:",
    "",
  ];
  for (const skill of SKILLS) {
    lines.push(`  ${installCommand(slug, version, skill.name)}`);
  }
  lines.push("", "available skills:");
  for (const skill of SKILLS) {
    lines.push(`  ${skill.name}  ${skill.summary}`);
  }
  lines.push(
    "",
    "The tag pins the skill to this tod version, so the two never disagree.",
    "This command prints only: it installs nothing and writes nothing.",
    "If the install fails on an unresolved tag, the release was not tagged; report",
    `that rather than installing from a branch.`,
  );
  return `${lines.join("\n")}\n`;
}

export const skills: Command = {
  help: `tod skills: print the command that installs tod's agent skills

Use when the operator starts something new and you need tod's paved-road
guidance, or when you are unsure whether a tod skill covers the task. Prints an
install command pinned to the tag matching this tod version, so the skill and
the CLI agree. Installs nothing, writes nothing, and makes no network request.
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

    const slug = repositorySlug(pkg.repository.url);
    if (slug === undefined) {
      process.stderr.write(
        formatError({
          what: "cannot determine the tod repository",
          why: `package metadata does not contain a recognisable GitHub URL: '${pkg.repository.url}'`,
          fix: "report this as a tod bug; do not guess a repository to install skills from",
        }),
      );
      return EXIT.failure;
    }

    process.stdout.write(render(slug, pkg.version));
    return EXIT.ok;
  },
};
