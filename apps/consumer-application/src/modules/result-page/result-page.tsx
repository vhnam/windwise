import { Link } from '@tanstack/react-router';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckIcon,
  ClipboardListIcon,
  CopyIcon,
  ExternalLinkIcon,
  Loader2Icon,
  MessagesSquareIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import { formCriteriaQuestions, type Criteria, type PublicRecommendationItem } from '@windwise/schemas';
import { Badge } from '@windwise/ui/components/badge';
import { Button } from '@windwise/ui/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@windwise/ui/components/card';
import { Separator } from '@windwise/ui/components/separator';

import { getOtherOptions, type SharedResult } from '#/lib/server/consultation';
import { UndrawIllustration } from '#/modules/home-page/undraw-illustration';

const STALE_AFTER_MS = 180 * 24 * 60 * 60 * 1000;
const INITIAL_VISIBLE = 3;
const MORE_PAGE_SIZE = 3;
const CRITERIA_QUESTIONS = formCriteriaQuestions();

type LoadedResult = Exclude<SharedResult, { error: 'NOT_FOUND' }>;

function formatVnd(amount: number) {
  return `${amount.toLocaleString('vi-VN')} ₫`;
}

function formatVndRange(min: number, max: number) {
  if (min === max) {
    return formatVnd(min);
  }
  return `${min.toLocaleString('vi-VN')}–${max.toLocaleString('vi-VN')} ₫`;
}

function priceScopeLabel(scope: PublicRecommendationItem['scoreBreakdown']['price']['scope']) {
  if (scope === 'vn_street') {
    return 'Giá thị trường Việt Nam';
  }
  return 'MSRP nhà sản xuất';
}

function formatVerifiedDate(iso: string) {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) {
    return iso.slice(0, 10);
  }
  return new Date(parsed).toLocaleDateString('vi-VN');
}

function isStale(lastVerifiedAt: string) {
  const verified = Date.parse(lastVerifiedAt);
  return Number.isFinite(verified) && Date.now() - verified > STALE_AFTER_MS;
}

function criteriaSummary(criteria: Criteria) {
  const chips: Array<{ label: string; value: string }> = [];
  for (const question of CRITERIA_QUESTIONS) {
    const raw = criteria[question.name];
    if (raw === undefined) {
      continue;
    }
    if (Array.isArray(raw)) {
      if (raw.length === 0) {
        continue;
      }
      chips.push({
        label: question.prompt,
        value: raw.map((item) => question.choices.find((choice) => choice.value === item)?.label ?? item).join(', '),
      });
      continue;
    }
    chips.push({
      label: question.prompt,
      value: question.choices.find((choice) => choice.value === String(raw))?.label ?? String(raw),
    });
  }
  if (criteria.budgetCeilingVnd !== undefined) {
    chips.push({ label: 'Trần ngân sách', value: formatVnd(criteria.budgetCeilingVnd) });
  }
  return chips;
}

function ResultChrome({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl motion-reduce:blur-none dark:bg-primary/25" />
        <div className="absolute top-40 -right-16 size-72 rounded-full bg-chart-2/20 blur-3xl motion-reduce:hidden" />
        <div className="absolute bottom-0 -left-10 size-80 rounded-full bg-chart-3/10 blur-3xl motion-reduce:hidden" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Button
            nativeButton={false}
            variant="ghost"
            className="h-11 min-h-11 px-2.5 text-sm font-semibold tracking-wide"
            render={<Link to="/" />}
          >
            <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
            WindWise
          </Button>
          <Badge variant="outline">Kết quả tư vấn</Badge>
        </header>

        <main className="flex flex-1 flex-col gap-10 py-10 sm:gap-12 sm:py-14">{children}</main>

        <footer className="border-t border-border pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <p className="text-xs leading-relaxed text-muted-foreground">
            WindWise — tư vấn kèn hơi dựa trên catalog, không phải cửa hàng tự nghĩ ra sản phẩm.
          </p>
        </footer>
      </div>
    </div>
  );
}

function ResultPage({ data, runId }: { data: SharedResult; runId: string }) {
  if ('error' in data) {
    return <NotFoundState />;
  }

  if (data.items.length === 0) {
    return <NoMatchState data={data} />;
  }

  return <MatchedResult data={data} runId={runId} />;
}

