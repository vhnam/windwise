import { useQuery } from '@tanstack/react-query';
import { getRouteApi, useRouter } from '@tanstack/react-router';
import { useState } from 'react';

import { toast } from '@windwise/ui/components/toast';

import { createInstrumentRecordFn, editInstrumentRecordFn, transitionStatusFn } from '#/lib/server/catalog';
import { getBrandsQueryOptions } from '#/queries/brand';
import { getFamiliesQueryOptions } from '#/queries/family';
import type { CatalogEditSchemaType } from '#/schemas/catalog-edit.schema';

import { STATUS_LABEL } from '../catalog-status';

const toRelatedInput = (payload: CatalogEditSchemaType) => {
  const amountMin = Number(payload.priceAmountMin);
  const amountMax = Number(payload.priceAmountMax || payload.priceAmountMin);
  const price =
    payload.priceScope && payload.priceAmountMin !== '' && Number.isFinite(amountMin)
      ? {
          scope: payload.priceScope,
          amountMin,
          amountMax: Number.isFinite(amountMax) ? amountMax : amountMin,
        }
      : undefined;
  const primaryImage =
    payload.imageUrl && payload.imageAltEn
      ? {
          url: payload.imageUrl,
          altEn: payload.imageAltEn,
          credit: payload.imageCredit || 'Catalog editor',
        }
      : undefined;
  const source =
    payload.sourceKind && payload.sourceUrl && payload.sourcePublisher
      ? {
          kind: payload.sourceKind,
          url: payload.sourceUrl,
          publisher: payload.sourcePublisher,
        }
      : undefined;

  return { price, primaryImage, source };
};

const relatedMissingFields = (payload: CatalogEditSchemaType) => {
  const related = toRelatedInput(payload);
  const missing: string[] = [];
  if (!related.price) missing.push('price');
  if (!related.primaryImage) missing.push('primaryImage');
  if (!related.source) missing.push('source');
  return missing;
};

const catalogEditRoute = getRouteApi('/_protected/catalog/$modelId/edit');

export const useCatalogEditActions = () => {
  const record = catalogEditRoute.useLoaderData();
  const { modelId } = catalogEditRoute.useParams();
  const router = useRouter();
  const isNew = modelId === 'new';
  const brandsQuery = useQuery(getBrandsQueryOptions());
  const familiesQuery = useQuery(getFamiliesQueryOptions());
  const [actionError, setActionError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const submitSave = async (payload: CatalogEditSchemaType, options?: { announce?: boolean }) => {
    const announce = options?.announce ?? true;
    setActionError(null);
    setMissingFields([]);
    const related = toRelatedInput(payload);
    const identity = {
      brandId: payload.brandId,
      familyId: payload.familyId,
      modelCode: payload.modelCode,
      displayName: payload.displayName,
    };

    if (isNew) {
      const result = await createInstrumentRecordFn({
        data: { ...identity, ...related, levelTier: 'student' },
      });
      if ('error' in result) {
        throw new Error('You do not have permission to create records.');
      }
      if (announce) {
        toast.add({ type: 'success', title: 'Draft created' });
      }
      void router.navigate({ to: '/catalog/$modelId/edit', params: { modelId: result.modelId } });
      return null;
    }

    if (!record) {
      throw new Error('This record could not be loaded.');
    }

    const result = await editInstrumentRecordFn({
      data: { modelId, expectedVersion: record.version, changes: { ...identity, ...related } },
    });
    if ('error' in result && result.error === 'CONFLICT') {
      throw new Error('Someone else edited this record. Reload to see the latest version.');
    }
    if ('error' in result) {
      throw new Error('You do not have permission to edit this record.');
    }
    if (announce) {
      toast.add({ type: 'success', title: 'Record saved' });
    }
    void router.invalidate();
    return { version: result.version };
  };

  const handleTransition = async (
    targetStatus: 'in_review' | 'published' | 'draft' | 'archived',
    payload: CatalogEditSchemaType,
  ) => {
    if (isNew) {
      await submitSave(payload);
      return;
    }
    if (!record) return;

    setActionError(null);
    setMissingFields([]);

    if (targetStatus === 'published') {
      const missing = relatedMissingFields(payload);
      if (missing.length > 0) {
        setMissingFields(missing);
        setActionError('Cannot publish until required fields are saved.');
        return;
      }
    }

    const saved = await submitSave(payload, { announce: false });
    if (!saved) return;

    const result = await transitionStatusFn({
      data: { modelId, expectedVersion: saved.version, targetStatus },
    });
    if ('error' in result && result.error === 'MISSING_REQUIRED_FIELDS') {
      setMissingFields(result.fields);
      setActionError('Cannot publish until required fields are saved.');
      return;
    }
    if ('error' in result && result.error === 'CONFLICT') {
      throw new Error('Someone else edited this record. Reload to see the latest version.');
    }
    if ('error' in result) {
      setActionError('That transition is not allowed for your role.');
      return;
    }
    toast.add({
      type: 'success',
      title: `Now ${STATUS_LABEL[result.newStatus]}`,
    });
    void router.invalidate();
  };

  return {
    record,
    isNew,
    actionError,
    missingFields,
    brands: brandsQuery.data ?? [],
    families: familiesQuery.data ?? [],
    isBrandsPending: brandsQuery.isPending && !brandsQuery.data,
    isFamiliesPending: familiesQuery.isPending && !familiesQuery.data,
    isBrandsError: brandsQuery.isError,
    isFamiliesError: familiesQuery.isError,
    submitSave,
    handleTransition,
  };
};
