import type { PropsWithChildren } from 'react';

import { SidebarInset, SidebarProvider } from '@windwise/ui/components/sidebar';

import { AppSidebar } from './app-sidebar';
import { ProtectedLayoutHeader } from './protected-layout-header';

export default function ProtectedLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <ProtectedLayoutHeader />
        <div className="flex-1 px-4 pb-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
