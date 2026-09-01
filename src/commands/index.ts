import { config } from "./config.ts";
import { init } from "./init.ts";
import { log } from "./log.ts";
import { status } from "./status.ts";
import { sync } from "./sync.ts";
import { work } from "./work.ts";

export interface Command {
  /** Agent-facing help: when to use the command, not just what it does. */
  help: string;
  execute(args: readonly string[]): Promise<number>;
}

export const commands: Readonly<Record<string, Command>> = {
  init,
  sync,
  status,
  work,
  log,
  config,
};
