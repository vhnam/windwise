import { Link } from '@tanstack/react-router';
import {
  AlertTriangleIcon,
  ArrowUpCircleIcon,
  CheckIcon,
  ExternalLinkIcon,
  Loader2Icon,
  ShieldCheckIcon,
} from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';

import {
  formCriteriaQuestions,
  type Budget,
  type Level,
  type MentionCandidate,
  type PublicRecommendationItem,
  type Purpose,
  type UpgradeRecommendation,
} from '@windwise/schemas';
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@windwise/ui/components/field';
import { Separator } from '@windwise/ui/components/separator';
import { Skeleton } from '@windwise/ui/components/skeleton';
import { Textarea } from '@windwise/ui/components/textarea';

import { AppHeader } from '#/components/app-header';
import { suggestUpgradeFn } from '#/lib/server/compare-upgrade';
import { UndrawIllustration } from '#/modules/illustrations';
import { MentionFlow } from '#/modules/mention-flow';

const QUESTIONS = formCriteriaQuestions();
const LEVEL_QUESTION = QUESTIONS.find((question) => question.name === 'level');
const PURPOSE_QUESTION = QUESTIONS.find((question) => question.name === 'purpose');
const BUDGET_QUESTION = QUESTIONS.find((question) => question.name === 'budget');

const TIER_LABEL: Record<string, string> = {
  student: 'Học sinh',
  intermediate: 'Trung cấp',
  professional: 'Chuyên nghiệp',
  custom: 'Tùy chỉnh',
};

const STALE_AFTER_MS = 180 * 24 * 60 * 60 * 1000;

const INPUT_STEPS = [
  {
    id: 'horn',
    title: 'Kèn hiện tại',
    description: 'Tra cứu tên bạn nhớ, rồi xác nhận đúng mẫu trong catalog.',
  },
  {
    id: 'reason',
    title: 'Lý do muốn đổi',
    description: 'Không bắt buộc. Bỏ qua nếu không cần thêm ngữ cảnh.',
  },
  {
    id: 'level',
    title: LEVEL_QUESTION?.prompt ?? 'Trình độ',
    description: LEVEL_QUESTION?.description ?? 'Chọn trình độ hiện tại.',
  },
  {
    id: 'purpose',
    title: PURPOSE_QUESTION?.prompt ?? 'Mục đích',
    description: PURPOSE_QUESTION?.description ?? 'Bạn chủ yếu chơi trong hoàn cảnh nào?',
  },
  {
    id: 'budget',
    title: 'Ngân sách nâng cấp',
    description: 'Khoảng chi phí dự kiến cho mẫu tiếp theo, không phải giá kèn hiện tại.',
  },
] as const;

type InputStepId = (typeof INPUT_STEPS)[number]['id'];
type WizardPhase = InputStepId | 'results';

