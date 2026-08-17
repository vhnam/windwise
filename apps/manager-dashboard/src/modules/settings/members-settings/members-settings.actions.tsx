import { getRouteApi, useRouter } from '@tanstack/react-router';
import { useState } from 'react';

import type { Role } from '@windwise/schemas';
import { toast } from '@windwise/ui/components/toast';

import { hasMinRole } from '#/lib/roles';
import { updateCatalogSettingsFn, updateMemberRoleFn } from '#/lib/server/members';

const membersRoute = getRouteApi('/_protected/settings/members');

const THRESHOLD_MIN_DAYS = 1;
const THRESHOLD_MAX_DAYS = 3650;

export { THRESHOLD_MAX_DAYS, THRESHOLD_MIN_DAYS };

export const parseStalenessThreshold = (value: string): number | null => {
  const days = Number(value);
  if (!Number.isInteger(days) || days < THRESHOLD_MIN_DAYS || days > THRESHOLD_MAX_DAYS) {
    return null;
  }
  return days;
};

export const useMembersSettingsActions = () => {
  const { members, settings, actor } = membersRoute.useLoaderData();
  const router = useRouter();
  const canManage = hasMinRole(actor?.role, 'admin');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(String(settings.stalenessThresholdDays));
  const [thresholdTouched, setThresholdTouched] = useState(false);
  const [isSavingThreshold, setIsSavingThreshold] = useState(false);
  const parsedThreshold = parseStalenessThreshold(threshold);
  const thresholdError =
    thresholdTouched && parsedThreshold === null
      ? `Enter a whole number of days between ${THRESHOLD_MIN_DAYS} and ${THRESHOLD_MAX_DAYS}.`
      : null;

  const changeRole = async (userId: string, role: Role) => {
    setPendingUserId(userId);
    try {
      const result = await updateMemberRoleFn({ data: { userId, role } });
      if ('error' in result) {
        toast.add({ type: 'error', title: 'You cannot change that member’s role.' });
        return;
      }
      toast.add({ type: 'success', title: 'Role updated' });
      void router.invalidate();
    } finally {
      setPendingUserId(null);
    }
  };

  const saveThreshold = async () => {
    setThresholdTouched(true);
    const days = parseStalenessThreshold(threshold);
    if (days === null) {
      return;
    }
    setIsSavingThreshold(true);
    try {
      const result = await updateCatalogSettingsFn({ data: { stalenessThresholdDays: days } });
      if ('error' in result) {
        toast.add({ type: 'error', title: 'You cannot change catalog settings.' });
        return;
      }
      toast.add({ type: 'success', title: 'Staleness threshold saved' });
      void router.invalidate();
    } finally {
      setIsSavingThreshold(false);
    }
  };

  return {
    members,
    canManage,
    pendingUserId,
    threshold,
    setThreshold,
    thresholdError,
    markThresholdTouched: () => setThresholdTouched(true),
    isSavingThreshold,
    changeRole,
    saveThreshold,
  };
};
