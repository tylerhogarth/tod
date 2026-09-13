import { existsSync } from "node:fs";
import { join } from "node:path";
import pkg from "../package.json";

/**
 * tod's published skills and how an agent installs them.
 *
 * Skills ship from the tod repository, not from the npm package, so an agent
 * installs them straight from git with the skills tooling. Pinning to the tag
 * that matches the running version keeps the skill and the CLI in step: an
 * agent on tod 0.2.0 gets the skill as it was at v0.2.0.
 *
 * tod never runs the install itself. It detects whether each skill is present
 * and prints the exact command when one is missing; `tod init`, `tod sync`,
 * and `tod skills` all report this, so an agent that runs any of them learns
 * what to install. Once installed, the skill's own description routes the
 * agent to it, so the instruction block carries no pointer to it.
 */

interface SkillSummary {
  name: string;
  summary: string;
}

/** Add an entry here when a new skill is published under `skills/`. */
const SKILLS: readonly SkillSummary[] = [
  {
    name: "tod-create-project",
    summary:
      "Scaffold a new project on tod's engineering paved road, or bring an existing one onto it.",
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

/**
 * Where the skills tooling puts a global install: the canonical copy lives
 * under `~/.agents/skills/` and agent-specific folders link to it. Presence
 * of the SKILL.md is the installed check; tod does not read its contents.
 */
function installedSkillFile(home: string, name: string): string {
  return join(home, ".agents", "skills", name, "SKILL.md");
}

export interface SkillStatus {
  name: string;
  summary: string;
  installed: boolean;
  /** Undefined when the repository cannot be determined from package metadata. */
  command: string | undefined;
}

export function skillStatuses(home: string): SkillStatus[] {
  const slug = repositorySlug(pkg.repository.url);
  return SKILLS.map((skill) => ({
    name: skill.name,
    summary: skill.summary,
    installed: existsSync(installedSkillFile(home, skill.name)),
    command: slug === undefined ? undefined : installCommand(slug, pkg.version, skill.name),
  }));
}

/**
 * One report line per skill, in the same `outcome  detail` shape as the
 * install report, so `init` and `sync` can append them.
 */
export function renderSkillLines(statuses: readonly SkillStatus[]): string[] {
  return statuses.map((skill) =>
    skill.installed
      ? `installed skill ${skill.name}`
      : `missing   skill ${skill.name}: install with '${skill.command ?? "tod skills"}'`,
  );
}
