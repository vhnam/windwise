import { describe, expect, it } from 'vite-plus/test';

import { createFakeWriteDb } from '#/__tests__/fake-write-db.ts';
import { getAuditTrail } from '#/queries/audit-trail.ts';

describe('getAuditTrail', () => {
  it('joins the actor display name from the user table', async () => {
    const { db } = createFakeWriteDb([
      [
        {
          actorUserId: 'user-1',
          actorDisplayName: 'Ada Reviewer',
          action: 'edit',
          at: new Date('2026-01-02T00:00:00.000Z'),
          before: { displayName: 'Old' },
          after: { displayName: 'New' },
        },
      ],
    ]);

    const entries = await getAuditTrail(db, 'instrument_model', 'model-1');
    expect(entries).toEqual([
      {
        actorUserId: 'user-1',
        actorDisplayName: 'Ada Reviewer',
        action: 'edit',
        at: '2026-01-02T00:00:00.000Z',
        diff: [{ field: 'displayName', before: 'Old', after: 'New' }],
      },
    ]);
  });
});
