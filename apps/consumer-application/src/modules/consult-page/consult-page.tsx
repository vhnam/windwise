import { fetchServerSentEvents } from '@tanstack/ai-client';
import { useChat } from '@tanstack/ai-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ClipboardListIcon, Loader2Icon, SendIcon, ShieldCheckIcon } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';

import { collectAnswersToolDef, recommendInstrumentsToolDef } from '@windwise/ai/tool-defs';
import { Badge } from '@windwise/ui/components/badge';
import { Button } from '@windwise/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@windwise/ui/components/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@windwise/ui/components/field';
import { Skeleton } from '@windwise/ui/components/skeleton';
import { Textarea } from '@windwise/ui/components/textarea';

import { AppHeader } from '#/components/app-header';
import { startConsultation } from '#/lib/server/consultation';
import { UndrawIllustration } from '#/modules/illustrations';

function ConsultChrome({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl motion-reduce:blur-none dark:bg-primary/25" />
        <div className="absolute top-40 -right-16 size-72 rounded-full bg-chart-2/20 blur-3xl motion-reduce:hidden" />
        <div className="absolute bottom-0 -left-10 size-80 rounded-full bg-chart-3/10 blur-3xl motion-reduce:hidden" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <AppHeader badge="Hội thoại tư vấn" backTo="/consult" />

        <main id="main-content" className="flex flex-1 flex-col gap-10 py-10 sm:gap-12 sm:py-14">
          {children}
        </main>

        <footer className="border-t border-border pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <p className="text-xs leading-relaxed text-muted-foreground">
            WindWise — tư vấn kèn hơi dựa trên catalog, không phải cửa hàng tự nghĩ ra sản phẩm.
          </p>
        </footer>
      </div>
    </div>
  );
}

function ConsultIntro() {
  return (
    <div className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Trả lời bằng tiếng Việt, nhận gợi ý có giải thích
        </h1>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
          Nói về trình độ, mục đích chơi, và ngân sách. Hệ thống hỏi thêm nếu còn thiếu — không bịa model hay giá.
        </p>
      </div>
      <UndrawIllustration name="chatting" className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-md" />
      <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
        <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Khi đủ tiêu chí, kết quả đến từ catalog và logic xếp hạng, không từ mô hình ngôn ngữ.
      </p>
      <Button
        nativeButton={false}
        size="lg"
        variant="outline"
        className="h-11 min-h-11 w-fit px-4 text-sm"
        render={<Link to="/form" />}
      >
        <ClipboardListIcon data-icon="inline-start" aria-hidden="true" />
        Chuyển sang biểu mẫu
      </Button>
    </div>
  );
}

function ConsultChatPage() {
  const [sessionId, setSessionId] = useState<string>();
  const [startError, setStartError] = useState<string>();

  useEffect(() => {
    void startConsultation()
      .then((result) => setSessionId(result.sessionId))
      .catch(() => setStartError('Không tạo được phiên tư vấn. Hãy dùng biểu mẫu.'));
  }, []);

  if (startError) {
    return (
      <ConsultChrome>
        <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <ConsultIntro />
          <Card className="bg-card/80 backdrop-blur-xl">
            <CardHeader className="gap-2">
              <Badge variant="destructive" className="w-fit">
                Không tạo được phiên
              </Badge>
              <CardTitle className="font-heading text-lg">Hội thoại chưa sẵn sàng</CardTitle>
              <CardDescription className="text-sm leading-relaxed">{startError}</CardDescription>
            </CardHeader>
            <CardContent className="pb-(--card-spacing)">
              <Button
                nativeButton={false}
                size="lg"
                className="h-11 min-h-11 px-4 text-sm"
                render={<Link to="/form" />}
              >
                <ClipboardListIcon data-icon="inline-start" aria-hidden="true" />
                Mở biểu mẫu
              </Button>
            </CardContent>
          </Card>
        </section>
      </ConsultChrome>
    );
  }

  if (!sessionId) {
    return (
      <ConsultChrome>
        <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <ConsultIntro />
          <Card className="bg-card/80 backdrop-blur-xl" aria-busy="true" aria-live="polite">
            <CardHeader className="gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pb-(--card-spacing)">
              <Skeleton className="h-48 min-h-48 w-full" />
              <Skeleton className="h-16 w-full" />
              <p className="text-sm text-muted-foreground">Đang tạo phiên tư vấn…</p>
            </CardContent>
          </Card>
        </section>
      </ConsultChrome>
    );
  }

  return <ConsultChat sessionId={sessionId} />;
}

function messageText(message: { role?: string; parts?: Array<{ type?: string; content?: unknown }> }) {
  const raw = (message.parts ?? [])
    .filter((part) => part.type === 'text' && 'content' in part)
    .map((part) => (typeof part.content === 'string' ? part.content : ''))
    .join('\n')
    .trim();

  if (message.role === 'user') {
    return raw.replace(/^\[session:[^\]]+\]\s*/, '');
  }
  return raw;
}

