---
name: tod-create-project
description: Use when the operator asks to build something new, start a new app, create a new project, or scaffold a codebase from scratch. Also use when the operator asks to refactor, modernise, or bring an existing project onto tod's engineering standard, or to add verification commands or project instruction files to a project that lacks them. Do not use for ordinary feature work or bug fixes in an existing project.
metadata:
  author: tod
  version: 2026.9.8
license: MIT
---

# Put a project on the paved road

Scaffold a new project, or bring an existing one, onto a known-good engineering stack; give it deterministic verification; and write project instructions the next session will read. Most uses are new projects. The refactor mode exists so the same standard reaches projects that predate it.

The operator is non-technical. They describe outcomes; you make the engineering decisions and explain only what changes what the product does for its users.

## Pre-conditions

Halt and redirect if the operator asked for ordinary feature work or a bug fix in an existing project. Handle that as normal work; this skill sets up the engineering foundation, it does not build features.

Otherwise decide which mode applies, and say so explicitly to the operator before you start:

1. New project. The working directory is empty or has no source code. The workflow below applies as written.
2. Refactor of an existing project. The working directory already has source code. State plainly that you are bringing an existing project onto the paved road, not building something new. Keep every existing behaviour working: add tooling and configuration around the code, run the existing tests at each step, and change application code only where an invariant fails against it. Where the project already has a working choice for a layer (a test runner, a linter, a data layer), keep it and record it under operator decisions rather than replacing it. Do not delete or rewrite files you did not create in this session without saying what and why first.

## Principle

**Instructions define workflow and intent. Tooling enforces engineering invariants.**

Never solve with prose what a compiler, linter, test, or script can decide. When you are tempted to write a rule into the project instructions, ask whether configuration could fail the build instead. Prefer the configuration.

## Workflow

### 1. Understand what the operator wants

Establish, in the operator's own terms:

1. What the thing does, and who uses it.
2. Whether it stores data that must survive a restart.
3. Whether it has a visual interface, or is a service or command-line tool.

Ask no more than the tod harness's configured requirement-gathering level allows, and pair every question with a recommendation the operator can react to. Do not ask the operator to choose tools. That is your job.

### 2. Choose the layers

The paved road has a core that every project takes, plus layers you add only when the answers above call for them. Read `references/stack.md` for the tools, the rationale, and the dependency preference order.

Take the core always. Add the interface layer only for a visual interface. Add the data layer only when data must survive a restart. Adding a layer the project does not need is a cost the operator pays forever.

### 3. Scaffold

Work out the current installation steps for each tool yourself. Do not rely on remembered commands: check each tool's current documentation or CLI help before running anything, because install commands and package names change between releases.

Never pin versions unless the operator asks. Install what is current.

Order the work so that generated configuration does not overwrite yours:

1. Create the project directory and initialise version control first. In refactor mode, start from a clean working tree on a new branch instead, so every change is reviewable and reversible.
2. Run each tool's own initialiser next. Several of them write or rewrite shared configuration.
3. Apply the invariants in `references/verification.md` last, so your settings win.

### 4. Write the project instructions

Copy `assets/project-agents.template.md` into the project root as `AGENTS.md` and fill in every placeholder. In refactor mode, if an `AGENTS.md` or `CLAUDE.md` already exists, merge the template's sections into it and keep every existing instruction; do not overwrite it. Then create `CLAUDE.md` as a symbolic link to `AGENTS.md`, so every agent family reads one file and the two can never disagree.

If the environment cannot create symbolic links, write `CLAUDE.md` as a one-line file pointing at `AGENTS.md` and note in `AGENTS.md` that the two files must be kept in step.

Remove every unfilled placeholder before you finish. A template marker left in the file is a defect.

### 5. Verify before you claim anything

Run the project's full verification. It must pass on the empty scaffold, before any feature work, or the scaffold is wrong.

If verification fails, fix it. Do not hand failing work back to the operator, and do not weaken configuration to make an error disappear. Correct the underlying typing or design issue instead.

### 6. Report

Tell the operator what now exists and what they can do next, in their terms. Name no tools unless they ask. If you departed from the paved road, say so in one sentence with the consequence.

## Rules that outlive the scaffold

These belong in the project instructions and govern every later session.

### Verification is part of implementation

Implementation is not complete until verification passes. Run the fast check constantly while working and the full check before declaring anything done. New application logic carries tests that validate behaviour, not implementation detail. Tests written only to raise a coverage number are waste, and tests that restate the implementation break on every refactor without ever catching a defect.

### Dependencies

Prefer what is already there. Work down the preference order in `references/stack.md` before reaching for something new. This is a preference, not a prohibition: take a dependency when it materially improves correctness, type safety, validation, security, reliability, or your ability to verify your own work. Do not reject a strong foundational library merely for being a dependency, and do not accumulate small ones the platform already covers.

### Operator overrides

The paved road eliminates accidental complexity. It does not override the operator's agency.

When the operator asks for something that departs materially from it:

1. Say so once, in plain language, before you build.
2. State the consequence in terms of what it costs them later.
3. Follow their decision.
4. Record the decision and its reason in the project `AGENTS.md`, so no later session re-argues it.

Do not fight the operator, and do not raise the same objection twice.

## References

1. `references/stack.md`: the recommended tools, why each is on the road, and the dependency preference order.
2. `references/verification.md`: the verification commands, the compiler and static-analysis invariants, and the testing policy.
3. `assets/project-agents.template.md`: the project instruction template.
