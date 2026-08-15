# Contract: AI Tools (`@windwise/ai`)

Both tools are server-only (`.server()` in TanStack AI, per platform TR-4); no
provider API key or unvalidated write path reaches the client. Schemas are
derived from `@windwise/schemas` via `@valibot/to-json-schema` (see research.md
§1) — this file documents the resulting contract, not a second source of truth.

## `collectAnswers`

Normalizes free-form chat input into structured criteria and reports what's
still missing.

**Input**

```ts
{
  answers: Array<{
    question_key:
      | "level"
      | "purpose"
      | "budget"
      | "age"
      | "section_preference"
      | "physical_notes";
    raw_value: string; // the visitor's free-text or selected value
  }>;
}
```

**Output**

```ts
{
  satisfied: boolean           // true once level, purpose, budget are all set
  missing: string[]            // question_keys still required
  nextQuestion: {
    key: string
    prompt_vi: string
    prompt_en: string
  } | null
}
```

**Server-side guarantees**

- Re-validates `answers` against the Valibot `CriteriaSchema` even though the
  client-side chat model already emitted structured tool-call args (FR-002, TR-4
  "not a suggestion, a guarantee").
- Persists normalized answers to `consultation_answers` with `source = 'chat'`.
- Never fabricates `nextQuestion` outside the pinned `question_set_id` for the
  session (spec FR-011 / TR-6).

## `recommendInstruments`

Runs the pure engine and returns the consumer-safe view of a recommendation.

**Input**

```ts
{
} // no arguments — reads accumulated criteria from session state
```

**Output — success**

```ts
{
  runId: string; // shareable result reference (FR-011)
  items: Array<{
    rank: number;
    family: { slug: string; name_vi: string; name_en: string };
    model: { id: string; display_name: string; model_code: string };
    reasons: string[]; // plain-language, per matched rule (FR-005)
    lastVerifiedAt: string; // ISO date (FR-009)
    sourceUrl: string;
    price: {
      scope: "msrp_global" | "vn_street";
      amountMin: number;
      amountMax: number;
      currency: "VND" | "USD";
    };
  }>;
}
```

**Output — insufficient criteria**

```ts
{
  error: 'INSUFFICIENT_CRITERIA'
  missing: string[]
}
```

**Output — no candidates survive constraints**

```ts
{
  error: "NO_MATCH";
  limitingConstraint: string; // which factor is the bottleneck (FR-013)
}
```

**Server-side guarantees**

- Blocks execution and returns `INSUFFICIENT_CRITERIA` when
  `level`/`purpose`/`budget` are not all set — this check lives here, not only
  in the system prompt (platform §5.3 guard #1).
- `items` never includes `excluded_by` or any candidate a constraint rule
  removed (TR-4's `publicView`).
- Persists the run to `recommendation_runs` + `recommendation_items` with full
  version pins before returning (TR-6).
- Output text the LLM generates around this tool result is subject to the output
  validator (research.md §5) before being shown to the visitor.

## Output Validator Contract (`output-validator.ts`)

Not a tool — a post-generation gate applied to every assistant chat message.

```ts
validate(assistantText: string, lastToolResult: unknown):
  | { ok: true }
  | { ok: false; unsourcedTokens: string[] }
```

On `ok: false`: the caller regenerates once with an explicit instruction to use
only tokens from `lastToolResult`; a second failure falls back to a templated
response built directly from `lastToolResult` (no free generation).
