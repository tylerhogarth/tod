# Contributor documentation

These pages explain how tod is built, for someone changing it. The operator-facing story is in the top-level README, and the rules an agent must follow while editing this repository are in `AGENTS.md`. This folder explains why those rules exist and where in the code they are enforced.

Read in this order:

1. [Architecture](architecture.md): what happens on `tod init`, how a command turns into a file write, and where state lives.
2. [Core rules](core-rules.md): the invariants tod never breaks, why each exists, and the module and test that enforce it.
3. [Templates and skills](templates-and-skills.md): the instruction block tod installs, the seed files it creates, the onboarding script, and the `tod-create-project` skill with its project template.
4. [Extending tod](extending.md): adding a command, supporting another agent, publishing a skill, changing the block, and cutting a release.

## The one-paragraph version

tod is a small CLI that agents run, not people. `tod init` appends one delimited marker block to each coding agent's global instruction file and creates `~/.tod/` for state. The block tells the agent how to behave for a non-technical operator and which `tod` commands to use for work tracking. Anything that must happen inside an operator's project is published as an agent skill and done by the agent, because tod itself never writes outside `~/.agents/`, `~/.claude/`, and `~/.tod/`.
