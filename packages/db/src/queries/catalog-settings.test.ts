import { describe, expect, it } from 'vite-plus/test';

import { createFakeWriteDb } from '#/__tests__/fake-write-db.ts';
import { getCatalogSettings, updateCatalogSettings } from '#/queries/catalog-settings.ts';

describe('getCatalogSettings', () => {
  it('defaults to 180 days when no settings row exists', async () => {
    const { db } = createFakeWriteDb([[]]);
    await expect(getCatalogSettings(db, 'org-1')).resolves.toEqual({ stalenessThresholdDays: 180 });
  });
});

describe('updateCatalogSettings', () => {
  it('denies an editor', async () => {
    const { db } = createFakeWriteDb([[{ role: 'editor' }]]);
    const result = await updateCatalogSettings(db, 'user-1', 'org-1', 90);
    expect(result).toEqual({ ok: false, reason: 'role-denied' });
  });

  it('allows an owner to upsert the threshold', async () => {
    const { db, inserted } = createFakeWriteDb([[{ role: 'owner' }]]);
    const result = await updateCatalogSettings(db, 'user-1', 'org-1', 90);
    expect(result).toEqual({ ok: true, value: { stalenessThresholdDays: 90 } });
    expect(inserted).toHaveLength(1);
  });
});
