import { randomUUID } from 'node:crypto';

import { and, asc, eq } from 'drizzle-orm';

import type { CommentListItem, WriteResult } from '@windwise/schemas';

import type { Database } from '#/client.ts';
import { comments, organizationMembers, user } from '#/schema/index.ts';

async function isOrgMember(db: Database, actorUserId: string, orgId: string): Promise<boolean> {
  const [member] = await db
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.userId, actorUserId), eq(organizationMembers.organizationId, orgId)))
    .limit(1);
  return Boolean(member);
}

export async function listComments(db: Database, modelId: string): Promise<CommentListItem[]> {
  const rows = await db
    .select({
      id: comments.id,
      modelId: comments.modelId,
      authorUserId: comments.authorUserId,
      authorDisplayName: user.name,
      body: comments.body,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .leftJoin(user, eq(comments.authorUserId, user.id))
    .where(eq(comments.modelId, modelId))
    .orderBy(asc(comments.createdAt));

  return rows.map((row) => ({
    id: row.id,
    modelId: row.modelId,
    authorUserId: row.authorUserId,
    authorDisplayName: row.authorDisplayName || row.authorUserId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function addComment(
  db: Database,
  actorUserId: string,
  orgId: string,
  modelId: string,
  body: string,
): Promise<WriteResult<CommentListItem>> {
  const trimmed = body.trim();
  if (!trimmed) {
    return { ok: false, reason: 'invalid-input' };
  }

  const member = await isOrgMember(db, actorUserId, orgId);
  if (!member) {
    return { ok: false, reason: 'role-denied' };
  }

  const id = randomUUID();
  const createdAt = new Date();

  await db.insert(comments).values({
    id,
    modelId,
    authorUserId: actorUserId,
    body: trimmed,
    createdAt,
  });

  const [author] = await db.select({ name: user.name }).from(user).where(eq(user.id, actorUserId)).limit(1);

  return {
    ok: true,
    value: {
      id,
      modelId,
      authorUserId: actorUserId,
      authorDisplayName: author?.name || actorUserId,
      body: trimmed,
      createdAt: createdAt.toISOString(),
    },
  };
}
