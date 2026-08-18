import { Link, useMatchRoute, useRouter } from '@tanstack/react-router';
import { BookOpen, ListChecks, ShieldAlert, Users, type LucideIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@windwise/ui/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@windwise/ui/components/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@windwise/ui/components/sidebar';

import { authClient } from '#/lib/auth-client';

type NavUrl = '/catalog' | '/catalog/review' | '/verification-queue' | '/settings/members';

const NAV_ITEMS: Array<{ title: string; url: NavUrl; icon: LucideIcon }> = [
  { title: 'Catalog', url: '/catalog', icon: BookOpen },
  { title: 'Review', url: '/catalog/review', icon: ListChecks },
  { title: 'Verification', url: '/verification-queue', icon: ShieldAlert },
  { title: 'Members', url: '/settings/members', icon: Users },
];

const getInitials = (name: string) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || 'WW';
};

export function AppSidebar() {
  const { isMobile } = useSidebar();
  const matchRoute = useMatchRoute();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const displayName = user?.name || 'Staff';
  const displayEmail = user?.email || '';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/catalog" />}>
              <img
                src="/favicon.png"
                alt="WindWise"
                width={32}
                height={32}
                decoding="async"
                className="size-8 rounded-md object-contain object-left dark:invert dark:hue-rotate-180"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">WindWise</span>
                <span className="truncate text-xs text-muted-foreground">Manager dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => {
              const isActive = Boolean(
                matchRoute({
                  to: item.url,
                  fuzzy: item.url !== '/catalog',
                }),
              );

              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton isActive={isActive} tooltip={item.title} render={<Link to={item.url} />}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
                render={<DropdownMenuTrigger />}
              >
                <Avatar size="sm">
                  {user?.image ? <AvatarImage src={user.image} alt={displayName} /> : null}
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
                </div>
              </SidebarMenuButton>
              <DropdownMenuContent side={isMobile ? 'bottom' : 'right'} align="end" className="min-w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    {displayName}
                    {displayEmail ? <span className="mt-1 block font-normal">{displayEmail}</span> : null}
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    void authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          void router.navigate({ to: '/auth/login' });
                        },
                      },
                    });
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
