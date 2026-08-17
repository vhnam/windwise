import type { AuditAction } from '@windwise/schemas';

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  create: 'Created',
  edit: 'Edited',
  status_transition: 'Status change',
  archive: 'Archived',
};

export const AUDIT_ACTION_VARIANT: Record<AuditAction, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  create: 'secondary',
  edit: 'outline',
  status_transition: 'default',
  archive: 'destructive',
};

export const formatAuditWhen = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

export const formatAuditValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return '—';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
};
