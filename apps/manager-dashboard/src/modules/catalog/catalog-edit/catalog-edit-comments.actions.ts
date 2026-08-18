import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { useState } from 'react';

import { toast } from '@windwise/ui/components/toast';

import { addCommentFn, listCommentsFn } from '#/lib/server/catalog';

const catalogEditRoute = getRouteApi('/_protected/catalog/$modelId/edit');

const commentsQueryKey = (modelId: string) => ['catalog', 'comments', modelId] as const;

export function useCatalogEditComments() {
  const { modelId } = catalogEditRoute.useParams();
  const isNew = modelId === 'new';
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const commentsQuery = useQuery({
    queryKey: commentsQueryKey(modelId),
    queryFn: async () => {
      const result = await listCommentsFn({ data: { modelId } });
      return result.items;
    },
    enabled: !isNew,
  });

  const addMutation = useMutation({
    mutationFn: async (nextBody: string) => {
      const result = await addCommentFn({ data: { modelId, body: nextBody } });
      if ('error' in result) {
        throw new Error(
          result.error === 'INVALID_INPUT' ? 'Enter a comment before submitting.' : 'You cannot add a comment.',
        );
      }
      return result.comment;
    },
    onSuccess: async () => {
      setBody('');
      setSubmitError(null);
      toast.add({ type: 'success', title: 'Comment added' });
      await queryClient.invalidateQueries({ queryKey: commentsQueryKey(modelId) });
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
    },
  });

  return {
    isNew,
    comments: commentsQuery.data ?? [],
    isPending: commentsQuery.isPending && !commentsQuery.data,
    body,
    setBody,
    submitError,
    isSubmitting: addMutation.isPending,
    submitComment: () => {
      setSubmitError(null);
      addMutation.mutate(body);
    },
  };
}
