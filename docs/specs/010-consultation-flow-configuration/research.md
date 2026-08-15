# Phase 0 Research: Consultation Question Flow & Prompt Version Management

## 1. Reusing the rule-condition AST for `visible_when`

**Decision**: A question's `visible_when` condition uses the exact same
closed-operator AST shape and Valibot validator 009 built (`ast-schema.ts`),
evaluated against previously answered criteria in the session rather than
against catalog entities.

**Rationale**: Both are "evaluate a small boolean expression against known
fields, safely, without `eval`" problems — platform plan explicitly notes
`visible_when` "jsonb, same AST as rules" in §3.6's schema definition, so this
isn't a coincidental similarity, it's the platform's own stated design. Reusing
the validator avoids a second closed-operator implementation that could drift
from 009's (e.g., supporting a different operator set by accident).

**Alternatives considered**: A simpler boolean-only visibility flag (no
conditions, just show/hide toggles per question) — rejected; spec FR-002
requires conditions evaluated against _previous answers_ (e.g., only ask about
braces if level = beginner), which a flat toggle cannot express.

## 2. Prompt version storage and testing surface

**Decision**: `prompt_versions` stores the full prompt text/config per version
(platform §3.6's shape:
`key, version, status, content, created_by, published_at`). The "experimental"
status makes a version usable by the prompt playground and by 011's nightly
conversational eval sampling, but never by live consumer traffic — enforced by
`@windwise/ai`'s tool-loading code reading only the single `published` row for
the active session's locale/key, mirroring 009's published-rule-set-cache read
pattern but keyed by prompt `key` rather than a single global row.

**Rationale**: Spec FR-005 requires draft/experimental to have zero live effect;
using the same enum-gated "only published is ever read by the live path" pattern
009 established for rule sets keeps the mental model consistent for whoever
maintains both features later.

**Alternatives considered**: A/B-serving experimental versions to a sampled
slice of live traffic — explicitly out of scope; spec FR-005 and platform §2.3
frame conversational evaluation as "nightly or on prompt change, on a sampled
subset" for _evaluation_ purposes (011's concern), not as a live-traffic
experimentation mechanism this feature must build.

## 3. Warning before removing a rule-referenced question option

**Decision**: `question-set-write.ts`'s remove-option path calls into 009's
`rules` table (`@windwise/db`) to check whether any `enabled` rule's `condition`
references the option's `domain_path` (e.g., `purpose.jazz`), and if so, returns
a warning requiring explicit confirmation rather than silently blocking or
silently allowing.

**Rationale**: Spec FR-009 requires a warning, not a hard block — a manager may
legitimately want to remove an option and update the dependent rule together;
the constitution's Code Quality principle disfavors hidden cross-package
coupling, so this dependency on 009's rule data is made explicit here rather
than left as an undocumented assumption.

**Alternatives considered**: Hard-blocking removal until no rule references the
option — rejected, over-constrains a manager who intends to update both together
and creates a chicken-and-egg editing sequence the spec doesn't ask for (FR-009
says "warn," not "block").

## 4. Preview and replay as strictly non-persisting operations

**Decision**: `preview.tsx`'s walkthrough and `replay.tsx`'s past- consultation
replay both call the same underlying question-flow/prompt logic the live
consumer flow uses, but through a code path that takes an explicit
`persist: false` flag threaded down to every write call (`saveAnswers`,
`persistRun`, `writeAuditEntry`-adjacent conversation logging) — never a
separate, parallel non-persisting reimplementation of the flow logic.

**Rationale**: Spec FR-010/FR-011 and SC-005 require zero consumer-facing-
analytics footprint from preview/replay, but also require preview to behave like
the real flow (conditional visibility must work identically) — a flag threaded
through the same code path guarantees behavioral parity by construction, whereas
a separate preview-only reimplementation could silently diverge from live
behavior (e.g., a conditional-visibility bug that only preview catches, or vice
versa, would be worse than useless).

**Alternatives considered**: A fully separate "simulation engine" — rejected for
the parity risk above; the goal of a preview is specifically to catch what live
behavior will actually do.

## 5. Rollback mechanics for prompt versions

**Decision**: Mirrors 009's research.md §5 exactly — "publish a previous
version" creates a new `prompt_versions` row copied from the target historical
version's content, then publishes that new row; the historical row itself is
never mutated or re-activated in place.

**Rationale**: Same TR-6 traceability requirement 009 relied on —
`recommendation_runs.prompt_version_id` (and, for pure chat turns,
`conversation_logs`) must always point at an immutable version identity.
Applying the identical mechanic 009 already validated (rather than inventing a
second rollback strategy) keeps the two version-pinned entities in this feature
and 009 behaviorally consistent, which matters because both feed the same
`recommendation_runs` row (platform §3.6).

**Alternatives considered**: None beyond what 009 already considered and
rejected (research.md §5 there) — no new alternative is introduced by applying
the same pattern to a second entity type.
