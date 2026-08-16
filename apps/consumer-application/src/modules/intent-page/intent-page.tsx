import { Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowUpCircleIcon,
  CheckIcon,
  ClipboardListIcon,
  Columns2Icon,
  CompassIcon,
  Loader2Icon,
  ShieldCheckIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Badge } from '@windwise/ui/components/badge';
import { Button } from '@windwise/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@windwise/ui/components/card';

import { AppBreadcrumb } from '#/components/app-breadcrumb';
import { AppHeader } from '#/components/app-header';
import { UndrawIllustration } from '#/components/illustrations';
import { startIntentSession } from '#/lib/server/compare-upgrade';

type Intent = 'discover' | 'compare' | 'upgrade';

const OPTIONS: Array<{
  intent: Intent;
  title: string;
  description: string;
  icon: typeof CompassIcon;
}> = [
  {
    intent: 'discover',
    title: 'Khám phá',
    description: 'Chưa biết họ kèn. Trả lời câu hỏi để nhận gợi ý từ catalog.',
    icon: CompassIcon,
  },
  {
    intent: 'compare',
    title: 'So sánh',
    description: 'Đã có vài mẫu trong đầu. Xác nhận rồi xem bảng so sánh.',
    icon: Columns2Icon,
  },
  {
    intent: 'upgrade',
    title: 'Nâng cấp',
    description: 'Đã có kèn hiện tại. Tìm mẫu cùng họ, cùng cấp hoặc cao hơn.',
    icon: ArrowUpCircleIcon,
  },
];

function IntentChoicePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Intent>('discover');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const errorRef = useRef<HTMLDivElement>(null);
  const selectedOption = OPTIONS.find((option) => option.intent === selected);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  async function onContinue() {
    setError(undefined);
    setBusy(true);
    try {
      if (selected === 'discover') {
        await navigate({ to: '/consult/chat' });
        return;
      }
      const session = await startIntentSession({ data: { intent: selected } });
      if (selected === 'compare') {
        await navigate({ to: '/compare', search: { sessionId: session.sessionId } });
        return;
      }
      await navigate({ to: '/upgrade', search: { sessionId: session.sessionId } });
    } catch {
      setError('Không tạo được phiên. Thử lại.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl motion-reduce:blur-none dark:bg-primary/25" />
        <div className="absolute top-40 -right-16 size-72 rounded-full bg-chart-2/20 blur-3xl motion-reduce:hidden" />
        <div className="absolute bottom-0 -left-10 size-80 rounded-full bg-chart-3/10 blur-3xl motion-reduce:hidden" />
      </div>

      <AppHeader />
      <AppBreadcrumb items={[{ label: 'Trang chủ', to: '/' }, { label: 'Tư vấn' }]} />

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <main id="main-content" className="flex flex-1 flex-col gap-10 py-10 sm:gap-12 sm:py-14">
          <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
            <div className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
              <div className="flex flex-col gap-3">
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  Bạn muốn làm gì hôm nay?
                </h1>
                <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                  Chọn một lối vào. Lựa chọn gắn với phiên và không đổi giữa chừng — để câu hỏi khớp với việc bạn đang
                  quyết định.
                </p>
              </div>
              <UndrawIllustration name="composeMusic" className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-md" />
              <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Model, giá và điểm xếp hạng không do mô hình ngôn ngữ tự bịa.
              </p>
              <Button
                nativeButton={false}
                size="lg"
                variant="outline"
                className="h-11 min-h-11 w-fit px-4 text-sm"
                render={<Link to="/form" />}
              >
                <ClipboardListIcon data-icon="inline-start" aria-hidden="true" />
                Dùng biểu mẫu khám phá
              </Button>
            </div>

            <Card className="bg-card/80 backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:delay-100 motion-safe:duration-500">
              <CardHeader className="gap-2">
                <Badge variant="secondary" className="w-fit">
                  Ba lối vào
                </Badge>
                <CardTitle className="font-heading text-lg">Chọn cách tư vấn</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Một lựa chọn cho phiên này. Khám phá hỏi từ đầu; so sánh và nâng cấp bắt đầu từ mẫu bạn đã biết.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 pb-(--card-spacing)">
                {error ? (
                  <div
                    ref={errorRef}
                    role="alert"
                    tabIndex={-1}
                    aria-labelledby="intent-error-title"
                    className="border border-destructive/30 bg-destructive/10 px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <h2 id="intent-error-title" className="font-heading text-sm font-semibold text-destructive">
                      Không tạo được phiên
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-destructive">{error}</p>
                  </div>
                ) : null}

                <fieldset className="flex flex-col gap-2">
                  <legend className="sr-only">Lối vào tư vấn</legend>
                  {OPTIONS.map((option) => {
                    const isSelected = selected === option.intent;
                    return (
                      <label
                        key={option.intent}
                        className={
                          isSelected
                            ? 'flex min-h-11 cursor-pointer items-start gap-3 border border-primary bg-primary/10 p-4 transition-colors duration-200'
                            : 'flex min-h-11 cursor-pointer items-start gap-3 border border-border bg-background/70 p-4 transition-colors duration-200 hover:bg-muted/60'
                        }
                      >
                        <input
                          type="radio"
                          name="consult-intent"
                          className="mt-1 size-4 shrink-0 accent-primary"
                          checked={isSelected}
                          onChange={() => setSelected(option.intent)}
                        />
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <option.icon className="size-4 shrink-0" aria-hidden="true" />
                            <span className="font-heading text-sm font-semibold">{option.title}</span>
                            {isSelected ? (
                              <Badge variant="outline" className="h-6">
                                <CheckIcon data-icon="inline-start" aria-hidden="true" />
                                Đã chọn
                              </Badge>
                            ) : null}
                          </span>
                          <span className="text-sm leading-relaxed text-muted-foreground">{option.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </fieldset>

                <Button
                  type="button"
                  size="lg"
                  className="h-11 min-h-11 px-4 text-sm"
                  disabled={busy}
                  aria-describedby={error ? 'intent-error-title' : undefined}
                  onClick={() => void onContinue()}
                >
                  {busy ? (
                    <Loader2Icon data-icon="inline-start" className="motion-safe:animate-spin" aria-hidden="true" />
                  ) : null}
                  Tiếp tục với {selectedOption?.title ?? 'lối vào đã chọn'}
                </Button>
              </CardContent>
            </Card>
          </section>
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

export { IntentChoicePage };
