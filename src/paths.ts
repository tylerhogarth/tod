import { homedir } from "node:os";
import { join } from "node:path";

export interface TodPaths {
  home: string;
  todDir: string;
  configFile: string;
  operatorFile: string;
  workFile: string;
  logFile: string;
}

export function todPaths(home: string = homedir()): TodPaths {
  const todDir = join(home, ".tod");
  return {
    home,
    todDir,
    configFile: join(todDir, "config.json"),
    operatorFile: join(todDir, "operator.md"),
    workFile: join(todDir, "work.json"),
    logFile: join(todDir, "log.jsonl"),
  };
}

export interface AgentTarget {
  /** Agent family the file belongs to, used in CLI output. */
  name: string;
  /** The folder whose presence means the agent harness is installed. */
  configDir: string;
  /** The global instruction file tod's block is appended to. */
  instructionFile: string;
}

/**
 * Integration is one marker block per agent's global instruction file.
 * Adding support for another agent means adding an entry here.
 */
export function agentTargets(home: string = homedir()): readonly AgentTarget[] {
  return [
    {
      name: "AGENTS.md standard (Codex, opencode, and others)",
      configDir: join(home, ".agents"),
      instructionFile: join(home, ".agents", "AGENTS.md"),
    },
    {
      name: "Claude Code",
      configDir: join(home, ".claude"),
      instructionFile: join(home, ".claude", "CLAUDE.md"),
    },
  ];
}
