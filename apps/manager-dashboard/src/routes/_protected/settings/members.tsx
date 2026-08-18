import { createFileRoute } from '@tanstack/react-router';

import { getActorContextFn } from '#/lib/server/actor';
import { getCatalogSettingsFn, listOrganizationMembersFn } from '#/lib/server/members';
import { MembersSettings } from '#/modules/settings/members-settings';

export const Route = createFileRoute('/_protected/settings/members')({
  loader: async () => {
    const [members, settings, actor] = await Promise.all([
      listOrganizationMembersFn(),
      getCatalogSettingsFn(),
      getActorContextFn(),
    ]);
    return { members, settings, actor };
  },
  component: MembersSettings,
});
