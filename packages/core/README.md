# `@windwise/core`

Deterministic recommendation, compare, and upgrade logic. The LLM must not
invent instrument names, prices, specs, or scores; those decisions stay here and
in [`@windwise/db`](../db/README.md) reads.

Workflow: [AGENTS.md](../../AGENTS.md).

## Usage

```ts
import { recommend, compareModelsCore, suggestUpgrade } from "@windwise/core";
```

## Scripts

From the repo root:

```bash
vp -C packages/core test
vp -C packages/core check
```
