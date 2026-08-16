import { Link } from '@tanstack/react-router';
import { ClipboardListIcon, MessagesSquareIcon, ShieldCheckIcon } from 'lucide-react';

import { Badge } from '@windwise/ui/components/badge';
import { Button } from '@windwise/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@windwise/ui/components/card';
import { Separator } from '@windwise/ui/components/separator';

import { AppHeader } from '#/components/app-header';
import { UndrawIllustration, type UndrawName } from '#/components/illustrations';

type FeatureProps = {
  title: string;
  description: string;
  illustration: UndrawName;
};

const FEATURES: FeatureProps[] = [
  {
    title: 'Hội thoại có hướng dẫn',
    description: 'Trả lời bằng tiếng Việt. Hệ thống hỏi đúng những gì cần để lập tiêu chí, không bịa model hay giá.',
    illustration: 'chatting',
  },
  {
    title: 'Biểu mẫu dự phòng',
    description: 'Bỏ qua chat khi muốn điền nhanh, hoặc khi phiên hội thoại không tạo được.',
    illustration: 'forms',
  },
  {
    title: 'Gợi ý có giải thích',
    description: 'Kết quả đến từ catalog và logic xếp hạng. Mỗi gợi ý kèm lý do bạn có thể đọc lại.',
    illustration: 'lookingForAnswers',
  },
];

function HomePage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl motion-reduce:blur-none dark:bg-primary/25" />
        <div className="absolute top-40 -right-16 size-72 rounded-full bg-chart-2/20 blur-3xl motion-reduce:hidden" />
        <div className="absolute bottom-0 -left-10 size-80 rounded-full bg-chart-3/10 blur-3xl motion-reduce:hidden" />
      </div>

      <AppHeader />

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <main id="main-content" className="flex flex-1 flex-col gap-16 py-12 sm:gap-20 sm:py-16">
          <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
            <div className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Chọn kèn hơi với lời giải thích rõ ràng
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Tư vấn kèn hơi có giải thích, có biểu mẫu dự phòng. Hội thoại để làm rõ nhu cầu, hoặc điền form khi bạn
                muốn kiểm soát từng câu hỏi.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  nativeButton={false}
                  size="lg"
                  className="h-11 min-h-11 px-4 text-sm"
                  render={<Link to="/consult" />}
                >
                  <MessagesSquareIcon data-icon="inline-start" aria-hidden="true" />
                  Bắt đầu tư vấn
                </Button>
                <Button
                  nativeButton={false}
                  size="lg"
                  variant="outline"
                  className="h-11 min-h-11 px-4 text-sm"
                  render={<Link to="/form" />}
                >
                  <ClipboardListIcon data-icon="inline-start" aria-hidden="true" />
                  Dùng biểu mẫu
                </Button>
              </div>
              <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Model, giá và điểm xếp hạng không do mô hình ngôn ngữ tự bịa.
              </p>
            </div>

            <div className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:delay-100 motion-safe:duration-500">
              <UndrawIllustration name="composeMusic" className="mx-auto w-full max-w-md lg:max-w-none" />
              <Card className="bg-card/80 backdrop-blur-xl">
                <CardHeader className="gap-2">
                  <Badge variant="secondary">Hai lối vào</Badge>
                  <CardTitle className="font-heading text-lg">Chọn cách bạn muốn được tư vấn</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Cùng một bộ tiêu chí. Khác nhau ở cách thu thập — chat hoặc biểu mẫu tuần tự.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pb-(--card-spacing)">
                  <PathPreview
                    title="Hội thoại"
                    detail="Hỏi đáp tự nhiên, chuyển sang kết quả khi đủ tiêu chí."
                    illustration="chatting"
                  />
                  <Separator />
                  <PathPreview
                    title="Biểu mẫu"
                    detail="Từng câu hỏi một, bỏ qua được mục không chắc, rồi gửi để nhận gợi ý."
                    illustration="forms"
                  />
                </CardContent>
              </Card>
            </div>
          </section>

          <section aria-labelledby="home-features-heading" className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 id="home-features-heading" className="font-heading text-2xl font-semibold tracking-tight">
                Vì sao dùng WindWise
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Giao diện giúp bạn bắt đầu nhanh. Phần quyết định vẫn nằm ở dữ liệu catalog và logic gợi ý.
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <li key={feature.title}>
                  <Card
                    className="h-full bg-card/70 backdrop-blur-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
                    style={{ animationDelay: `${150 + index * 60}ms` }}
                  >
                    <div className="px-(--card-spacing) pt-(--card-spacing)">
                      <UndrawIllustration
                        name={feature.illustration}
                        className="mx-auto flex max-h-40 justify-center overflow-hidden [&_svg]:max-h-40"
                      />
                    </div>
                    <CardHeader className="gap-2">
                      <CardTitle className="text-base">{feature.title}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="home-cta-heading"
            className="bg-primary/10 ring-1 ring-foreground/10 backdrop-blur-md"
          >
            <div className="flex flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-10">
              <div className="flex max-w-xl flex-col gap-2">
                <h2 id="home-cta-heading" className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                  Sẵn sàng chọn kèn?
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Bắt đầu bằng hội thoại, hoặc mở biểu mẫu nếu bạn đã biết mình cần trả lời gì.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  nativeButton={false}
                  size="lg"
                  className="h-11 min-h-11 px-4 text-sm"
                  render={<Link to="/consult" />}
                >
                  Bắt đầu tư vấn
                </Button>
                <Button
                  nativeButton={false}
                  size="lg"
                  variant="outline"
                  className="h-11 min-h-11 px-4 text-sm"
                  render={<Link to="/form" />}
                >
                  Dùng biểu mẫu
                </Button>
              </div>
            </div>
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

type PathPreviewProps = {
  detail: string;
  illustration: UndrawName;
  title: string;
};

function PathPreview({ detail, illustration, title }: PathPreviewProps) {
  return (
    <div className="flex items-start gap-3">
      <UndrawIllustration name={illustration} className="w-20 shrink-0 sm:w-24" />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

export default HomePage;
