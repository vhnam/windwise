import { PowerSyncContext } from '@powersync/react';
import { PowerSyncDatabase, WASQLiteOpenFactory } from '@powersync/web';
import type { PropsWithChildren } from 'react';

import { AppSchema } from '#/lib/powersync/app-schema';
import { BackendConnector } from '#/lib/powersync/backend-connector';

const db = new PowerSyncDatabase({
  database: new WASQLiteOpenFactory({
    dbFilename: 'powersync.db',
  }),
  schema: AppSchema,
  flags: {
    disableSSRWarning: true,
  },
});

void db.connect(new BackendConnector());

export default function PowerSyncProvider({ children }: PropsWithChildren) {
  return <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>;
}
