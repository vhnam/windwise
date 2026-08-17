import { describe, expect, it } from 'vite-plus/test';

import { createFakeWriteDb } from '#/__tests__/fake-write-db.ts';
import {
  archiveInstrumentModel,
  createInstrumentModel,
  editInstrumentModel,
  transitionInstrumentModel,
} from '#/queries/catalog-write.ts';

const MODEL_ROW = {
  id: 'model-1',
  brandId: 'brand-1',
  familyId: 'family-1',
  modelCode: 'X-1',
  displayName: 'Model X-1',
  levelTier: 'student' as const,
  status: 'draft' as const,
  lastVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
  variantOfModelId: null,
  dataCompleteness: 0,
  verifiedByUserId: null,
  reviewNotes: null,
  version: 1,
};

describe('createInstrumentModel', () => {
  it('creates a draft record and writes a create audit entry when the actor is an editor', async () => {
    const { db, inserted } = createFakeWriteDb([[{ role: 'editor' }]]);
    const result = await createInstrumentModel(db, 'user-1', 'org-1', {
      brandId: 'brand-1',
      familyId: 'family-1',
      modelCode: 'X-1',
      displayName: 'Model X-1',
      levelTier: 'student',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('draft');
    }
    expect(inserted).toHaveLength(2);
  });

  it('denies creation for a viewer', async () => {
    const { db } = createFakeWriteDb([[{ role: 'viewer' }]]);
    const result = await createInstrumentModel(db, 'user-1', 'org-1', {
      brandId: 'brand-1',
      familyId: 'family-1',
      modelCode: 'X-1',
      displayName: 'Model X-1',
      levelTier: 'student',
    });
    expect(result).toEqual({ ok: false, reason: 'role-denied' });
  });

  it('denies creation for a user with no role assignment (revoked role)', async () => {
    const { db } = createFakeWriteDb([[]]);
    const result = await createInstrumentModel(db, 'user-1', 'org-1', {
      brandId: 'brand-1',
      familyId: 'family-1',
      modelCode: 'X-1',
      displayName: 'Model X-1',
      levelTier: 'student',
    });
    expect(result).toEqual({ ok: false, reason: 'role-denied' });
  });
});

describe('editInstrumentModel', () => {
  it('rejects a stale expectedVersion with a conflict, not a silent overwrite', async () => {
    const { db, updated } = createFakeWriteDb([[{ role: 'editor' }], [{ ...MODEL_ROW, version: 2 }]]);
    const result = await editInstrumentModel(db, 'user-1', 'org-1', 'model-1', 1, { displayName: 'New name' });
    expect(result).toEqual({ ok: false, reason: 'conflict', currentVersion: 2 });
    expect(updated).toHaveLength(0);
  });

  it('applies the patch and writes an edit audit entry on a matching version', async () => {
    const { db, updated, inserted } = createFakeWriteDb([
      [{ role: 'editor' }],
      [MODEL_ROW],
      [], // no current price
      [], // no primary image
      [], // no source
    ]);
    const result = await editInstrumentModel(db, 'user-1', 'org-1', 'model-1', 1, { displayName: 'New name' });
    expect(result.ok).toBe(true);
    expect(updated).toHaveLength(1);
    expect(inserted).toHaveLength(1);
  });
});

describe('transitionInstrumentModel', () => {
  it('blocks publish when required fields are missing and identifies them', async () => {
    const inReview = { ...MODEL_ROW, status: 'in_review' as const };
    const { db, updated } = createFakeWriteDb([
      [{ role: 'reviewer' }],
      [inReview],
      [], // no current price
      [], // no primary image
      [], // no source
    ]);
    const result = await transitionInstrumentModel(db, 'user-1', 'org-1', 'model-1', 1, 'published');
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === 'missing-fields') {
      expect(result.fields).toContain('price');
      expect(result.fields).toContain('primaryImage');
      expect(result.fields).toContain('source');
    }
    expect(updated).toHaveLength(0);
  });

  it('denies an editor attempting to publish directly', async () => {
    const inReview = { ...MODEL_ROW, status: 'in_review' as const };
    const { db } = createFakeWriteDb([[{ role: 'editor' }], [inReview]]);
    const result = await transitionInstrumentModel(db, 'user-1', 'org-1', 'model-1', 1, 'published');
    expect(result).toEqual({ ok: false, reason: 'role-denied' });
  });

  it('allows a reviewer to request changes with a note, captured in reviewNotes', async () => {
    const inReview = { ...MODEL_ROW, status: 'in_review' as const };
    const { db, updated } = createFakeWriteDb([[{ role: 'reviewer' }], [inReview]]);
    const result = await transitionInstrumentModel(db, 'user-1', 'org-1', 'model-1', 1, 'draft', 'Please fix pricing.');
    expect(result.ok).toBe(true);
    expect(updated[0]?.set).toMatchObject({ status: 'draft', reviewNotes: 'Please fix pricing.' });
  });
});

describe('archiveInstrumentModel', () => {
  it('produces exactly one audit entry with the archive action', async () => {
    const published = { ...MODEL_ROW, status: 'published' as const };
    const { db, inserted } = createFakeWriteDb([[{ role: 'reviewer' }], [published]]);
    const result = await archiveInstrumentModel(db, 'user-1', 'org-1', 'model-1', 1);
    expect(result.ok).toBe(true);
    expect(inserted).toHaveLength(1);
  });
});
