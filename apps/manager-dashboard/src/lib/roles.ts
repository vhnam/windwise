import type { Role } from '@windwise/schemas';

const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  editor: 1,
  reviewer: 2,
  admin: 3,
  owner: 3,
};

export function hasMinRole(role: Role | null | undefined, minimum: Role): boolean {
  if (!role) {
    return false;
  }
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}
