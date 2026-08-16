import { Link } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';

import { Badge } from '@windwise/ui/components/badge';
import { Button } from '@windwise/ui/components/button';

import logoPng from '#/assets/logo.png';

type BackTo = '/' | '/consult';

type AppHeaderProps = {
  badge: string;
  backTo?: BackTo;
};

const BACK_LABEL: Record<BackTo, string> = {
  '/': 'Về trang chủ WindWise',
  '/consult': 'Về trang chọn cách tư vấn',
};

const LOGO_CLASS =
  'h-9 w-auto max-w-[min(100%,10.5rem)] rounded-md object-contain object-left ring-1 ring-border sm:h-10 dark:invert dark:hue-rotate-180';

function BrandLogo({ alt }: { alt: string }) {
  return <img src={logoPng} alt={alt} width={944} height={264} decoding="async" className={LOGO_CLASS} />;
}

function AppHeader({ badge, backTo }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 sm:gap-4">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:ring-2 focus:ring-ring"
      >
        Bỏ qua đến nội dung chính
      </a>
      {backTo ? (
        <Button
          nativeButton={false}
          variant="ghost"
          className="h-11 min-h-11 max-w-full shrink gap-2 px-1.5"
          render={<Link to={backTo} />}
        >
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          <span className="sr-only">{BACK_LABEL[backTo]}</span>
          <BrandLogo alt="" />
        </Button>
      ) : (
        <span className="inline-flex h-11 min-h-11 items-center">
          <BrandLogo alt="WindWise" />
        </span>
      )}
      <Badge variant="outline" className="shrink-0">
        {badge}
      </Badge>
    </header>
  );
}

export { AppHeader };
