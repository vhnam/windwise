import { describe, expect, it } from 'vite-plus/test';

import type { LifecycleStatus, Role } from '@windwise/schemas';

import { canTransition } from './can-transition.ts';

const ROLES: Role[] = ['owner', 'admin', 'editor', 'reviewer', 'viewer'];

const LEGAL: Array<{ from: LifecycleStatus; to: LifecycleStatus; minRole: Role }> = [
  { from: 'draft', to: 'in_review', minRole: 'editor' },
  { from: 'in_review', to: 'published', minRole: 'reviewer' },
  { from: 'in_review', to: 'draft', minRole: 'reviewer' },
  { from: 'published', to: 'archived', minRole: 'reviewer' },
  { from: 'archived', to: 'draft', minRole: 'admin' },
];

const RANK: Record<Role, number> = { viewer: 0, editor: 1, reviewer: 2, admin: 3, owner: 3 };

describe('canTransition', () => {
  for (const transition of LEGAL) {
    for (const role of ROLES) {
      const shouldAllow = RANK[role] >= RANK[transition.minRole];
      it(`${transition.from} -> ${transition.to} as ${role} is ${shouldAllow ? 'allowed' : 'denied'}`, () => {
        const result = canTransition(role, transition.from, transition.to);
        expect(result.allowed).toBe(shouldAllow);
        if (!result.allowed) {
          expect(result.reason).toBe('role');
        }
      });
    }
  }

  it('rejects an illegal transition regardless of role', () => {
    const result = canTransition('owner', 'draft', 'published');
    expect(result).toEqual({ allowed: false, reason: 'illegal-transition' });
  });
});
