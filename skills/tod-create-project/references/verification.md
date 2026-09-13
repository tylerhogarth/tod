# Verification and invariants

Everything here is enforced by tooling rather than by instruction. Configure it once during scaffolding; it then binds every later session without anyone having to remember it.

## Two commands

Every project exposes exactly two verification commands.

| Command | Contains | When to run |
|---|---|---|
| `bun run check` | Type checking, static analysis, unit and integration tests | Constantly, while working |
| `bun run check:full` | Everything in `check`, plus the production build, end-to-end tests, and dead-code analysis | Before declaring work done, and in continuous integration |

The split exists because the fast loop is run dozens of times per session. A verification command that takes minutes stops being run, and an unrun check enforces nothing.

Never declare work complete without a passing `check:full`. Never proceed to deployment while a required check is failing, unless the operator explicitly chooses to override the guardrail after being told what it protects.

## Compiler invariants

Enable at minimum:

1. `strict`
2. `noUncheckedIndexedAccess`
3. `exactOptionalPropertyTypes`

`noUncheckedIndexedAccess` is the highest-value flag of the three for agent-written code: it turns "this array element definitely exists" from an assumption into something the compiler makes you prove.

Never weaken compiler configuration to make an error disappear. An error is information about a defect that has not surfaced yet. Correct the typing or the design instead.

## Static-analysis invariants

Configure static analysis to reject unjustified escapes from the type system:

1. Explicit `any`.
2. Non-null assertions.
3. Unchecked type assertions that discard what the compiler knows.

These rules exist so the compiler invariants above cannot be bypassed in a single character. Where an escape is genuinely correct, it should require a visible, deliberate suppression with a stated reason, not be available by default.

Put this configuration in the project. Do not restate it as prose in the project instructions: a rule that fails a build is worth more than a rule an agent has to remember.

## Testing policy

New application logic carries tests. Verification is part of completing the implementation, not a separate optional activity.

Test behaviour, not implementation:

1. Assert what the code does for its caller, not how it does it internally.
2. Do not assert on private structure, call counts, or internal ordering that no caller depends on.
3. A test that must change every time the implementation is refactored is testing the wrong thing.

Coverage is a diagnostic, not a target. Tests written to raise a number waste the operator's time and yours.

Cover component behaviour through the interface the user actually has: what appears, what happens when it is used. Keep end-to-end tests to a small number of flows that would matter if they broke.

## When verification fails

1. Read the failure. It is usually precise.
2. Fix the underlying cause.
3. Re-run the same command.
4. Only then continue.

Do not disable the check, do not delete the failing test, and do not hand obviously failing work back to the operator. If a check is genuinely wrong, say so explicitly and explain why before changing it.
