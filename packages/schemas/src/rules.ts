import * as v from 'valibot';

export const RuleKindSchema = v.picklist(['constraint', 'modifier']);
export type RuleKind = v.InferOutput<typeof RuleKindSchema>;

export const RuleTargetSchema = v.picklist(['family', 'model', 'brand']);
export type RuleTarget = v.InferOutput<typeof RuleTargetSchema>;

export type ConditionAst =
  | { op: 'equals'; field: string; value: unknown }
  | { op: 'in'; field: string; value: unknown[] }
  | { op: 'includes'; field: string; value: unknown }
  | { op: 'gte'; field: string; value: number }
  | { op: 'lte'; field: string; value: number }
  | { op: 'and'; conditions: ConditionAst[] }
  | { op: 'or'; conditions: ConditionAst[] };

const ConditionAstSchema: v.GenericSchema<ConditionAst> = v.lazy(() =>
  v.union([
    v.object({ op: v.literal('equals'), field: v.string(), value: v.unknown() }),
    v.object({ op: v.literal('in'), field: v.string(), value: v.array(v.unknown()) }),
    v.object({ op: v.literal('includes'), field: v.string(), value: v.unknown() }),
    v.object({ op: v.literal('gte'), field: v.string(), value: v.number() }),
    v.object({ op: v.literal('lte'), field: v.string(), value: v.number() }),
    v.object({ op: v.literal('and'), conditions: v.array(ConditionAstSchema) }),
    v.object({ op: v.literal('or'), conditions: v.array(ConditionAstSchema) }),
  ]),
);

export { ConditionAstSchema };

export const RuleEffectSchema = v.union([
  v.object({ type: v.literal('score'), delta: v.number() }),
  v.object({ type: v.literal('exclude'), reasonKey: v.string() }),
  v.object({ type: v.literal('require'), reasonKey: v.string() }),
]);
export type RuleEffect = v.InferOutput<typeof RuleEffectSchema>;

export const RuleSchema = v.object({
  id: v.string(),
  kind: RuleKindSchema,
  target: RuleTargetSchema,
  condition: ConditionAstSchema,
  effect: RuleEffectSchema,
  reasonTemplateVi: v.string(),
  reasonTemplateEn: v.string(),
});
export type Rule = v.InferOutput<typeof RuleSchema>;

export const RuleSetSchema = v.object({
  ruleSetId: v.string(),
  rules: v.array(RuleSchema),
});
export type RuleSet = v.InferOutput<typeof RuleSetSchema>;
