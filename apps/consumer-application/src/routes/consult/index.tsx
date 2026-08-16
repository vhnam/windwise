import { fetchServerSentEvents } from '@tanstack/ai-client';
import { useChat } from '@tanstack/ai-react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { collectAnswersToolDef, recommendInstrumentsToolDef } from '@windwise/ai/tool-defs';
import { Badge } from '@windwise/ui/components/badge';
import { Button } from '@windwise/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@windwise/ui/components/card';
import { Field, FieldGroup, FieldLabel } from '@windwise/ui/components/field';
import { Input } from '@windwise/ui/components/input';

import { startConsultation } from '#/lib/server/consultation';

export const Route = createFileRoute('/consult/')({
  component: ConsultChatPage,
});

function ConsultChatPage() {
  const [sessionId, setSessionId] = useState<string>();
  const [startError, setStartError] = useState<string>();

  useEffect(() => {
    void startConsultation()
      .then((result) => setSessionId(result.sessionId))
      .catch(() => setStartError('Không tạo được phiên tư vấn. Hãy dùng biểu mẫu.'));
  }, []);

  if (!sessionId) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p>{startError ?? 'Đang tạo phiên tư vấn…'}</p>
        <Link to="/form" className="text-sm text-primary underline">
          Chuyển sang biểu mẫu
        </Link>
      </main>
    );
  }

  return <ConsultChat sessionId={sessionId} />;
}

function ConsultChat({ sessionId }: { sessionId: string }) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');

  const chat = useChat({
    connection: fetchServerSentEvents(`/api/consult/chat?sessionId=${sessionId}`),
    tools: [collectAnswersToolDef.client(), recommendInstrumentsToolDef.client()],
  });

  useEffect(() => {
    for (const message of chat.messages) {
      for (const part of message.parts ?? []) {
        if (part.type === 'tool-result' && 'name' in part && part.name === 'recommendInstruments') {
          const output = 'output' in part ? part.output : undefined;
          const runId =
            output && typeof output === 'object' && output !== null && 'runId' in output ? output.runId : undefined;
          if (typeof runId === 'string' && runId.length > 0) {
            void navigate({ to: '/result/$runId', params: { runId } });
          }
        }
      }
    }
  }, [chat.messages, navigate]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Tư vấn kèn hơi</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Trả lời bằng tiếng Việt về trình độ, mục đích chơi, và ngân sách. Session:{' '}
            <Badge variant="outline">{sessionId ?? '…'}</Badge>
          </p>
          <Link to="/form" className="text-sm text-primary underline">
            Chuyển sang biểu mẫu
          </Link>
          {chat.error ? (
            <p className="text-sm text-destructive">
              Trợ lý hội thoại đang gặp sự cố.{' '}
              <Link to="/form" className="underline">
                Chuyển sang biểu mẫu
              </Link>
            </p>
          ) : null}
          <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
            {chat.messages.map((message) => (
              <div key={message.id} className="rounded-none border border-border p-2 text-sm">
                <Badge variant="secondary">{message.role}</Badge>
                <p className="mt-1 whitespace-pre-wrap">
                  {message.parts
                    ?.filter((part) => part.type === 'text' && 'content' in part)
                    .map((part) => ('content' in part ? String(part.content) : ''))
                    .join('\n')}
                </p>
              </div>
            ))}
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="consult-message">Tin nhắn</FieldLabel>
              <Input
                id="consult-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ví dụ: mới bắt đầu, học ở trường, dưới 20 triệu"
              />
            </Field>
            <Button
              disabled={!sessionId || chat.isLoading}
              onClick={() => {
                const content = sessionId ? `[session:${sessionId}] ${draft}` : draft;
                void chat.sendMessage(content);
                setDraft('');
              }}
            >
              Gửi
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>
    </main>
  );
}
