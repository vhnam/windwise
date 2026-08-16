import { Link } from '@tanstack/react-router';
import { Columns2Icon, ExternalLinkIcon, Loader2Icon, ShieldCheckIcon, SparklesIcon, XIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { ComparisonAspect, ComparisonResult, MentionCandidate, NoteAspect } from '@windwise/schemas';
import { Badge } from '@windwise/ui/components/badge';
import { Button } from '@windwise/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@windwise/ui/components/card';
import { Skeleton } from '@windwise/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@windwise/ui/components/table';

import { AppHeader } from '#/components/app-header';
import { compareModelsFn } from '#/lib/server/compare-upgrade';
import { UndrawIllustration } from '#/modules/illustrations';
import { MentionFlow } from '#/modules/mention-flow';

const PRIORITY_OPTIONS: Array<{ value: ComparisonAspect; label: string }> = [
  { value: 'tone', label: 'Âm sắc' },
  { value: 'weight_response', label: 'Đáp ứng' },
  { value: 'projection', label: 'Độ vang' },
  { value: 'budget', label: 'Ngân sách' },
];

const ASPECT_LABEL: Record<NoteAspect | ComparisonAspect, string> = {
  tone: 'Âm sắc',
  weight_response: 'Đáp ứng / trọng lượng',
  projection: 'Độ vang',
  budget: 'Ngân sách',
  general: 'Chung',
};

const TIER_LABEL: Record<string, string> = {
  student: 'Học sinh',
  intermediate: 'Trung cấp',
  professional: 'Chuyên nghiệp',
  custom: 'Tùy chỉnh',
};

type ComparePageProps = {
  sessionId: string;
};

function formatVnd(amount: number) {
  return `${amount.toLocaleString('vi-VN')} ₫`;
}

function formatVndRange(min: number, max: number) {
  if (min === max) {
    return formatVnd(min);
  }
  return `${min.toLocaleString('vi-VN')}–${max.toLocaleString('vi-VN')} ₫`;
}

function priceScopeLabel(scope: 'vn_street' | 'msrp_global') {
  if (scope === 'vn_street') {
    return 'Giá thị trường Việt Nam';
  }
  return 'MSRP nhà sản xuất';
}

function CompareChrome({ badge, children }: { badge: string; children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl motion-reduce:blur-none dark:bg-primary/25" />
        <div className="absolute top-40 -right-16 size-72 rounded-full bg-chart-2/20 blur-3xl motion-reduce:hidden" />
        <div className="absolute bottom-0 -left-10 size-80 rounded-full bg-chart-3/10 blur-3xl motion-reduce:hidden" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <AppHeader badge={badge} backTo="/consult" />

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

function MissingSessionState() {
  return (
    <CompareChrome badge="So sánh mẫu">
      <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <div className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Thiếu phiên tư vấn
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              So sánh gắn với một phiên đã chọn lối vào. Tạo phiên mới rồi xác nhận từng mẫu trước khi xem bảng.
            </p>
          </div>
          <UndrawIllustration name="lookingForAnswers" className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-md" />
        </div>
        <Card className="bg-card/80 backdrop-blur-xl">
          <CardHeader className="gap-2">
            <Badge variant="secondary" className="w-fit">
              Bắt đầu lại
            </Badge>
            <CardTitle className="font-heading text-lg">Chọn lối vào so sánh</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Liên kết này không có mã phiên. Chọn “So sánh” để tạo phiên mới.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pb-(--card-spacing) sm:flex-row">
            <Button
              nativeButton={false}
              size="lg"
              className="h-11 min-h-11 px-4 text-sm"
              render={<Link to="/consult" />}
            >
              Chọn lối vào
            </Button>
          </CardContent>
        </Card>
      </section>
    </CompareChrome>
  );
}

function ComparePage({ sessionId }: ComparePageProps) {
  const [confirmed, setConfirmed] = useState<MentionCandidate[]>([]);
  const [priority, setPriority] = useState<ComparisonAspect>();
  const [result, setResult] = useState<ComparisonResult>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const confirmedIds = useMemo(() => confirmed.map((item) => item.modelId), [confirmed]);
  const readyToCompare = confirmedIds.length >= 2;

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  async function runCompare(nextPriority?: ComparisonAspect) {
    if (confirmedIds.length < 2) {
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      const output = await compareModelsFn({
        data: {
          sessionId,
          modelIds: confirmedIds,
          priority: nextPriority,
        },
      });
      if ('error' in output) {
        setError('Một mẫu chưa được xác nhận trong phiên này. Xác nhận lại rồi so sánh.');
        setResult(undefined);
        return;
      }
      setResult(output);
    } catch {
      setError('Không so sánh được. Thử lại.');
    } finally {
      setLoading(false);
    }
  }

  function removeConfirmed(modelId: string) {
    setConfirmed((current) => current.filter((item) => item.modelId !== modelId));
    setResult(undefined);
  }

  if (!sessionId) {
    return <MissingSessionState />;
  }

  return (
    <CompareChrome badge="So sánh mẫu">
      <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <div className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              So sánh mẫu đã xác nhận
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Tra cứu tên bạn nhớ, xác nhận đúng mẫu trong catalog, rồi xem cấp, giá và ghi chú chơi cạnh nhau. Hệ thống
              không tự chọn hộ bạn.
            </p>
          </div>
          <ol className="flex flex-col gap-2 text-sm leading-relaxed">
            <li className="flex gap-3">
              <span className="font-heading w-6 shrink-0 font-semibold text-primary">1</span>
              Tra cứu từng tên mẫu.
            </li>
            <li className="flex gap-3">
              <span className="font-heading w-6 shrink-0 font-semibold text-primary">2</span>
              Xác nhận ít nhất hai mẫu.
            </li>
            <li className="flex gap-3">
              <span className="font-heading w-6 shrink-0 font-semibold text-primary">3</span>
              So sánh, rồi đánh dấu khía cạnh bạn quan tâm.
            </li>
          </ol>
          <UndrawIllustration name="lookingForAnswers" className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-md" />
          <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
            <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Spec, cấp và giá lấy từ catalog. Ghi chú chơi chỉ hiện khi đã được biên tập.
          </p>
        </div>

        <div className="flex flex-col gap-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:delay-100 motion-safe:duration-500">
          <MentionFlow
            sessionId={sessionId}
            onConfirmed={(candidate) => {
              setConfirmed((current) =>
                current.some((item) => item.modelId === candidate.modelId) ? current : [...current, candidate],
              );
            }}
          />
          <Card className="bg-card/80 backdrop-blur-xl">
            <CardHeader className="gap-2">
              <Badge variant="secondary" className="w-fit">
                Bước 2
              </Badge>
              <CardTitle className="font-heading text-lg">Đã xác nhận</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Cần ít nhất hai mẫu. Bỏ một mẫu khỏi danh sách này nếu bạn chọn nhầm — so sánh chỉ dùng các mẫu còn lại.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pb-(--card-spacing)">
              <p className="sr-only" role="status" aria-atomic="true">
                {confirmed.length === 0 ? 'Chưa có mẫu nào được xác nhận.' : `Đã xác nhận ${confirmed.length} mẫu.`}
              </p>
              {confirmed.length === 0 ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Chưa có mẫu nào. Tra cứu tên ở trên rồi xác nhận từng ứng viên.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {confirmed.map((item) => (
                    <li
                      key={item.modelId}
                      className="flex min-h-11 min-w-0 items-center gap-1 border border-border bg-background/80 py-1 pr-1 pl-3"
                    >
                      <span className="text-sm font-medium whitespace-nowrap">{item.displayName}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-11 shrink-0"
                        aria-label={`Bỏ ${item.displayName} khỏi so sánh`}
                        onClick={() => removeConfirmed(item.modelId)}
                      >
                        <XIcon aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  size="lg"
                  className="h-11 min-h-11 px-4 text-sm"
                  disabled={!readyToCompare || loading}
                  onClick={() => void runCompare(priority)}
                >
                  {loading ? (
                    <Loader2Icon data-icon="inline-start" className="motion-safe:animate-spin" aria-hidden="true" />
                  ) : (
                    <Columns2Icon data-icon="inline-start" aria-hidden="true" />
                  )}
                  So sánh ngay
                </Button>
                {!readyToCompare ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Xác nhận thêm {Math.max(0, 2 - confirmed.length)} mẫu để so sánh.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {error ? (
        <div
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          aria-labelledby="compare-error-title"
          className="border border-destructive/30 bg-destructive/10 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h2 id="compare-error-title" className="font-heading text-sm font-semibold text-destructive">
            Không so sánh được
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-destructive">{error}</p>
        </div>
      ) : null}

      {loading && !result ? <Skeleton className="h-48 min-h-48 w-full" /> : null}

      {result ? (
        <ComparisonResultPanel
          loading={loading}
          priority={priority}
          result={result}
          onPriorityChange={(next) => {
            setPriority(next);
            void runCompare(next);
          }}
        />
      ) : null}
    </CompareChrome>
  );
}

type ComparisonResultPanelProps = {
  loading: boolean;
  onPriorityChange: (next: ComparisonAspect | undefined) => void;
  priority: ComparisonAspect | undefined;
  result: ComparisonResult;
};

function ComparisonResultPanel({ loading, onPriorityChange, priority, result }: ComparisonResultPanelProps) {
  const highlighted = new Set(result.highlightedAspects);

  return (
    <section
      aria-labelledby="compare-result-heading"
      className="flex flex-col gap-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
    >
      <Card className="bg-card/80 backdrop-blur-xl">
        <CardHeader className="gap-2">
          <Badge variant="secondary" className="w-fit">
            Bước 3
          </Badge>
          <CardTitle id="compare-result-heading" className="font-heading text-lg">
            Kết quả so sánh
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Ưu tiên chỉ làm nổi hàng liên quan — không ẩn mẫu hay thuộc tính nào.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pb-(--card-spacing)">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Ưu tiên khi đọc bảng</legend>
            <div className="flex flex-wrap gap-2">
              <PriorityChip
                selected={priority === undefined}
                label="Không ưu tiên"
                onSelect={() => onPriorityChange(undefined)}
              />
              {PRIORITY_OPTIONS.map((option) => (
                <PriorityChip
                  key={option.value}
                  selected={priority === option.value}
                  label={option.label}
                  onSelect={() => onPriorityChange(option.value)}
                />
              ))}
            </div>
          </fieldset>

          {loading ? <Skeleton className="h-10 w-full" /> : null}

          <div className="grid gap-3 md:hidden">
            {result.models.map((model) => (
              <article key={model.modelId} className="border border-border bg-background/70 p-4">
                <h3 className="font-heading text-base font-semibold text-balance">{model.specs.displayName}</h3>
                <dl className="mt-3 flex flex-col gap-2 text-sm">
                  <SpecItem
                    highlighted={highlighted.has('budget')}
                    term="Cấp"
                    detail={TIER_LABEL[model.tier] ?? model.tier}
                  />
                  <SpecItem
                    highlighted={highlighted.has('budget')}
                    term="Giá"
                    detail={
                      model.price
                        ? `${formatVndRange(model.price.amountMin, model.price.amountMax)} · ${priceScopeLabel(model.price.scope)}`
                        : 'Chưa có giá trong catalog'
                    }
                  />
                  <SpecItem term="Mã" detail={model.specs.modelCode} />
                </dl>
                <a
                  href={model.specs.sourceUrl}
                  className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                  rel="noreferrer"
                  target="_blank"
                >
                  Nguồn catalog
                  <ExternalLinkIcon className="size-4" aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>

          <div className="hidden md:block">
            <Table className="text-sm">
              <TableCaption>So sánh cấp, giá và mã mẫu. Hàng ưu tiên có nhãn và nền khác.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 min-w-32 bg-card">Thuộc tính</TableHead>
                  {result.models.map((model) => (
                    <TableHead key={model.modelId} className="min-w-40 whitespace-normal">
                      {model.specs.displayName}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <HighlightedRow highlighted={highlighted.has('budget')}>
                  <TableCell className="sticky left-0 z-10 bg-inherit">
                    <RowLabel highlighted={highlighted.has('budget')}>Cấp</RowLabel>
                  </TableCell>
                  {result.models.map((model) => (
                    <TableCell key={`${model.modelId}-tier`}>{TIER_LABEL[model.tier] ?? model.tier}</TableCell>
                  ))}
                </HighlightedRow>
                <HighlightedRow highlighted={highlighted.has('budget')}>
                  <TableCell className="sticky left-0 z-10 bg-inherit">
                    <RowLabel highlighted={highlighted.has('budget')}>Giá</RowLabel>
                  </TableCell>
                  {result.models.map((model) => (
                    <TableCell key={`${model.modelId}-price`}>
                      {model.price ? (
                        <span className="flex flex-col gap-0.5 whitespace-normal">
                          <span>{formatVndRange(model.price.amountMin, model.price.amountMax)}</span>
                          <span className="text-xs text-muted-foreground">{priceScopeLabel(model.price.scope)}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  ))}
                </HighlightedRow>
                <TableRow>
                  <TableCell className="sticky left-0 z-10 bg-card">Mã</TableCell>
                  {result.models.map((model) => (
                    <TableCell key={`${model.modelId}-code`}>{model.specs.modelCode}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="sticky left-0 z-10 bg-card">Nguồn</TableCell>
                  {result.models.map((model) => (
                    <TableCell key={`${model.modelId}-source`}>
                      <a
                        href={model.specs.sourceUrl}
                        className="inline-flex min-h-11 items-center gap-1 text-primary underline-offset-4 hover:underline"
                        rel="noreferrer"
                        target="_blank"
                      >
                        Catalog
                        <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
                      </a>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {result.notes.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h3 className="font-heading text-sm font-semibold">Ghi chú chơi</h3>
              <ul className="flex flex-col gap-2">
                {result.notes.map((note) => {
                  const isPriority = highlighted.has(note.aspect as ComparisonAspect);
                  return (
                    <li
                      key={`${note.aspect}-${note.noteVi}`}
                      className={
                        isPriority
                          ? 'border border-primary/30 bg-primary/10 px-3 py-3 text-sm leading-relaxed'
                          : 'border border-border px-3 py-3 text-sm leading-relaxed'
                      }
                    >
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{ASPECT_LABEL[note.aspect]}</span>
                        {isPriority ? (
                          <Badge variant="outline" className="h-6">
                            <SparklesIcon data-icon="inline-start" aria-hidden="true" />
                            Ưu tiên
                          </Badge>
                        ) : null}
                      </p>
                      <p className="mt-1">{note.noteVi}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Chưa có ghi chú chơi đã xuất bản cho cặp mẫu này. Bảng spec vẫn đủ để so sánh.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function PriorityChip({ label, onSelect, selected }: { label: string; onSelect: () => void; selected: boolean }) {
  return (
    <Button
      type="button"
      variant={selected ? 'default' : 'outline'}
      size="lg"
      className="h-11 min-h-11 px-3 text-sm whitespace-nowrap"
      aria-pressed={selected}
      onClick={onSelect}
    >
      {label}
    </Button>
  );
}

function HighlightedRow({ children, highlighted }: { children: ReactNode; highlighted: boolean }) {
  return (
    <TableRow
      data-state={highlighted ? 'selected' : undefined}
      className={highlighted ? 'bg-primary/10 hover:bg-primary/15' : undefined}
    >
      {children}
    </TableRow>
  );
}

function RowLabel({ children, highlighted }: { children: ReactNode; highlighted: boolean }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className={highlighted ? 'font-semibold' : undefined}>{children}</span>
      {highlighted ? (
        <Badge variant="outline" className="h-6">
          <SparklesIcon data-icon="inline-start" aria-hidden="true" />
          Ưu tiên
        </Badge>
      ) : null}
    </span>
  );
}

function SpecItem({ detail, highlighted, term }: { detail: string; highlighted?: boolean; term: string }) {
  return (
    <div className={highlighted ? 'border-l-2 border-primary bg-primary/10 px-3 py-2' : undefined}>
      <dt className="flex flex-wrap items-center gap-2 text-muted-foreground">
        {term}
        {highlighted ? (
          <Badge variant="outline" className="h-6 text-foreground">
            Ưu tiên
          </Badge>
        ) : null}
      </dt>
      <dd className={highlighted ? 'font-medium' : undefined}>{detail}</dd>
    </div>
  );
}

export { ComparePage };
