import type { ModelStatus } from '@windwise/schemas';

export const STATUS_LABEL: Record<ModelStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  published: 'Published',
  archived: 'Archived',
};

export const STATUS_DOT: Record<ModelStatus, string> = {
  draft: 'bg-muted-foreground',
  in_review: 'bg-secondary-foreground',
  published: 'bg-primary',
  archived: 'bg-destructive',
};
