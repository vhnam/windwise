import type { LifecycleStatus, Role, TransitionResult } from '@windwise/schemas';

const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  editor: 1,
  reviewer: 2,
  admin: 3,
  owner: 3,
};

type Transition = { from: LifecycleStatus; to: LifecycleStatus; minRole: Role };

const LEGAL_TRANSITIONS: Transition[] = [
  { from: 'draft', to: 'in_review', minRole: 'editor' },
  { from: 'in_review', to: 'published', minRole: 'reviewer' },
  { from: 'in_review', to: 'draft', minRole: 'reviewer' },
  { from: 'published', to: 'archived', minRole: 'reviewer' },
  { from: 'archived', to: 'draft', minRole: 'admin' },
];

export function canTransition(
  actorRole: Role,
  currentStatus: LifecycleStatus,
  targetStatus: LifecycleStatus,
): TransitionResult {
  const transition = LEGAL_TRANSITIONS.find(
    (candidate) => candidate.from === currentStatus && candidate.to === targetStatus,
  );
  if (!transition) {
    return { allowed: false, reason: 'illegal-transition' };
  }

  if (ROLE_RANK[actorRole] < ROLE_RANK[transition.minRole]) {
    return { allowed: false, reason: 'role' };
  }

  return { allowed: true };
}
