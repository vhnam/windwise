import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon, Loader2Icon, MessagesSquareIcon, ShieldCheckIcon } from 'lucide-react';
import { useState, type SubmitEvent } from 'react';
import * as v from 'valibot';

import { CriteriaSchema, formCriteriaQuestions } from '@windwise/schemas';
import { Badge } from '@windwise/ui/components/badge';
import { Button } from '@windwise/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@windwise/ui/components/card';
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '@windwise/ui/components/questionnaire';

import { submitForm } from '#/lib/server/consultation';
import { UndrawIllustration } from '#/modules/home-page/undraw-illustration';

const QUESTIONS = formCriteriaQuestions();

function criteriaFromFormData(formData: FormData) {
  const draft: Record<string, unknown> = {};
  for (const question of QUESTIONS) {
    if (question.multiple) {
      const selected = formData
        .getAll(question.name)
        .map(String)
        .filter((value) => value.length > 0);
      if (selected.length > 0) {
        draft[question.name] = selected;
      }
      continue;
    }
    const value = formData.get(question.name);
    if (typeof value === 'string' && value.length > 0) {
      draft[question.name] = value;
    }
  }
  return v.parse(CriteriaSchema, draft);
}

function questionErrorCopy(question: (typeof QUESTIONS)[number]) {
  if (question.multiple) {
    return 'Chọn ít nhất một mục, hoặc bỏ qua câu hỏi này.';
  }
  if (question.required) {
    return 'Vui lòng chọn một đáp án.';
  }
  return 'Chọn một đáp án, hoặc bỏ qua câu hỏi này.';
}

function FormPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setSubmitError(undefined);
    setSubmitting(true);
    try {
      const parsed = criteriaFromFormData(new FormData(event.currentTarget));
      const result = await submitForm({ data: parsed });
      await navigate({ to: '/result/$runId', params: { runId: result.runId } });
    } catch {
      setSubmitError('Không gửi được biểu mẫu. Thử lại, hoặc chuyển sang hội thoại.');
      setSubmitting(false);
    }
  }

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
          <Badge variant="outline">Biểu mẫu tư vấn</Badge>
        </header>

        <main className="flex flex-1 flex-col gap-10 py-10 sm:gap-12 sm:py-14">
          <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
            <div className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
              <div className="flex flex-col gap-3">
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  Điền từng câu hỏi, rồi nhận gợi ý
                </h1>
                <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                  Cùng bộ tiêu chí với hội thoại. Bỏ qua mục không chắc. Model, giá và điểm xếp hạng vẫn đến từ catalog,
                  không từ mô hình ngôn ngữ.
                </p>
              </div>
              <UndrawIllustration name="forms" className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-md" />
              <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Không thu thập thông tin định danh. Chỉ tiêu chí chọn kèn.
              </p>
              <Button
                nativeButton={false}
                size="lg"
                variant="outline"
                className="h-11 min-h-11 w-fit px-4 text-sm"
                render={<Link to="/consult" />}
              >
                <MessagesSquareIcon data-icon="inline-start" aria-hidden="true" />
                Chuyển sang hội thoại
              </Button>
            </div>

            <Card className="bg-card/80 backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:delay-100 motion-safe:duration-500">
              <CardHeader className="gap-2">
                <Badge variant="secondary" className="w-fit">
                  Từng bước
                </Badge>
                <CardTitle className="font-heading text-lg">Câu hỏi tư vấn</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {QUESTIONS.length} câu hỏi. Mục bắt buộc cần chọn trước khi sang bước tiếp theo.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-(--card-spacing)">
                {submitError ? (
                  <p
                    role="alert"
                    className="mb-4 border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm leading-relaxed text-destructive"
                  >
                    {submitError}{' '}
                    <Link to="/consult" className="font-medium underline underline-offset-4">
                      Mở hội thoại
                    </Link>
                  </p>
                ) : null}
                <Questionnaire
                  items={QUESTIONS}
                  shortcuts="letters"
                  aria-busy={submitting}
                  className={submitting ? 'pointer-events-none opacity-70' : undefined}
                  onSubmit={(event) => void onSubmit(event)}
                >
                  <QuestionnaireProgress />
                  {QUESTIONS.map((question) => (
                    <QuestionnaireItem
                      key={question.name}
                      name={question.name}
                      required={question.required}
                      multiple={question.multiple}
                    >
                      <QuestionnaireTitle className="font-heading text-base font-medium text-pretty">
                        {question.prompt}
                        {question.required ? (
                          <span className="ms-1 text-destructive" aria-hidden="true">
                            *
                          </span>
                        ) : (
                          <span className="ms-1.5 text-xs font-normal text-muted-foreground">(không bắt buộc)</span>
                        )}
                      </QuestionnaireTitle>
                      <QuestionnaireDescription className="text-sm leading-relaxed">
                        {question.description}
                      </QuestionnaireDescription>
                      <QuestionnaireChoices>
                        {question.choices.map((choice) => (
                          <QuestionnaireChoice key={choice.value} value={choice.value}>
                            {choice.label}
                          </QuestionnaireChoice>
                        ))}
                      </QuestionnaireChoices>
                      <QuestionnaireError>{questionErrorCopy(question)}</QuestionnaireError>
                    </QuestionnaireItem>
                  ))}
                  <QuestionnaireActions>
                    <QuestionnairePrevious>Quay lại</QuestionnairePrevious>
                    <QuestionnaireSkip>Bỏ qua</QuestionnaireSkip>
                    <QuestionnaireNext>Tiếp</QuestionnaireNext>
                    <QuestionnaireSubmit disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2Icon
                            data-icon="inline-start"
                            className="motion-safe:animate-spin"
                            aria-hidden="true"
                          />
                          Đang gửi…
                        </>
                      ) : (
                        'Nhận gợi ý'
                      )}
                    </QuestionnaireSubmit>
                  </QuestionnaireActions>
                </Questionnaire>
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

export default FormPage;
