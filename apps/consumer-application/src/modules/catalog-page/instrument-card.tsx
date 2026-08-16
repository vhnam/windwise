import { Badge } from '@windwise/ui/components/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@windwise/ui/components/card';

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

export type InstrumentCardProps = {
  displayName: string;
  brandSlug: string;
  tier: string;
  price?: { amountMin: number; amountMax: number; isEstimate: boolean };
  primaryImage?: { url: string; altVi: string; credit: string } | null;
  variantCount: number;
};

function InstrumentCard({ displayName, brandSlug, tier, price, primaryImage, variantCount }: InstrumentCardProps) {
  return (
    <Card className="h-full bg-card/80 backdrop-blur-md transition-[box-shadow,background-color] duration-200 group-hover/instrument-link:bg-card group-hover/instrument-link:shadow-md group-focus-visible/instrument-link:bg-card group-focus-visible/instrument-link:shadow-md">
      {primaryImage ? (
        <img
          src={primaryImage.url}
          alt={primaryImage.altVi}
          className="aspect-4/3 w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="aspect-4/3 w-full bg-muted" aria-hidden="true" />
      )}
      <CardHeader className="gap-1">
        <CardTitle className="text-base text-pretty">{displayName}</CardTitle>
        <CardDescription className="uppercase">{brandSlug}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{TIER_LABEL[tier] ?? tier}</Badge>
        {variantCount > 0 ? <Badge variant="outline">+{variantCount} biến thể</Badge> : null}
      </CardContent>
      <CardFooter className="text-sm font-medium">
        {price ? (
          <span>
            {formatVndRange(price.amountMin, price.amountMax)}
            {price.isEstimate ? <span className="ml-1 text-xs text-muted-foreground">(ước tính)</span> : null}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Chưa có giá</span>
        )}
      </CardFooter>
    </Card>
  );
}

export { InstrumentCard };
