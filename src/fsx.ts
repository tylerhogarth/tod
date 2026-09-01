import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Result, TaggedError } from "better-result";
import { describeBoundary, isWriteAllowed } from "./boundary.ts";

export class OutOfBoundsError extends TaggedError("OutOfBounds")<{
  path: string;
  boundary: string;
}> {}

export class IoError extends TaggedError("Io")<{
  path: string;
  message: string;
}> {}

export type WriteOutcome = "created" | "updated" | "unchanged";

export function readFileIfExists(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

/**
 * The only way tod writes a file. Refuses paths outside the allowlist,
 * creates parent directories, and writes atomically (temp file + rename) so a
 * failure leaves the target untouched. Reports "unchanged" instead of
 * rewriting identical content.
 */
export function writeFileAtomic(
  path: string,
  content: string,
  roots: readonly string[],
): Result<WriteOutcome, OutOfBoundsError | IoError> {
  if (!isWriteAllowed(path, roots)) {
    return Result.err(new OutOfBoundsError({ path, boundary: describeBoundary(roots) }));
  }
  const existing = readFileIfExists(path);
  if (existing === content) {
    return Result.ok("unchanged");
  }
  const temp = join(dirname(path), `.tod-write-${process.pid}-${Date.now()}.tmp`);
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(temp, content, "utf8");
    renameSync(temp, path);
  } catch (cause) {
    try {
      rmSync(temp, { force: true });
    } catch {
      // Best-effort cleanup; the original target is untouched either way.
    }
    return Result.err(
      new IoError({ path, message: cause instanceof Error ? cause.message : String(cause) }),
    );
  }
  return Result.ok(existing === null ? "created" : "updated");
}
