import type { Database } from '#/client.ts';
import { confirmedReferences } from '#/schema/index.ts';

export async function pinReferenceModel(db: Database, sessionId: string, modelId: string): Promise<void> {
  await db
    .insert(confirmedReferences)
    .values({
      sessionId,
      modelId,
      confirmedAt: new Date(),
    })
    .onConflictDoNothing({
      target: [confirmedReferences.sessionId, confirmedReferences.modelId],
    });
}