function NotFoundState() {
  return (
    <ResultChrome>
      <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <div className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Không tìm thấy kết quả này
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Liên kết có thể sai, hoặc kết quả chưa được lưu. Bắt đầu tư vấn mới — hội thoại hoặc biểu mẫu đều dẫn tới
              cùng kiểu gợi ý.
            </p>
          </div>
          <UndrawIllustration name="lookingForAnswers" className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-md" />
        </div>
        <Card className="bg-card/80 backdrop-blur-xl">
          <CardHeader className="gap-2">
            <Badge variant="secondary" className="w-fit">
              Tiếp tục
            </Badge>
            <CardTitle className="font-heading text-lg">Chọn cách tư vấn</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Không cần mã kết quả cũ. Tiêu chí mới sẽ tạo liên kết chia sẻ mới.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pb-(--card-spacing) sm:flex-row">
            <Button
              nativeButton={false}
              size="lg"
              className="h-11 min-h-11 px-4 text-sm"
              render={<Link to="/consult" />}
            >
              <MessagesSquareIcon data-icon="inline-start" aria-hidden="true" />
              Hội thoại
            </Button>
            <Button
              nativeButton={false}
              size="lg"
              variant="outline"
              className="h-11 min-h-11 px-4 text-sm"
              render={<Link to="/form" />}
            >
              <ClipboardListIcon data-icon="inline-start" aria-hidden="true" />
              Biểu mẫu
            </Button>
          </CardContent>
        </Card>
      </section>
    </ResultChrome>
  );
}

