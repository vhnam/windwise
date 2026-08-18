# `@windwise/ai`

Consultation tools and LLM adapter for the consumer app. Interprets language
into structured criteria and explains results; ranking and catalog facts come
from [`@windwise/core`](../core/README.md) and
[`@windwise/db`](../db/README.md).

Workflow: [AGENTS.md](../../AGENTS.md).

## Setup

```bash
cp packages/ai/.env.example packages/ai/.env.local
```

Set `OPENAI_API_KEY` for tests that call the provider. The consumer app also
reads API keys from its own `.env.local`.

## Usage

```ts
import {
  createConsultationTools,
  createConsultationAdapter,
} from "@windwise/ai";
```

Tool defs (no runtime) are at `@windwise/ai/tool-defs`.

## Scripts

From the repo root:

```bash
vp -C packages/ai test
vp -C packages/ai check
```
