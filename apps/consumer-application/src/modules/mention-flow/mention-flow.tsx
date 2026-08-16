import { useState } from 'react';

import type { MentionCandidate } from '@windwise/schemas';
import { Button } from '@windwise/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@windwise/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@windwise/ui/components/dialog';
import { Field, FieldGroup, FieldLabel } from '@windwise/ui/components/field';
import { Input } from '@windwise/ui/components/input';
import { Skeleton } from '@windwise/ui/components/skeleton';

import { confirmMentionFn, resolveMentionFn } from '#/lib/server/compare-upgrade';

type MentionFlowProps = {
  sessionId: string;
  onConfirmed: (candidate: MentionCandidate) => void;
  embedded?: boolean;
};

export function MentionFlow({ sessionId, onConfirmed, embedded = false }: MentionFlowProps) {
  const [rawText, setRawText] = useState('');
  const [candidates, setCandidates] = useState<MentionCandidate[]>();
  const [selected, setSelected] = useState<MentionCandidate>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function onResolve() {
    setError(undefined);
    setSelected(undefined);
    setLoading(true);
    try {
      const ranked = await resolveMentionFn({ data: { sessionId, rawText } });
      setCandidates(ranked);
    } catch {
      setError('Không tra cứu được tên mẫu. Thử lại.');
    } finally {
      setLoading(false);
    }
  }

  async function onConfirm() {
    if (!selected) {
      return;
    }
    setLoading(true);
    try {
      await confirmMentionFn({ data: { sessionId, modelId: selected.modelId } });
      onConfirmed(selected);
      setConfirmOpen(false);
      setRawText('');
      setCandidates(undefined);
      setSelected(undefined);
    } catch {
      setError('Không ghi nhận được xác nhận. Thử lại.');
    } finally {
      setLoading(false);
    }
  }

  const body = (
    <div className="flex flex-col gap-3">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="mention-raw">Tên mẫu</FieldLabel>
          <Input
            id="mention-raw"
            className="h-11 min-h-11 text-base md:text-base"
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder="Ví dụ: Bach 37"
          />
        </Field>
        <Button
          size="lg"
          className="h-11 min-h-11 px-4 text-sm"
          disabled={loading || rawText.trim().length === 0}
          onClick={() => void onResolve()}
        >
          Tra cứu
        </Button>
      </FieldGroup>
      {error ? (
        <p role="alert" className="text-sm leading-relaxed text-destructive">
          {error}
        </p>
      ) : null}
      {loading ? <Skeleton className="h-16 w-full" /> : null}
      {candidates && candidates.length === 0 ? (
        <div role="status" className="border border-border p-3 text-sm leading-relaxed">
          <p>Không khớp mẫu nào trong catalog.</p>
          <a href="/consult/chat" className="text-primary underline underline-offset-4">
            Chuyển sang khám phá (discover)
          </a>
        </div>
      ) : null}
      {candidates && candidates.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {candidates.map((candidate) => (
            <li key={candidate.modelId}>
              <label className="flex min-h-11 cursor-pointer items-start gap-2 border border-border p-3 text-sm">
                <input
                  type="radio"
                  name="mention-candidate"
                  className="mt-1 size-4"
                  checked={selected?.modelId === candidate.modelId}
                  onChange={() => setSelected(candidate)}
                />
                <span>
                  <span className="font-medium">{candidate.displayName}</span>
                  <span className="block text-muted-foreground">
                    Khớp “{candidate.matchedAlias}” ({Math.round(candidate.confidence * 100)}%)
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : null}
      <Button
        size="lg"
        className="h-11 min-h-11 px-4 text-sm"
        disabled={!selected || loading}
        onClick={() => setConfirmOpen(true)}
      >
        Xác nhận mẫu này
      </Button>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận mẫu</DialogTitle>
            <DialogDescription>
              {selected
                ? `Bạn đang xác nhận ${selected.displayName}. So sánh và gợi ý nâng cấp chỉ dùng mẫu đã xác nhận.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-11 min-h-11" onClick={() => setConfirmOpen(false)}>
              Hủy
            </Button>
            <Button className="h-11 min-h-11" disabled={loading} onClick={() => void onConfirm()}>
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tên mẫu kèn</CardTitle>
        <CardDescription>Nhập tên bạn nhớ. Hệ thống chỉ liệt kê ứng viên — không tự chọn hộ bạn.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">{body}</CardContent>
    </Card>
  );
}
