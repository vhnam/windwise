import { Link } from '@tanstack/react-router';

import logoPng from '#/assets/logo.png';

const LOGO_CLASS =
  'h-8 w-auto max-w-[min(100%,9.5rem)] rounded-md object-contain object-left ring-1 ring-border sm:h-9 dark:invert dark:hue-rotate-180';

function BrandLogo() {
  return <img src={logoPng} alt="WindWise" width={944} height={264} decoding="async" className={LOGO_CLASS} />;
}

function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 w-full max-w-5xl items-center px-4 py-2 sm:px-6 lg:px-8">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:ring-2 focus:ring-ring"
        >
          Bỏ qua đến nội dung chính
        </a>
        <Link
          to="/"
          className="inline-flex h-11 min-h-11 shrink-0 items-center rounded-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandLogo />
        </Link>
      </div>
    </header>
  );
}

export { AppHeader };
