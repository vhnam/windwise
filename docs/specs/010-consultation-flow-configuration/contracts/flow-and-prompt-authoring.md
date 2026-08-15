# Contract: Question Flow & Prompt Version Server Functions (`apps/manager-dashboard`)

Same role-gated, audited-write pattern as 008/009 — `can-transition.ts`-style
role check + same-transaction audit entry via 008's `writeAuditEntry`.

## `saveDraftQuestion`

```ts
input: {
  questionSetId: string    // must be status = 'draft'
  question: {
    id?: string
    key: string
    sortOrder: number
    type: 'single' | 'multi' | 'number' | 'range' | 'free_text'
    promptVi: string; promptEn: string; helpVi?: string; helpEn?: string
    required: boolean
    visibleWhen?: Condition        // same AST shape as 009
    options?: Array<{ labelVi: string; labelEn: string; sortOrder: number; domainPath: string }>
  }
}
output: { questionId: string } | { error: 'INVALID_AST'; issue: string }
```

Requires role `editor` or above.

## `removeQuestionOption`

```ts
input: { optionId: string; confirmed?: boolean }
output:
  | { status: 'ok' }
  | { warning: 'RULE_DEPENDENCY'; affectedRuleIds: string[] }   // returned when confirmed is not true (spec FR-009)
```

Requires role `editor` or above. Calling again with `confirmed: true` proceeds
despite the warning.

## `publishQuestionSet`

```ts
input: { questionSetId: string; note?: string }
output:
  | { status: 'ok'; publishedVersion: number }
  | { error: 'VALIDATION_FAILED'; issues: Array<{ questionId: string; issue: string }> }
```

Requires role `reviewer` or above. New consultation sessions created after this
call pin to the new version; sessions already in progress keep their original
pin (spec FR-004) — enforced by `ConsultationSession.question_ set_id` being set
once at session creation and never re-read from "current published," per 005's
original design.

## `previewQuestionSet`

```ts
input: {
  questionSetId: string;
} // draft or published
output: {
  steps: ReplaySession["steps"];
} // see data-model.md, never persisted
```

Readable by role `editor` and above.

## `saveDraftPromptVersion` / `markExperimental` / `publishPromptVersion` / `rollbackPromptVersion`

Mirror 009's `saveDraftRule`/`publishRuleSet`/`rollbackToVersion` shape exactly,
substituting `PromptVersion` for `RuleSet`:

```ts
saveDraftPromptVersion(input: { key: string; content: string })
  -> { promptVersionId: string }

markExperimental(input: { promptVersionId: string })
  -> { status: 'ok' }

publishPromptVersion(input: { promptVersionId: string })
  -> { status: 'ok'; publishedVersion: number }

rollbackPromptVersion(input: { targetPromptVersionId: string })
  -> { status: 'ok'; newPromptVersionId: string; publishedVersion: number }
```

`publishPromptVersion`/`rollbackPromptVersion` require role `reviewer` or above;
`saveDraftPromptVersion`/`markExperimental` require `editor` or above.

## `replayConsultation`

```ts
input: { sessionId: string; againstPromptVersionId: string }   // must be status = 'experimental' or 'published'
output: { original: ReplaySession['originalTranscript']; replayed: ChatTurn[] }
```

Requires role `editor` or above. Guaranteed not to write to
`consultation_sessions`, `consultation_answers`, `recommendation_runs`, or
`conversation_logs` for the original session (spec FR-011) — verified by the
integration test in plan.md's Testing section.