function ConsultChat({ sessionId }: { sessionId: string }) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (chat.error) {
      errorRef.current?.focus();
    }
  }, [chat.error]);

  useEffect(() => {
    const node = logRef.current;
    if (!node) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [chat.messages, chat.isLoading]);

  const visibleMessages = chat.messages
    .map((message) => ({
      id: message.id,
      role: message.role,
      text: messageText(message),
    }))
    .filter((message) => message.text.length > 0);

  function sendDraft() {
    const trimmed = draft.trim();
    if (!trimmed || chat.isLoading) {
      return;
    }
    void chat.sendMessage(`[session:${sessionId}] ${trimmed}`);
    setDraft('');
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendDraft();
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendDraft();
    }
  }

  const statusCopy = chat.isLoading
    ? 'Đang soạn câu trả lời.'
    : visibleMessages.length === 0
      ? 'Chưa có tin nhắn. Hãy gửi trình độ, mục đích, hoặc ngân sách.'
      : `${visibleMessages.length} tin nhắn trong hội thoại.`;

  return (
    <ConsultChrome>
      <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <ConsultIntro />

        <Card className="bg-card/80 backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:delay-100 motion-safe:duration-500">
          <CardHeader className="gap-2">
            <Badge variant="secondary" className="w-fit">
              Hội thoại
            </Badge>
            <CardTitle className="font-heading text-lg">Trò chuyện với WindWise</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Trả lời ngắn là đủ. Có thể chuyển sang biểu mẫu bất cứ lúc nào nếu chat không thuận.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pb-(--card-spacing)">
            {chat.error ? (
              <div
                ref={errorRef}
                role="alert"
                tabIndex={-1}
                aria-labelledby="consult-error-title"
                className="border border-destructive/30 bg-destructive/10 px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <h2 id="consult-error-title" className="font-heading text-sm font-semibold text-destructive">
                  Trợ lý hội thoại đang gặp sự cố
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-destructive">
                  Thử gửi lại, hoặc{' '}
                  <Link to="/form" className="font-medium underline underline-offset-4">
                    chuyển sang biểu mẫu
                  </Link>
                  .
                </p>
              </div>
            ) : null}

            <p className="sr-only" role="status" aria-atomic="true">
              {statusCopy}
            </p>

            <div
              ref={logRef}
              className="flex max-h-[min(28rem,50dvh)] min-h-48 flex-col gap-3 overflow-y-auto border border-border bg-background/60 p-3"
              aria-busy={chat.isLoading}
            >
              {visibleMessages.length === 0 && !chat.isLoading ? (
                <div className="flex flex-col items-start gap-3 py-4">
                  <UndrawIllustration name="chatting" className="w-28" />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Chưa có tin nhắn. Bắt đầu bằng trình độ, mục đích chơi, hoặc ngân sách — ví dụ “mới bắt đầu, học ở
                    trường, dưới 20 triệu”.
                  </p>
                </div>
              ) : null}

              {visibleMessages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <article
                    key={message.id}
                    className={
                      isUser
                        ? 'ms-6 border border-primary/30 bg-primary/10 px-3 py-2.5 sm:ms-10'
                        : 'me-6 border border-border bg-card px-3 py-2.5 sm:me-10'
                    }
                  >
                    <p className="text-xs font-medium tracking-wide text-muted-foreground">
                      {isUser ? 'Bạn' : 'WindWise'}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  </article>
                );
              })}

              {chat.isLoading ? (
                <div className="me-6 flex items-center gap-2 border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground sm:me-10">
                  <Loader2Icon className="size-4 motion-safe:animate-spin" aria-hidden="true" />
                  Đang soạn câu trả lời…
                </div>
              ) : null}
            </div>

            <form className="flex flex-col gap-3" onSubmit={onSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="consult-message">Tin nhắn</FieldLabel>
                  <Textarea
                    id="consult-message"
                    name="consult-message"
                    rows={3}
                    value={draft}
                    disabled={chat.isLoading}
                    aria-describedby="consult-message-hint"
                    className="min-h-16 text-sm md:text-sm"
                    placeholder="Ví dụ: mới bắt đầu, học ở trường, dưới 20 triệu"
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={onComposerKeyDown}
                  />
                  <FieldDescription id="consult-message-hint" className="text-sm">
                    Enter để gửi. Shift+Enter để xuống dòng.
                  </FieldDescription>
                </Field>
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 min-h-11 px-4 text-sm"
                  disabled={chat.isLoading || draft.trim().length === 0}
                >
                  {chat.isLoading ? (
                    <Loader2Icon data-icon="inline-start" className="motion-safe:animate-spin" aria-hidden="true" />
                  ) : (
                    <SendIcon data-icon="inline-start" aria-hidden="true" />
                  )}
                  Gửi
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </section>
    </ConsultChrome>
  );
}

export { ConsultChatPage };
