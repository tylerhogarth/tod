import { existsSync } from "node:fs";
import { Result, TaggedError } from "better-result";
import { z } from "zod";
import { type IoError, type OutOfBoundsError, readFileIfExists, writeFileAtomic } from "./fsx.ts";
import { NotInitialisedError } from "./harness.ts";
import type { TodPaths } from "./paths.ts";

/**
 * Operator hints: short reminders that the operator can steer Tod in plain
 * language. The agent shows one at the start of a session; `tod hint` cycles
 * through them in order so the operator sees each in turn rather than the
 * same one every time.
 *
 * Editing rules:
 *
 * 1. Each hint is one sentence, or a short setup and one sentence. It is shown
 *    to the operator verbatim, so it is written for them, not for the agent.
 * 2. Quote the exact words the operator can say, so they can repeat them.
 *    Every quoted instruction must be something the block tells the agent to
 *    honour (see `src/template.ts`).
 * 3. No dashes, no tool names, no file paths. The tests check the first.
 * 4. Order is the display order. Append new hints at the end so operators
 *    mid-cycle do not see a repeat.
 */
export const HINTS: readonly string[] = [
  'Tod too wordy? Say "Tod, be less wordy" at any point.',
  'Want to know more about what was built? Say "Tod, tell me more."',
  'Tod asking too many questions? Say "Tod, just build it."',
  'Want Tod to check with you more? Say "Tod, ask me before you decide."',
  'Not sure what is in progress? Ask "Tod, what am I working on?"',
  "Something you always want done a certain way? Tell Tod once and he remembers.",
  'Want to see it working? Say "Tod, show me."',
  'Something went wrong with the latest change? Say "Tod, go back to the last version that worked."',
  "Starting something new? Describe what it should do and Tod sets the project up for you.",
  "Something broke? Describe what you saw and Tod tracks it as a bug until it is fixed.",
  "Not building today? Ask for whatever you need and Tod stays out of the way.",
];

const hintStateSchema = z.object({
  version: z.literal(1),
  /** Index into HINTS of the next hint to show. Wraps at the end. */
  next: z.number().int().nonnegative(),
});

type HintState = z.infer<typeof hintStateSchema>;

export class HintStateError extends TaggedError("HintState")<{
  path: string;
  message: string;
}> {}

/** Missing file means the cycle starts at the first hint. */
function loadHintState(path: string): Result<HintState, HintStateError> {
  const raw = readFileIfExists(path);
  if (raw === null) {
    return Result.ok({ version: 1, next: 0 });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    return Result.err(
      new HintStateError({
        path,
        message: `not valid JSON: ${cause instanceof Error ? cause.message : String(cause)}`,
      }),
    );
  }
  const checked = hintStateSchema.safeParse(parsed);
  if (!checked.success) {
    return Result.err(new HintStateError({ path, message: z.prettifyError(checked.error) }));
  }
  return Result.ok(checked.data);
}

/** The line the agent shows the operator, in markdown italics. */
export function formatHint(hint: string): string {
  return `_Hint: ${hint}_`;
}

/**
 * Returns the next hint and advances the cursor. The cursor is stored modulo
 * the list length, so removing hints never leaves it out of range.
 *
 * Refuses before `tod init`: creating the cursor file would also create
 * `~/.tod/`, which is what `installHarness` uses to tell a first install
 * from a repair, and a later `tod sync` would then skip onboarding.
 */
export function nextHint(
  paths: TodPaths,
  roots: readonly string[],
): Result<string, NotInitialisedError | HintStateError | OutOfBoundsError | IoError> {
  if (!existsSync(paths.configFile)) {
    return Result.err(new NotInitialisedError({ todDir: paths.todDir }));
  }
  const path = paths.hintFile;
  const loaded = loadHintState(path);
  if (loaded.isErr()) {
    return Result.err(loaded.error);
  }
  const index = loaded.value.next % HINTS.length;
  const hint = HINTS[index];
  if (hint === undefined) {
    return Result.err(new HintStateError({ path, message: "no hints are defined" }));
  }
  const state: HintState = { version: 1, next: (index + 1) % HINTS.length };
  const written = writeFileAtomic(path, `${JSON.stringify(state, null, 2)}\n`, roots);
  if (written.isErr()) {
    return Result.err(written.error);
  }
  return Result.ok(hint);
}
