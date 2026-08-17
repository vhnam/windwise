import * as v from 'valibot';

import { ModelStatusSchema } from './catalog.ts';

export const RoleSchema = v.picklist(['owner', 'admin', 'editor', 'reviewer', 'viewer']);
export type Role = v.InferOutput<typeof RoleSchema>;

export const AuditActionSchema = v.picklist(['create', 'edit', 'status_transition', 'archive']);
export type AuditAction = v.InferOutput<typeof AuditActionSchema>;

export const QueueReasonSchema = v.variant('type', [
  v.object({
    type: v.literal('stale'),
    lastVerifiedAt: v.string(),
    daysOverThreshold: v.number(),
  }),
  v.object({
    type: v.literal('missing_fields'),
    fields: v.array(v.string()),
  }),
  v.object({
    type: v.literal('broken_source'),
    sourceUrl: v.string(),
    lastCheckedAt: v.string(),
  }),
]);
export type QueueReason = v.InferOutput<typeof QueueReasonSchema>;

export const VerificationQueueItemSchema = v.object({
  modelId: v.string(),
  displayName: v.string(),
  reasons: v.array(QueueReasonSchema),
});
export type VerificationQueueItem = v.InferOutput<typeof VerificationQueueItemSchema>;

export const AuditDiffEntrySchema = v.object({
  field: v.string(),
  before: v.any(),
  after: v.any(),
});
export type AuditDiffEntry = v.InferOutput<typeof AuditDiffEntrySchema>;

export const AuditTrailEntrySchema = v.object({
  actorUserId: v.string(),
  actorDisplayName: v.string(),
  action: AuditActionSchema,
  at: v.string(),
  diff: v.array(AuditDiffEntrySchema),
});
export type AuditTrailEntry = v.InferOutput<typeof AuditTrailEntrySchema>;

export const LifecycleStatusSchema = ModelStatusSchema;
export type LifecycleStatus = v.InferOutput<typeof LifecycleStatusSchema>;

export type TransitionResult = { allowed: true } | { allowed: false; reason: 'role' | 'illegal-transition' };

export type WriteError =
  | { ok: false; reason: 'conflict'; currentVersion: number }
  | { ok: false; reason: 'role-denied' }
  | { ok: false; reason: 'missing-fields'; fields: string[] };

export type WriteResult<T> = { ok: true; value: T } | WriteError;
