import { init } from "./init.ts";
import { newProject } from "./new.ts";
import { status } from "./status.ts";
import { sync } from "./sync.ts";

export interface Command {
  /** Agent-facing help: when to use the command, not just what it does. */
  help: string;
  execute(args: readonly string[]): Promise<number>;
}

export const commands: Readonly<Record<string, Command>> = {
  init,
  new: newProject,
  sync,
  status,
};
