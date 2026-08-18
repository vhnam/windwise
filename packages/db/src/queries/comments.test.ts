import { describe, expect, it } from 'vite-plus/test';

import { createFakeWriteDb } from '#/__tests__/fake-write-db.ts';
import { addComment, listComments } from '#/queries/comments.ts';

describe('listComments', () => {
  it('returns chronological comments with author display names', async () => {
    const createdAt = new Date('2026-08-01T12:00:00.000Z');
    const { db } = createFakeWriteDb([
      [
        {
          id: 'comment-1',
          modelId: 'model-1',
          authorUserId: 'user-1',
          authorDisplayName: 'Ada',
          body: 'Looks good',
          createdAt,
        },
      ],
    ]);

    await expect(listComments(db, 'model-1')).resolves.toEqual([
      {
        id: 'comment-1',
        modelId: 'model-1',
        authorUserId: 'user-1',
        authorDisplayName: 'Ada',
        body: 'Looks good',
        createdAt: createdAt.toISOString(),
      },
    ]);
  });
});

describe('addComment', () => {
  it('denies a non-member', async () => {
    const { db, inserted } = createFakeWriteDb([[]]);
    const result = await addComment(db, 'user-1', 'org-1', 'model-1', 'Hello');
    expect(result).toEqual({ ok: false, reason: 'role-denied' });
    expect(inserted).toHaveLength(0);
  });

  it('rejects blank bodies', async () => {
    const { db, inserted } = createFakeWriteDb([]);
    const result = await addComment(db, 'user-1', 'org-1', 'model-1', '   ');
    expect(result).toEqual({ ok: false, reason: 'invalid-input' });
    expect(inserted).toHaveLength(0);
  });

  it('inserts for any org member', async () => {
    const { db, inserted } = createFakeWriteDb([[{ id: 'member-1' }], [{ name: 'Ada' }]]);
    const result = await addComment(db, 'user-1', 'org-1', 'model-1', ' Needs a source ');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      modelId: 'model-1',
      authorUserId: 'user-1',
      authorDisplayName: 'Ada',
      body: 'Needs a source',
    });
    expect(inserted).toHaveLength(1);
  });
});