type UpgradePageProps = {
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

function UpgradeChrome({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl motion-reduce:blur-none dark:bg-primary/25" />
        <div className="absolute top-40 -right-16 size-72 rounded-full bg-chart-2/20 blur-3xl motion-reduce:hidden" />
        <div className="absolute bottom-0 -left-10 size-80 rounded-full bg-chart-3/10 blur-3xl motion-reduce:hidden" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <AppHeader badge="Nâng cấp kèn" backTo="/consult" />

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
    <UpgradeChrome>
      <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <div className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Thiếu phiên tư vấn
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Gợi ý nâng cấp gắn với một phiên đã chọn lối vào. Tạo phiên mới, xác nhận kèn hiện tại, rồi mới xếp hạng
              trong cùng họ.
            </p>
          </div>
          <UndrawIllustration name="upgrade" className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-md" />
        </div>
        <Card className="bg-card/80 backdrop-blur-xl">
          <CardHeader className="gap-2">
            <Badge variant="secondary" className="w-fit">
              Bắt đầu lại
            </Badge>
            <CardTitle className="font-heading text-lg">Chọn lối vào nâng cấp</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Liên kết này không có mã phiên. Chọn “Nâng cấp” để tạo phiên mới.
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
    </UpgradeChrome>
  );
}

function UpgradePage({ sessionId }: UpgradePageProps) {
  const reasonHelpId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [phase, setPhase] = useState<WizardPhase>('horn');
  const [current, setCurrent] = useState<MentionCandidate>();
  const [reason, setReason] = useState('');
  const [currentLevel, setCurrentLevel] = useState<Level>('intermediate');
  const [purpose, setPurpose] = useState<Purpose>('personal');
  const [upgradeBudget, setUpgradeBudget] = useState<Budget>('50_100m');
  const [confirmError, setConfirmError] = useState<string>();
  const [result, setResult] = useState<UpgradeRecommendation>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const stepIndex = INPUT_STEPS.findIndex((step) => step.id === phase);
  const activeStep = stepIndex >= 0 ? INPUT_STEPS[stepIndex] : undefined;
  const isLastInput = phase === 'budget';

  useEffect(() => {
    if (phase === 'results') {
      resultsRef.current?.focus();
      return;
    }
    headingRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  function goTo(next: WizardPhase) {
    setConfirmError(undefined);
    setPhase(next);
  }

  function goBack() {
    if (phase === 'results') {
      goTo('budget');
      return;
    }
    if (stepIndex <= 0) {
      return;
    }
    goTo(INPUT_STEPS[stepIndex - 1].id);
  }

  function goNext() {
    if (phase === 'horn' && !current) {
      setConfirmError('Xác nhận kèn hiện tại trước khi sang bước tiếp.');
      return;
    }
    if (isLastInput) {
      void onSubmit();
      return;
    }
    goTo(INPUT_STEPS[stepIndex + 1].id);
  }

  async function onSubmit() {
    if (!current) {
      setConfirmError('Xác nhận kèn hiện tại trước khi gợi ý.');
      goTo('horn');
      return;
    }
    setConfirmError(undefined);
    setError(undefined);
    setLoading(true);
    try {
      const output = await suggestUpgradeFn({
        data: {
          sessionId,
          currentModelId: current.modelId,
          reason,
          currentLevel,
          purpose,
          upgradeBudget,
        },
      });
      if ('error' in output) {
        setResult(undefined);
        setConfirmError('Mẫu hiện tại chưa được xác nhận trong phiên này. Tra cứu và xác nhận lại.');
        setPhase('horn');
        return;
      }
      setResult(output);
      setPhase('results');
    } catch {
      setError('Không gợi ý được. Thử lại.');
    } finally {
      setLoading(false);
    }
  }

  if (!sessionId) {
    return <MissingSessionState />;
  }

  return (
    <UpgradeChrome>
      <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <div className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Nâng cấp trong cùng họ kèn
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Xác nhận mẫu bạn đang chơi, rồi trả lời từng câu. Hệ thống chỉ xếp hạng mẫu cùng họ, cùng cấp hoặc cao hơn
              — không hỏi lại nhóm nhạc cụ.
            </p>
          </div>
          <ol className="flex flex-col gap-2 text-sm leading-relaxed">
            {INPUT_STEPS.map((step, index) => {
              const currentStep = phase === step.id;
              const complete = stepIndex > index || phase === 'results';
              return (
                <li key={step.id} className="flex gap-3">
                  <span
                    className={
                      currentStep || complete
                        ? 'font-heading w-6 shrink-0 font-semibold text-primary'
                        : 'font-heading w-6 shrink-0 font-semibold text-muted-foreground'
                    }
                  >
                    {index + 1}
                  </span>
                  <span className={currentStep ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                    {step.title}
                  </span>
                </li>
              );
            })}
          </ol>
          <UndrawIllustration name="upgrade" className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-md" />
          <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
            <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Tên mẫu, cấp và điểm xếp hạng lấy từ catalog — không do mô hình ngôn ngữ tự bịa.
          </p>
        </div>

        <div className="flex flex-col gap-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:delay-100 motion-safe:duration-500">
          {phase !== 'results' ? <StepProgress phase={phase} onJump={(id) => goTo(id)} /> : null}

          {phase === 'results' && result ? (
            <Card className="bg-card/80 backdrop-blur-xl">
              <CardHeader className="gap-2">
                <Badge variant="secondary" className="w-fit">
                  Hoàn tất
                </Badge>
                <CardTitle className="font-heading text-lg">Đã xếp hạng trong cùng họ</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {current ? `So với ${current.displayName}. ` : ''}
                  Cuộn xuống để đọc từng gợi ý, hoặc quay lại chỉnh tiêu chí.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pb-(--card-spacing) sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-11 min-h-11 px-4 text-sm"
                  onClick={() => goTo('budget')}
                >
                  Chỉnh tiêu chí
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="h-11 min-h-11 px-4 text-sm"
                  onClick={() => goTo('horn')}
                >
                  Đổi kèn hiện tại
                </Button>
              </CardContent>
            </Card>
          ) : activeStep ? (
            <Card
              key={activeStep.id}
              className="bg-card/80 backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
            >
              <CardHeader className="gap-2">
                <Badge variant="secondary" className="w-fit">
                  Bước {stepIndex + 1} / {INPUT_STEPS.length}
                </Badge>
                <CardTitle
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-heading text-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {activeStep.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">{activeStep.description}</CardDescription>
                {current && phase !== 'horn' ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    So với <span className="font-medium text-foreground">{current.displayName}</span>
                  </p>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-col gap-6 pb-(--card-spacing)">
                {phase === 'horn' ? (
                  <FieldGroup>
                    <MentionFlow
                      embedded
                      sessionId={sessionId}
                      onConfirmed={(candidate) => {
                        setCurrent(candidate);
                        setConfirmError(undefined);
                        setResult(undefined);
                        goTo('reason');
                      }}
                    />
                    {confirmError ? <FieldError>{confirmError}</FieldError> : null}
                  </FieldGroup>
                ) : null}

                {phase === 'reason' ? (
                  <Field>
                    <FieldLabel htmlFor="upgrade-reason">Lý do muốn đổi</FieldLabel>
                    <Textarea
                      id="upgrade-reason"
                      className="min-h-24 text-base leading-relaxed md:text-base"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      aria-describedby={reasonHelpId}
                    />
                    <FieldDescription id={reasonHelpId}>
                      Ví dụ: cần âm sắc tối hơn, kèn hiện tại quá nặng, hoặc muốn chơi concert band.
                    </FieldDescription>
                  </Field>
                ) : null}

                {phase === 'level' && LEVEL_QUESTION ? (
                  <ChoiceFieldset
                    legend={LEVEL_QUESTION.prompt}
                    description={LEVEL_QUESTION.description}
                    options={LEVEL_QUESTION.choices}
                    value={currentLevel}
                    onChange={(next) => setCurrentLevel(next as Level)}
                  />
                ) : null}

                {phase === 'purpose' && PURPOSE_QUESTION ? (
                  <ChoiceFieldset
                    legend={PURPOSE_QUESTION.prompt}
                    description={PURPOSE_QUESTION.description}
                    options={PURPOSE_QUESTION.choices}
                    value={purpose}
                    onChange={(next) => setPurpose(next as Purpose)}
                  />
                ) : null}

                {phase === 'budget' && BUDGET_QUESTION ? (
                  <ChoiceFieldset
                    legend="Ngân sách nâng cấp"
                    description="Khoảng chi phí dự kiến cho mẫu tiếp theo, không phải giá kèn hiện tại."
                    options={BUDGET_QUESTION.choices}
                    value={upgradeBudget}
                    onChange={(next) => setUpgradeBudget(next as Budget)}
                  />
                ) : null}

                {error && phase === 'budget' ? (
                  <div
                    ref={errorRef}
                    role="alert"
                    tabIndex={-1}
                    aria-labelledby="upgrade-error-title"
                    className="border border-destructive/30 bg-destructive/10 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <h2 id="upgrade-error-title" className="font-heading text-sm font-semibold text-destructive">
                      Không gợi ý được
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-destructive">{error}</p>
                  </div>
                ) : null}

                {loading ? <Skeleton className="h-10 w-full" /> : null}

                {phase !== 'horn' ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="h-11 min-h-11 px-4 text-sm"
                      onClick={goBack}
                    >
                      Quay lại
                    </Button>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      {phase === 'reason' ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="lg"
                          className="h-11 min-h-11 px-4 text-sm"
                          onClick={() => goTo('level')}
                        >
                          Bỏ qua
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="lg"
                        className="h-11 min-h-11 px-4 text-sm"
                        disabled={loading}
                        onClick={goNext}
                      >
                        {isLastInput ? (
                          loading ? (
                            <>
                              <Loader2Icon
                                data-icon="inline-start"
                                className="motion-safe:animate-spin"
                                aria-hidden="true"
                              />
                              Đang gợi ý…
                            </>
                          ) : (
                            <>
                              <ArrowUpCircleIcon data-icon="inline-start" aria-hidden="true" />
                              Gợi ý nâng cấp
                            </>
                          )
                        ) : (
                          'Tiếp'
                        )}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>

      {phase === 'results' && result ? (
        <UpgradeResultPanel
          currentName={current?.displayName}
          loading={loading}
          result={result}
          sectionRef={resultsRef}
        />
      ) : null}
    </UpgradeChrome>
  );
}

function StepProgress({ onJump, phase }: { onJump: (id: InputStepId) => void; phase: WizardPhase }) {
  const currentIndex = phase === 'results' ? INPUT_STEPS.length : INPUT_STEPS.findIndex((step) => step.id === phase);
  const label =
    phase === 'results'
      ? `Hoàn tất. Đang xem gợi ý.`
      : `Bước ${currentIndex + 1} trên ${INPUT_STEPS.length}: ${INPUT_STEPS[currentIndex]?.title ?? ''}`;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium text-muted-foreground tabular-nums" aria-live="polite">
        {label}
      </p>
      <ol className="flex gap-2" aria-label="Tiến trình nâng cấp">
        {INPUT_STEPS.map((step, index) => {
          const complete = currentIndex > index;
          const current = currentIndex === index;
          return (
            <li key={step.id} className="min-w-0 flex-1">
              <button
                type="button"
                className="flex min-h-11 w-full items-center"
                aria-current={current ? 'step' : undefined}
                aria-label={`${step.title}${complete ? ', đã xong' : current ? ', đang làm' : ', chưa tới'}`}
                disabled={!complete}
                onClick={() => onJump(step.id)}
              >
                <span className={current || complete ? 'h-2 w-full bg-primary' : 'h-2 w-full bg-muted'} />
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ChoiceFieldset({
  description,
  legend,
  onChange,
  options,
  value,
}: {
  description: string;
  legend: string;
  onChange: (next: string) => void;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  return (
    <FieldSet>
      <FieldLegend className="sr-only">{legend}</FieldLegend>
      <FieldDescription>{description}</FieldDescription>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={value === option.value ? 'default' : 'outline'}
            size="lg"
            className="h-11 min-h-11 px-3 text-sm whitespace-nowrap"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </FieldSet>
  );
}

type UpgradeResultPanelProps = {
  currentName: string | undefined;
  loading: boolean;
  result: UpgradeRecommendation;
  sectionRef: RefObject<HTMLElement | null>;
};

function UpgradeResultPanel({ currentName, loading, result, sectionRef }: UpgradeResultPanelProps) {
  const headingId = 'upgrade-result-heading';

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-labelledby={headingId}
      aria-busy={loading}
      className="flex flex-col gap-6 outline-none motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
    >
      <div className="flex flex-col gap-2">
        <h2 id={headingId} className="font-heading text-2xl font-semibold tracking-tight">
          Gợi ý nâng cấp
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Sàn cấp: {TIER_LABEL[result.floor.minTier] ?? result.floor.minTier}
          {currentName ? ` · so với ${currentName}` : ''}. Chỉ mẫu cùng họ và không thấp hơn cấp hiện tại.
        </p>
      </div>

      {loading ? <Skeleton className="h-10 w-full" /> : null}

      {result.hasQualifyingCandidate ? (
        <ol className="flex flex-col gap-4">
          {result.items.map((item, index) => (
            <li key={`${item.modelId}-${item.rank}`}>
              <UpgradeRecommendationCard item={item} index={index} />
            </li>
          ))}
        </ol>
      ) : (
        <Card className="bg-card/80 backdrop-blur-xl">
          <CardHeader className="gap-2">
            <Badge variant="secondary" className="w-fit">
              Không có ứng viên
            </Badge>
            <CardTitle className="font-heading text-lg">Chưa có mẫu cùng họ đủ cấp</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Catalog không có mẫu nào cùng họ kèn và bằng hoặc trên cấp hiện tại trong khoảng ngân sách này. Thử nới
              ngân sách, hoặc xác nhận lại mẫu hiện tại nếu chọn nhầm.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </section>
  );
}

function UpgradeRecommendationCard({ index, item }: { index: number; item: PublicRecommendationItem }) {
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
            {item.reasons.map((reasonText) => (
              <li key={reasonText} className="flex gap-2 text-sm leading-relaxed">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{reasonText}</span>
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

export { UpgradePage };