function NoMatchState({ data }: { data: LoadedResult }) {
  return (
    <ResultChrome>
      <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <div className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Không có kèn phù hợp
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Catalog không có model thỏa mọi ràng buộc đã chọn. Nới một tiêu chí rồi thử lại — hệ thống không bịa kèn
              cho đủ danh sách.
            </p>
          </div>
          <UndrawIllustration name="lookingForAnswers" className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-md" />
        </div>
        <Card className="bg-card/80 backdrop-blur-xl">
          <CardHeader className="gap-2">
            <Badge variant="destructive" className="w-fit">
              Không khớp catalog
            </Badge>
            <CardTitle className="font-heading text-lg">
              {data.noMatch?.limitingConstraint ?? 'Ràng buộc quá chặt'}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {data.noMatch?.suggestion ?? 'Hãy nới một ràng buộc rồi thử lại.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pb-(--card-spacing)">
            <CriteriaChips criteria={data.criteria} />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                nativeButton={false}
                size="lg"
                className="h-11 min-h-11 px-4 text-sm"
                render={<Link to="/form" />}
              >
                <ClipboardListIcon data-icon="inline-start" aria-hidden="true" />
                Điều chỉnh biểu mẫu
              </Button>
              <Button
                nativeButton={false}
                size="lg"
                variant="outline"
                className="h-11 min-h-11 px-4 text-sm"
                render={<Link to="/consult" />}
              >
                <MessagesSquareIcon data-icon="inline-start" aria-hidden="true" />
                Hội thoại lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </ResultChrome>
  );
}

function MatchedResult({ data, runId }: { data: LoadedResult; runId: string }) {
  const [extras, setExtras] = useState<PublicRecommendationItem[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string>();
  const [copied, setCopied] = useState(false);

  const initialItems = useMemo(
    () => [...data.items].sort((a, b) => a.rank - b.rank).slice(0, INITIAL_VISIBLE),
    [data.items],
  );
  const shown = [...initialItems, ...extras];
  const lastRank = shown.reduce((max, item) => Math.max(max, item.rank), 0);
  const remainingCount = data.items.filter((item) => item.rank > lastRank).length;
  const chips = criteriaSummary(data.criteria);

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function loadMore() {
    if (loadingMore) {
      return;
    }
    setMoreError(undefined);
    setLoadingMore(true);
    try {
      const next = await getOtherOptions({ data: { runId, afterRank: lastRank } });
      setExtras((current) => [...current, ...next.slice(0, MORE_PAGE_SIZE)]);
    } catch {
      setMoreError('Không tải thêm được gợi ý. Thử lại.');
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <ResultChrome>
      <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14">
        <div className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Gợi ý từ catalog, kèm lý do
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Thứ tự và điểm đến từ logic xếp hạng đã lưu. Liên kết này ổn định — catalog sau này không đổi kết quả bạn
              đang xem.
            </p>
          </div>
          <UndrawIllustration name="lookingForAnswers" className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-md" />
          <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
            <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Model, giá và thứ hạng không do mô hình ngôn ngữ tự bịa.
          </p>
        </div>

        <Card className="bg-card/80 backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:delay-100 motion-safe:duration-500">
          <CardHeader className="gap-2">
            <Badge variant="secondary" className="w-fit">
              Có thể chia sẻ
            </Badge>
            <CardTitle className="font-heading text-lg">Tiêu chí của lần tư vấn này</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Lưu ngày {formatVerifiedDate(data.createdAt)}. Mã kết quả dùng cho liên kết, không phải thông tin cá nhân.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pb-(--card-spacing)">
            <CriteriaChips criteria={data.criteria} chips={chips} />
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button size="lg" className="h-11 min-h-11 px-4 text-sm" onClick={() => void copyShareLink()}>
                {copied ? (
                  <>
                    <CheckIcon data-icon="inline-start" aria-hidden="true" />
                    Đã sao chép liên kết
                  </>
                ) : (
                  <>
                    <CopyIcon data-icon="inline-start" aria-hidden="true" />
                    Sao chép liên kết
                  </>
                )}
              </Button>
              <Button
                nativeButton={false}
                size="lg"
                variant="outline"
                className="h-11 min-h-11 px-4 text-sm"
                render={<Link to="/form" />}
              >
                Tư vấn lại bằng biểu mẫu
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground" aria-live="polite">
              {copied ? 'Liên kết hiện tại đã nằm trong bộ nhớ tạm.' : `Mã: ${runId}`}
            </p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="result-list-heading" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 id="result-list-heading" className="font-heading text-2xl font-semibold tracking-tight">
            {shown.length} gợi ý xếp hạng
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Mỗi thẻ nêu lý do khớp tiêu chí, khoảng giá theo phạm vi, và lần xác minh dữ liệu gần nhất.
          </p>
        </div>

        <ol className="flex flex-col gap-4" aria-busy={loadingMore}>
          {shown.map((item, index) => (
            <li key={`${item.modelId}-${item.rank}`}>
              <RecommendationCard item={item} index={index} />
            </li>
          ))}
        </ol>

        {remainingCount > 0 ? (
          <div className="flex flex-col gap-3">
            {moreError ? (
              <p
                role="alert"
                className="border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {moreError}
              </p>
            ) : null}
            <Button
              size="lg"
              variant="outline"
              className="h-11 min-h-11 w-fit px-4 text-sm"
              disabled={loadingMore}
              onClick={() => void loadMore()}
            >
              {loadingMore ? (
                <>
                  <Loader2Icon data-icon="inline-start" className="motion-safe:animate-spin" aria-hidden="true" />
                  Đang tải…
                </>
              ) : (
                'Xem gợi ý khác'
              )}
            </Button>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Thêm từ cùng lần chạy đã lưu, không xếp hạng lại.
            </p>
          </div>
        ) : extras.length > 0 ? (
          <p className="text-sm leading-relaxed text-muted-foreground">Không còn gợi ý khác từ cùng kết quả này.</p>
        ) : null}
      </section>
    </ResultChrome>
  );
}

function CriteriaChips({
  criteria,
  chips = criteriaSummary(criteria),
}: {
  chips?: Array<{ label: string; value: string }>;
  criteria: Criteria;
}) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <li key={chip.label}>
          <Badge variant="outline" className="h-auto max-w-full whitespace-normal py-1 text-left">
            <span className="font-medium">{chip.label}:</span> {chip.value}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

function RecommendationCard({ index, item }: { index: number; item: PublicRecommendationItem }) {
  const stale = isStale(item.scoreBreakdown.lastVerifiedAt);
  const price = item.scoreBreakdown.price;

  return (
    <Card
      className="h-full bg-card/80 backdrop-blur-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
      style={{ animationDelay: `${120 + index * 60}ms` }}
    >
      <CardHeader className="gap-2 border-b">
        <Badge variant={item.rank === 1 ? 'default' : 'secondary'} className="w-fit">
          Hạng {item.rank}
          {item.rank === 1 ? ' · gợi ý hàng đầu' : ''}
        </Badge>
        <CardAction>
          <Badge variant="outline">{item.scoreBreakdown.modelCode}</Badge>
        </CardAction>
        <CardTitle className="font-heading text-lg text-pretty">{item.scoreBreakdown.displayName}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {item.scoreBreakdown.familyNameVi}
          {item.scoreBreakdown.familyNameEn ? ` · ${item.scoreBreakdown.familyNameEn}` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Vì sao gợi ý</p>
          <ul className="flex flex-col gap-2">
            {item.reasons.map((reason) => (
              <li key={reason} className="flex gap-2 text-sm leading-relaxed">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{formatVndRange(price.amountMin, price.amountMax)}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{priceScopeLabel(price.scope)}</Badge>
            <Badge variant={stale ? 'destructive' : 'secondary'}>
              {stale ? (
                <>
                  <AlertTriangleIcon data-icon="inline-start" aria-hidden="true" />
                  Quá hạn xác minh · {formatVerifiedDate(item.scoreBreakdown.lastVerifiedAt)}
                </>
              ) : (
                `Xác minh ${formatVerifiedDate(item.scoreBreakdown.lastVerifiedAt)}`
              )}
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          nativeButton={false}
          variant="link"
          className="h-11 min-h-11 px-0 text-sm"
          render={<a href={item.scoreBreakdown.sourceUrl} rel="noreferrer" target="_blank" />}
        >
          Nguồn nhà sản xuất
          <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ResultPage;
