import { Result, TaggedError } from "better-result";

export const BLOCK_BEGIN =
  "<!-- tod:begin (managed by tod; do not edit between markers, run `tod sync` to repair) -->";
export const BLOCK_END = "<!-- tod:end -->";

export class MalformedMarkersError extends TaggedError("MalformedMarkers")<{
  path: string;
  message: string;
}> {}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

/**
 * Pure content transform: returns the file content with tod's block present
 * exactly once. Appends the block when absent; replaces only what sits
 * between the markers when present. Anything unexpected (unbalanced or
 * duplicated markers) is an error so callers stop without writing.
 */
export function upsertBlock(
  existing: string | null,
  body: string,
  path: string,
): Result<string, MalformedMarkersError> {
  const block = `${BLOCK_BEGIN}\n${body.trimEnd()}\n${BLOCK_END}\n`;
  if (existing === null || existing.trim() === "") {
    return Result.ok(block);
  }
  const begins = countOccurrences(existing, BLOCK_BEGIN);
  const ends = countOccurrences(existing, BLOCK_END);
  if (begins === 0 && ends === 0) {
    const separator = existing.endsWith("\n") ? "\n" : "\n\n";
    return Result.ok(`${existing}${separator}${block}`);
  }
  if (begins !== 1 || ends !== 1) {
    return Result.err(
      new MalformedMarkersError({
        path,
        message: `expected exactly one tod marker pair, found ${begins} begin and ${ends} end markers`,
      }),
    );
  }
  const beginIndex = existing.indexOf(BLOCK_BEGIN);
  const endIndex = existing.indexOf(BLOCK_END);
  if (endIndex < beginIndex) {
    return Result.err(
      new MalformedMarkersError({
        path,
        message: "tod end marker appears before the begin marker",
      }),
    );
  }
  const before = existing.slice(0, beginIndex);
  const after = existing.slice(endIndex + BLOCK_END.length).replace(/^\n/, "");
  return Result.ok(`${before}${block}${after}`);
}

/** Returns the body between tod's markers, or null when no block exists. */
export function extractBlock(content: string): string | null {
  const beginIndex = content.indexOf(BLOCK_BEGIN);
  const endIndex = content.indexOf(BLOCK_END);
  if (beginIndex === -1 || endIndex === -1 || endIndex < beginIndex) {
    return null;
  }
  return content.slice(beginIndex + BLOCK_BEGIN.length, endIndex).trim();
}
