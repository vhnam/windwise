import { Link } from '@tanstack/react-router';
import { MessagesSquareIcon, RotateCcwIcon } from 'lucide-react';

import type { BudgetBand, CatalogFacets, ListingResult, Section } from '@windwise/schemas';
import { Badge } from '@windwise/ui/components/badge';
import { Button } from '@windwise/ui/components/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@windwise/ui/components/card';
import { Separator } from '@windwise/ui/components/separator';

import { AppBreadcrumb, type AppBreadcrumbItem } from '#/components/app-breadcrumb';
import { AppHeader } from '#/components/app-header';
import { UndrawIllustration } from '#/components/illustrations/index.ts';

import { FilterBar, type FilterBarValue } from './filter-bar.tsx';
import { InstrumentCard } from './instrument-card.tsx';

type CatalogFilters = {
  section?: Section;
  family?: string;
  budgetBand?: BudgetBand;
  brand?: string;
};

type CatalogPageProps = {
  filters: CatalogFilters;
  listing: ListingResult;
  facets: CatalogFacets;
  lockedFamily?: string;
  onFiltersChange: (next: CatalogFilters) => void;
};

function toFilterBarValue(filters: CatalogFilters, lockedFamily?: string): FilterBarValue {
  return {
    section: filters.section ?? '',
    family: lockedFamily ?? filters.family ?? '',
    budgetBand: filters.budgetBand ?? '',
    brand: filters.brand ?? '',
  };
}

function fromFilterBarValue(next: FilterBarValue, lockedFamily?: string): CatalogFilters {
  return {
    section: (next.section || undefined) as Section | undefined,
    family: lockedFamily ? undefined : next.family || undefined,
    budgetBand: (next.budgetBand || undefined) as BudgetBand | undefined,
    brand: next.brand || undefined,
  };
}

function CatalogPage({ filters, listing, facets, lockedFamily, onFiltersChange }: CatalogPageProps) {
  const filterBarValue = toFilterBarValue(filters, lockedFamily);
  const familyName = lockedFamily ? facets.families.find((family) => family.slug === lockedFamily)?.nameVi : undefined;
  const hasActiveFilters = Boolean(
    filters.section || (!lockedFamily && filters.family) || filters.budgetBand || filters.brand,
  );
  const heading = familyName ? `Danh mục ${familyName}` : 'Danh mục nhạc cụ';
  const crumbs: AppBreadcrumbItem[] = familyName
    ? [{ label: 'Trang chủ', to: '/' }, { label: 'Danh mục', to: '/catalog' }, { label: familyName }]
    : [{ label: 'Trang chủ', to: '/' }, { label: 'Danh mục' }];

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
          <section className="flex flex-col gap-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{heading}</h1>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Xem toàn bộ nhạc cụ đã công bố, không cần bắt đầu tư vấn. Lọc theo loại kèn, dòng, ngân sách hoặc thương
                hiệu.
              </p>
            </div>
            <Button
              nativeButton={false}
              size="lg"
              variant="outline"
              className="h-11 min-h-11 px-4 text-sm"
              render={<Link to="/consult" />}
            >
              <MessagesSquareIcon data-icon="inline-start" aria-hidden="true" />
              Bắt đầu tư vấn
            </Button>
          </section>

          <Card className="bg-card/80 backdrop-blur-xl">
            <CardHeader className="gap-2">
              <CardTitle className="text-base">Bộ lọc</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Thu hẹp danh sách. Mỗi lựa chọn cập nhật ngay, không cần gửi biểu mẫu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FilterBar
                value={filterBarValue}
                familyLocked={Boolean(lockedFamily)}
                brandOptions={facets.brands.map((brand) => ({ value: brand.slug, label: brand.name }))}
                familyOptions={facets.families.map((family) => ({ value: family.slug, label: family.nameVi }))}
                onChange={(next) => {
                  onFiltersChange(fromFilterBarValue(next, lockedFamily));
                }}
              />
            </CardContent>
            {hasActiveFilters ? (
              <CardFooter className="justify-between gap-3">
                <p className="text-xs leading-relaxed text-muted-foreground">Đang áp dụng bộ lọc.</p>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 min-h-11 px-3"
                  onClick={() => {
                    onFiltersChange(
                      fromFilterBarValue({ section: '', family: '', budgetBand: '', brand: '' }, lockedFamily),
                    );
                  }}
                >
                  <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
                  Xóa bộ lọc
                </Button>
              </CardFooter>
            ) : null}
          </Card>

          <section aria-labelledby="catalog-results-heading" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="catalog-results-heading" className="font-heading text-lg font-semibold tracking-tight">
                Kết quả
              </h2>
              <Badge variant="secondary">{listing.totalCount} nhạc cụ</Badge>
            </div>
            <Separator />

            {listing.totalCount === 0 ? (
              <Card className="bg-card/80 backdrop-blur-md">
                <CardHeader className="items-center gap-3 text-center">
                  <UndrawIllustration name="lookingForAnswers" className="mx-auto w-full max-w-xs" />
                  <CardTitle className="text-lg">Không có nhạc cụ nào phù hợp</CardTitle>
                  <CardDescription className="max-w-md text-sm leading-relaxed">
                    {hasActiveFilters
                      ? 'Thử bỏ bớt bộ lọc, hoặc bắt đầu tư vấn để nhận gợi ý theo nhu cầu của bạn.'
                      : 'Catalog chưa có nhạc cụ đã công bố. Quay lại sau, hoặc bắt đầu tư vấn nếu bạn cần hỗ trợ chọn kèn.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col justify-center gap-3 pb-(--card-spacing) sm:flex-row">
                  {hasActiveFilters ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 min-h-11 px-4"
                      onClick={() => {
                        onFiltersChange(
                          fromFilterBarValue({ section: '', family: '', budgetBand: '', brand: '' }, lockedFamily),
                        );
                      }}
                    >
                      Xóa bộ lọc
                    </Button>
                  ) : null}
                  <Button nativeButton={false} className="h-11 min-h-11 px-4" render={<Link to="/consult" />}>
                    <MessagesSquareIcon data-icon="inline-start" aria-hidden="true" />
                    Bắt đầu tư vấn
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listing.items.map((item, index) => (
                  <li
                    key={item.modelId}
                    className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
                    style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                  >
                    <Link
                      to="/instrument/$modelId"
                      params={{ modelId: item.modelId }}
                      className="group/instrument-link block cursor-pointer rounded-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <InstrumentCard
                        displayName={item.displayName}
                        brandSlug={item.brandSlug}
                        tier={item.tier}
                        price={item.price}
                        primaryImage={item.primaryImage}
                        variantCount={item.variantCount}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>

        <footer className="border-t border-border pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <p className="text-xs leading-relaxed text-muted-foreground">
            WindWise — danh mục công bố từ catalog, không phải cửa hàng tự nghĩ ra sản phẩm.
          </p>
        </footer>
      </div>
    </div>
  );
}

export { CatalogPage };
