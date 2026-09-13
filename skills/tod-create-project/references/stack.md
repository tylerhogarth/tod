# The paved road

Recommended defaults. Take them unless the operator asks for something else, and read the override rule in the skill body before departing from them.

Install what is current. Record no version numbers here and pin nothing in a scaffolded project unless the operator asks.

## Core: every project

| Concern | Default | Why it is on the road |
|---|---|---|
| Runtime | Bun | One tool for running, installing, and scripting. Fewer moving parts to configure and fewer ways for an agent to get it wrong. |
| Language | TypeScript | Moves correctness checks into a tool you can run and respond to, rather than into review. |
| Boundary validation | Zod | Static types describe what should arrive, not what did. Zod checks the difference at the edge, where untrusted data enters. |
| Expected failures | better-result | Makes failure modes part of the type signature, so the compiler tells you when one is unhandled. |
| Unit and integration tests | Vitest | The verification the operator cannot perform. Fast enough to run on every change. |
| Formatting and static analysis | Biome | One tool, one configuration, no per-project debate about formatting or lint rules. |
| Dead code and unused dependencies | Knip | Repeated agent iterations leave orphaned files, exports, and dependencies behind. Nothing else removes them. |

## Interface layer: visual interfaces only

| Concern | Default |
|---|---|
| Frontend framework | React |
| Frontend tooling | Vite |
| Component behaviour tests | React Testing Library |
| End-to-end flows | Playwright |

Keep end-to-end tests to a small number of flows that matter. They are the slowest and most brittle tests in the project, and a large suite of them stops being run.

## Data layer: only when data must survive a restart

| Concern | Default |
|---|---|
| Database | PostgreSQL |
| Data access | Prisma |

Prisma is on the road for a specific reason: it gives database access an explicit, typed boundary that you can inspect, reason about, and verify. Hand-written queries give you none of that.

### Local development

Use a local Prisma Postgres server for development. The operator gets a working database with no account, no sign-up, and no connection string to manage, which is the difference between a project that runs on the first attempt and one that does not.

Managed cloud hosting is an operator opt-in. Offer it only if the operator raises hosting, and never make it the default.

Recommend no deployment target. That decision is out of scope here.

## Dependency preference order

Work down this list. Stop at the first level that solves the problem well.

1. Primitives that already exist in the application.
2. Standard language capabilities.
3. Runtime built-ins.
4. Framework primitives.
5. Dependencies already present in the project.
6. A new third-party dependency.
7. A bespoke implementation.

A new dependency is justified when it materially improves correctness, type safety, validation, security, reliability, your ability to verify your own work, or when it avoids a substantial bespoke implementation.

Two failure modes to avoid, in both directions:

1. Adding a dependency for something the platform already does well.
2. Rejecting a strong foundational library because it is a dependency, and writing a worse version by hand.

Reject packages that run install scripts unless the tool cannot work without one, and say so in the project instructions when you accept one.
