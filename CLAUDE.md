# Claude

Follow [AGENTS.md](./AGENTS.md). That file is the shared operating contract for
Claude and Cursor. Do not duplicate or override it here.

Claude-specific entry points:

- Spec Kit skills: `.claude/skills/speckit-*` (`/speckit-specify`,
  `/speckit-clarify`, `/speckit-plan`)
- Open-SPDD commands: `.claude/commands/spdd-*.md` (`/spdd-analysis`,
  `/spdd-reasons-canvas`, `/spdd-generate`, `/spdd-prompt-update`, `/spdd-sync`)

Spec Kit stops after `/speckit-plan` unless the user explicitly asks for
`/speckit-tasks`.
