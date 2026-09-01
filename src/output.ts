export const EXIT = {
  ok: 0,
  failure: 1,
  usage: 2,
} as const;

export interface AgentError {
  /** What failed, in one line. */
  what: string;
  /** The cause, so the agent can reason about it. */
  why: string;
  /** The exact next action: a command to run or a file to inspect. */
  fix: string;
}

/**
 * Errors are read by coding agents, not humans. Every error names the exact
 * next action; "something went wrong" is never acceptable.
 */
export function formatError(error: AgentError): string {
  return `error: ${error.what}\nwhy: ${error.why}\nfix: ${error.fix}\n`;
}
