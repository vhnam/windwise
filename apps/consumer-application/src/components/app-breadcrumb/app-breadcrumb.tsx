import { Link, type LinkProps } from '@tanstack/react-router';
import { Fragment } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@windwise/ui/components/breadcrumb';

export type AppBreadcrumbItem = {
  label: string;
  to?: LinkProps['to'];
  params?: LinkProps['params'];
};

type AppBreadcrumbProps = {
  items: AppBreadcrumbItem[];
};

function AppBreadcrumb({ items }: AppBreadcrumbProps) {
  const trail = items.filter((item) => item.label.length > 0);
  if (trail.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-border bg-background/80">
      <div className="mx-auto flex w-full max-w-5xl items-center px-4 sm:px-6 lg:px-8">
        <Breadcrumb aria-label="Đường dẫn trang" className="min-w-0 py-1">
          <BreadcrumbList className="gap-1 sm:gap-1.5">
            {trail.map((item, index) => {
              const isLast = index === trail.length - 1;
              const isLink = Boolean(item.to) && !isLast;

              return (
                <Fragment key={`${item.label}-${String(item.to ?? 'page')}-${index}`}>
                  {index > 0 ? <BreadcrumbSeparator /> : null}
                  <BreadcrumbItem>
                    {isLink && item.to ? (
                      <BreadcrumbLink
                        className="inline-flex min-h-11 max-w-40 items-center truncate sm:max-w-none"
                        render={<Link to={item.to} params={item.params} />}
                      >
                        {item.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="inline-flex min-h-11 max-w-48 items-center truncate sm:max-w-none">
                        {item.label}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}

export { AppBreadcrumb };
