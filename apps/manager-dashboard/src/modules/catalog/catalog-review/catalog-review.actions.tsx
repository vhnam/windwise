import { getRouteApi, useRouter } from '@tanstack/react-router';
import { useState } from 'react';

import { toast } from '@windwise/ui/components/toast';

import { hasMinRole } from '#/lib/roles';
import { transitionStatusFn } from '#/lib/server/catalog';

const reviewRoute = getRouteApi('/_protected/catalog/review/');

export const useCatalogReviewActions = () => {
  const { records, actor } = reviewRoute.useLoaderData();
  const router = useRouter();
  const canReview = hasMinRole(actor?.role, 'reviewer');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const runTransition = async (
    modelId: string,
    expectedVersion: number,
    targetStatus: 'published' | 'draft',
    note?: string,
  ) => {
    setActionError(null);
    setMissingFields([]);
    setPendingId(modelId);
    try {
      const result = await transitionStatusFn({
        data: { modelId, expectedVersion, targetStatus, note },
      });
      if ('error' in result && result.error === 'MISSING_REQUIRED_FIELDS') {
        setMissingFields(result.fields);
        setActionError('Cannot publish until required fields are saved.');
        return;
      }
      if ('error' in result && result.error === 'CONFLICT') {
        setActionError('Someone else edited this record. Reload to see the latest version.');
        return;
      }
      if ('error' in result) {
        setActionError('That transition is not allowed for your role.');
        return;
      }
      toast.add({
        type: 'success',
        title: targetStatus === 'published' ? 'Published' : 'Returned to draft',
      });
      void router.invalidate();
    } finally {
      setPendingId(null);
    }
  };

  return {
    records,
    canReview,
    pendingId,
    actionError,
    missingFields,
    approve: (modelId: string, expectedVersion: number) => runTransition(modelId, expectedVersion, 'published'),
    requestChanges: (modelId: string, expectedVersion: number, note: string) =>
      runTransition(modelId, expectedVersion, 'draft', note),
  };
};
