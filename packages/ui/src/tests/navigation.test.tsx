/** @vitest-environment happy-dom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '#/components/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/tabs';
import { TooltipProvider } from '#/components/tooltip';

afterEach(() => {
  cleanup();
});

describe('Tabs', () => {
  it('switches the selected panel', () => {
    render(
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Panel one</TabsContent>
        <TabsContent value="two">Panel two</TabsContent>
      </Tabs>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));

    expect(screen.getByText('Panel two')).toBeTruthy();
  });
});

describe('Sidebar', () => {
  it('renders provider, sidebar, and inset content', () => {
    render(
      <TooltipProvider>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>Workspace</SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Nav</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton>Home</SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>Main</SidebarInset>
        </SidebarProvider>
      </TooltipProvider>,
    );

    expect(screen.getByText('Workspace')).toBeTruthy();
    expect(screen.getByText('Nav')).toBeTruthy();
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Main')).toBeTruthy();
  });
});
