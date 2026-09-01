import { existsSync } from "node:fs";
import { Result, TaggedError } from "better-result";
import { defaultAllowedRoots } from "./boundary.ts";
import { type Config, type ConfigError, loadConfig, serialiseConfig } from "./config.ts";
import {
  type IoError,
  type OutOfBoundsError,
  readFileIfExists,
  type WriteOutcome,
  writeFileAtomic,
} from "./fsx.ts";
import { type MalformedMarkersError, upsertBlock } from "./markers.ts";
import { agentTargets, todPaths } from "./paths.ts";
import { renderBlock } from "./template.ts";

export const seedOperatorMemory = `# Operator memory

This file is tod's memory of the operator. Agents: keep it current and truthful; it is the only tod-managed file you edit directly.

## Onboarding

Status: not started

While onboarding is not started, follow the onboarding rule in your tod instructions, record what you learn below, then change the status line to: Status: complete.

## Profile

Nothing recorded yet.

## Preferences

Nothing recorded yet.
`;

const seedWorkState = `${JSON.stringify({ version: 1, nextId: 1, projects: [] }, null, 2)}\n`;

export class NotInitialisedError extends TaggedError("NotInitialised")<{ todDir: string }> {}

export type HarnessError =
  | NotInitialisedError
  | ConfigError
  | MalformedMarkersError
  | OutOfBoundsError
  | IoError;

export interface FileReport {
  path: string;
  outcome: WriteOutcome;
}

export interface InstallReport {
  config: Config;
  files: FileReport[];
  /** Agent config folders that were not present, so no block was installed. */
  skippedAgents: string[];
}

/**
 * The single implementation behind `tod init` and `tod sync`. Two phases: all
 * reads and content validation first, then writes, so every expected failure
 * happens before anything on disk changes.
 */
export function installHarness(
  home: string,
  mode: "init" | "sync",
): Result<InstallReport, HarnessError> {
  const paths = todPaths(home);
  const roots = defaultAllowedRoots(home);

  if (mode === "sync" && !existsSync(paths.todDir)) {
    return Result.err(new NotInitialisedError({ todDir: paths.todDir }));
  }

  const configResult = loadConfig(paths.configFile);
  if (configResult.isErr()) {
    return Result.err(configResult.error);
  }
  const config = configResult.value;
  const block = renderBlock(config);

  const writes: { path: string; content: string }[] = [
    { path: paths.configFile, content: serialiseConfig(config) },
  ];
  for (const seed of [
    { path: paths.operatorFile, content: seedOperatorMemory },
    { path: paths.workFile, content: seedWorkState },
    { path: paths.logFile, content: "" },
  ]) {
    if (readFileIfExists(seed.path) === null) {
      writes.push(seed);
    }
  }

  const skippedAgents: string[] = [];
  for (const target of agentTargets(home)) {
    if (!existsSync(target.configDir)) {
      skippedAgents.push(target.name);
      continue;
    }
    const existing = readFileIfExists(target.instructionFile);
    const upserted = upsertBlock(existing, block, target.instructionFile);
    if (upserted.isErr()) {
      return Result.err(upserted.error);
    }
    writes.push({ path: target.instructionFile, content: upserted.value });
  }

  const files: FileReport[] = [];
  for (const write of writes) {
    const result = writeFileAtomic(write.path, write.content, roots);
    if (result.isErr()) {
      return Result.err(result.error);
    }
    files.push({ path: write.path, outcome: result.value });
  }

  return Result.ok({ config, files, skippedAgents });
}
