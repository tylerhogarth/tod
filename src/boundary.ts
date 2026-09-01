import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve, sep } from "node:path";

/**
 * tod runs on the machines of non-technical operators. Every filesystem write
 * must stay inside an explicit allowlist of roots; this module is the single
 * source of truth for that allowlist and the containment check. No command may
 * write to disk without passing through it.
 */

export function defaultAllowedRoots(home: string = homedir()): readonly string[] {
  return [resolve(home, ".agents"), resolve(home, ".claude"), resolve(home, ".tod")];
}

/**
 * Symlinks must not let a write escape the allowlist, so containment is
 * checked against the real path. For not-yet-existing targets, the deepest
 * existing ancestor is resolved and the remaining segments appended.
 */
function toRealPath(path: string): string {
  let existing = resolve(path);
  const remainder: string[] = [];
  while (!existsSync(existing)) {
    const parent = dirname(existing);
    if (parent === existing) {
      break;
    }
    remainder.unshift(existing.slice(parent.length + 1));
    existing = parent;
  }
  const real = existsSync(existing) ? realpathSync(existing) : existing;
  return remainder.length === 0 ? real : [real, ...remainder].join(sep);
}

/**
 * True when `path` (after symlink resolution) is inside one of `roots`.
 * Callers treat `false` as: stop, change nothing, report the boundary in the
 * error fix.
 */
export function isWriteAllowed(path: string, roots: readonly string[]): boolean {
  const target = toRealPath(path);
  return roots.some((root) => {
    const realRoot = toRealPath(root);
    return target === realRoot || target.startsWith(realRoot + sep);
  });
}

/** Human/agent-readable description of the boundary, for error messages. */
export function describeBoundary(roots: readonly string[]): string {
  return roots.join(", ");
}
