import { Link } from '@tanstack/react-router';
import { LibraryBigIcon, MessagesSquareIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import type { DetailResult, ModelImage } from '@windwise/schemas';
import { Badge } from '@windwise/ui/components/badge';
import { Button } from '@windwise/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@windwise/ui/components/card';

import { AppBreadcrumb, type AppBreadcrumbItem } from '#/components/app-breadcrumb';
import { AppHeader } from '#/components/app-header';
import { UndrawIllustration } from '#/components/illustrations/index.ts';

import { TrustSignals } from './trust-signals.tsx';
import { VariantList } from './variant-list.tsx';

const TIER_LABEL: Record<string, string> = {
  student: 'Học sinh',
  intermediate: 'Trung cấp',
  professional: 'Chuyên nghiệp',
  custom: 'Tùy chỉnh',
};

function formatVndRange(min: number, max: number) {
  const fmt = (amount: number) => `${amount.toLocaleString('vi-VN')} ₫`;
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
}

function priceScopeLabel(price: { scope: string; isEstimate: boolean }) {
  if (price.scope === 'vn_street' && !price.isEstimate) {
    return 'Giá thị trường Việt Nam';
  }
  return 'Giá ước tính từ MSRP';
}

type InstrumentDetailPageProps = {
  detail: DetailResult;
};

function DetailShell({ crumbs, children }: { crumbs: AppBreadcrumbItem[]; children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl motion-reduce:blur-none dark:bg-primary/25" />
        <div className="absolute top-40 -right-16 size-72 rounded-full bg-chart-2/20 blur-3xl motion-reduce:hidden" />
        <div className="absolute bottom-0 -left-10 size-80 rounded-full bg-chart-3/10 blur-3xl motion-reduce:hidden" />
      </div>

      <AppHeader />
      <AppBreadcrumb items={crumbs} />

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <main id="main-content" className="flex flex-1 flex-col gap-8 py-10 sm:gap-10 sm:py-12">
          {children}
        </main>
        <footer className="border-t border-border pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <p className="text-xs leading-relaxed text-muted-foreground">
            WindWise — thông tin từ catalog đã công bố, không phải cửa hàng tự nghĩ ra sản phẩm.
          </p>
        </footer>
      </div>
    </div>
  );
}

function ImageGallery({ images }: { images: ModelImage[] }) {
  if (images.length === 0) {
    return (
      <Card className="bg-card/80 backdrop-blur-md">
        <div className="aspect-4/3 w-full bg-muted" aria-hidden="true" />
        <CardContent className="py-4">
          <p className="text-sm leading-relaxed text-muted-foreground">Chưa có ảnh cho nhạc cụ này.</p>
        </CardContent>
      </Card>
    );
  }

  const hero = images.find((image) => image.isPrimary) ?? images[0];
  const rest = images.filter((image) => image.id !== hero?.id);

  return (
    <div className="flex flex-col gap-4">
      {hero ? <ImageFigure image={hero} priority /> : null}
      {rest.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rest.map((image) => (
            <li key={image.id}>
              <ImageFigure image={image} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ImageFigure({ image, priority = false }: { image: ModelImage; priority?: boolean }) {
  return (
    <figure className="overflow-hidden bg-card/80 ring-1 ring-foreground/10 backdrop-blur-md">
      <img
        src={image.url}
        alt={image.altVi}
        className="aspect-4/3 h-auto w-full max-w-full object-cover"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
      <figcaption className="flex flex-col gap-1 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <span>Ảnh: {image.credit}</span>
        <span>Giấy phép: {image.licenseNote}</span>
      </figcaption>
    </figure>
  );
}

function InstrumentDetailPage({ detail }: InstrumentDetailPageProps) {
  if (detail.status === 'not_available') {
    return (
      <DetailShell
        crumbs={[{ label: 'Trang chủ', to: '/' }, { label: 'Danh mục', to: '/catalog' }, { label: 'Không khả dụng' }]}
      >
        <Card className="bg-card/80 backdrop-blur-md">
          <CardHeader className="items-center gap-3 text-center">
            <UndrawIllustration name="lookingForAnswers" className="mx-auto w-full max-w-xs" />
            <CardTitle className="text-lg">Nhạc cụ này hiện không khả dụng</CardTitle>
            <CardDescription className="max-w-md text-sm leading-relaxed">
              Bản ghi có thể chưa được công bố, đã lưu trữ, hoặc liên kết không còn đúng. Quay lại danh mục để xem nhạc
              cụ đang hiển thị.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center gap-3 pb-(--card-spacing) sm:flex-row">
            <Button nativeButton={false} className="h-11 min-h-11 px-4" render={<Link to="/catalog" />}>
              <LibraryBigIcon data-icon="inline-start" aria-hidden="true" />
              Xem danh mục
            </Button>
            <Button
              nativeButton={false}
              variant="outline"
              className="h-11 min-h-11 px-4"
              render={<Link to="/consult" />}
            >
              <MessagesSquareIcon data-icon="inline-start" aria-hidden="true" />
              Bắt đầu tư vấn
            </Button>
          </CardContent>
        </Card>
      </DetailShell>
    );
  }

  return (
    <DetailShell
      crumbs={[
        { label: 'Trang chủ', to: '/' },
        { label: 'Danh mục', to: '/catalog' },
        { label: detail.familySlug, to: '/catalog/$familySlug', params: { familySlug: detail.familySlug } },
        { label: detail.displayName },
      ]}
    >
      <section className="flex flex-col gap-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {detail.displayName}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{TIER_LABEL[detail.tier] ?? detail.tier}</Badge>
            <span className="text-xs tracking-wide text-muted-foreground uppercase">{detail.brandSlug}</span>
            <Badge
              variant="outline"
              render={<Link to="/catalog/$familySlug" params={{ familySlug: detail.familySlug }} />}
            >
              {detail.familySlug}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            nativeButton={false}
            variant="outline"
            className="h-11 min-h-11 px-4 text-sm"
            render={<Link to="/catalog" />}
          >
            <LibraryBigIcon data-icon="inline-start" aria-hidden="true" />
            Danh mục
          </Button>
          <Button nativeButton={false} className="h-11 min-h-11 px-4 text-sm" render={<Link to="/consult" />}>
            <MessagesSquareIcon data-icon="inline-start" aria-hidden="true" />
            Bắt đầu tư vấn
          </Button>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-8">
        <ImageGallery images={detail.images} />

        <div className="flex flex-col gap-6">
          <Card className="bg-card/80 backdrop-blur-md">
            <CardHeader className="gap-2">
              <CardTitle className="text-base">Giá</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Phạm vi giá được ghi rõ; đây không phải nút mua hàng.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pb-(--card-spacing)">
              {detail.price ? (
                <>
                  <p className="font-heading text-xl font-semibold tracking-tight">
                    {formatVndRange(detail.price.amountMin, detail.price.amountMax)}
                  </p>
                  <Badge variant={detail.price.isEstimate ? 'outline' : 'secondary'}>
                    {priceScopeLabel(detail.price)}
                  </Badge>
                </>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">Chưa có thông tin giá</p>
              )}
            </CardContent>
          </Card>

          <TrustSignals lastVerifiedAt={detail.lastVerifiedAt} source={detail.source} />
        </div>
      </div>

      {detail.variants.length > 0 ? (
        <Card className="bg-card/80 backdrop-blur-md">
          <CardHeader className="gap-2">
            <CardTitle className="text-base">Các biến thể</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Cùng một model gốc, khác nhau ở chi tiết như lớp hoàn thiện. Không phải các mục catalog trùng lặp.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-(--card-spacing)">
            <VariantList variants={detail.variants} />
          </CardContent>
        </Card>
      ) : null}
    </DetailShell>
  );
}

export { InstrumentDetailPage };
