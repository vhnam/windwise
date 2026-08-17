import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState } from 'react';

import { Badge } from '@windwise/ui/components/badge';
import { Button } from '@windwise/ui/components/button';
import { Field, FieldLabel } from '@windwise/ui/components/field';
import { Input } from '@windwise/ui/components/input';

import {
  createInstrumentRecordFn,
  editInstrumentRecordFn,
  getInstrumentRecordFn,
  transitionStatusFn,
} from '#/lib/server/catalog';

export const Route = createFileRoute('/_protected/catalog/$modelId/edit')({
  loader: async ({ params }) => {
    if (params.modelId === 'new') {
      return null;
    }
    return getInstrumentRecordFn({ data: { modelId: params.modelId } });
  },
  component: EditInstrumentRoute,
});

function EditInstrumentRoute() {
  const record = Route.useLoaderData();
  const { modelId } = Route.useParams();
  const router = useRouter();
  const isNew = modelId === 'new';

  const [brandId, setBrandId] = useState(record?.brandId ?? '');
  const [familyId, setFamilyId] = useState(record?.familyId ?? '');
  const [modelCode, setModelCode] = useState(record?.modelCode ?? '');
  const [displayName, setDisplayName] = useState(record?.displayName ?? '');
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    if (isNew) {
      const result = await createInstrumentRecordFn({
        data: { brandId, familyId, modelCode, displayName, levelTier: 'student' },
      });
      if ('error' in result) {
        setMessage('You do not have permission to create records.');
        return;
      }
      void router.navigate({ to: '/catalog/$modelId/edit', params: { modelId: result.modelId } });
      return;
    }

    if (!record) return;
    const result = await editInstrumentRecordFn({
      data: { modelId, expectedVersion: record.version, changes: { brandId, familyId, modelCode, displayName } },
    });
    if ('error' in result && result.error === 'CONFLICT') {
      setMessage('Someone else edited this record. Reload to see the latest version.');
      return;
    }
    if ('error' in result) {
      setMessage('You do not have permission to edit this record.');
      return;
    }
    setMessage('Saved.');
    void router.invalidate();
  }

  async function handleTransition(targetStatus: 'in_review' | 'published' | 'draft' | 'archived') {
    if (!record) return;
    const result = await transitionStatusFn({ data: { modelId, expectedVersion: record.version, targetStatus } });
    if ('error' in result && result.error === 'MISSING_REQUIRED_FIELDS') {
      setMessage(`Cannot publish — missing: ${result.fields.join(', ')}`);
      return;
    }
    if ('error' in result) {
      setMessage('That transition is not allowed for your role.');
      return;
    }
    setMessage(`Now ${result.newStatus}.`);
    void router.invalidate();
  }

  return (
    <div className="p-8 max-w-xl space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">{isNew ? 'New instrument' : record?.displayName}</h1>
        {record && <Badge>{record.status}</Badge>}
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Field>
        <FieldLabel>Brand ID</FieldLabel>
        <Input value={brandId} onChange={(event) => setBrandId(event.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Family ID</FieldLabel>
        <Input value={familyId} onChange={(event) => setFamilyId(event.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Model code</FieldLabel>
        <Input value={modelCode} onChange={(event) => setModelCode(event.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Display name</FieldLabel>
        <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
      </Field>

      <div className="flex gap-2">
        <Button onClick={() => void handleSave()}>{isNew ? 'Create draft' : 'Save'}</Button>
        {record?.status === 'draft' && <Button onClick={() => void handleTransition('in_review')}>Mark ready</Button>}
        {record?.status === 'in_review' && <Button onClick={() => void handleTransition('published')}>Publish</Button>}
        {record?.status === 'published' && (
          <Button variant="destructive" onClick={() => void handleTransition('archived')}>
            Archive
          </Button>
        )}
      </div>
    </div>
  );
}
