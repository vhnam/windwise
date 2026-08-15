/** @vitest-environment happy-dom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Button } from '#/components/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '#/components/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '#/components/dropdown-menu';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '#/components/popover';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '#/components/sheet';
import { Toaster } from '#/components/toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '#/components/tooltip';

afterEach(() => {
  cleanup();
});

describe('Dialog', () => {
  it('opens and dismisses', () => {
    render(
      <Dialog>
        <DialogTrigger render={<Button />}>Open dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Confirm</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
    expect(screen.getByText('Confirm')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Confirm')).toBeNull();
  });
});

describe('Sheet', () => {
  it('opens and shows its title', () => {
    render(
      <Sheet>
        <SheetTrigger render={<Button />}>Open sheet</SheetTrigger>
        <SheetContent>
          <SheetTitle>Panel</SheetTitle>
        </SheetContent>
      </Sheet>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open sheet' }));
    expect(screen.getByText('Panel')).toBeTruthy();
  });
});

describe('Popover', () => {
  it('opens and shows its title', () => {
    render(
      <Popover>
        <PopoverTrigger render={<Button />}>Open popover</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>Details</PopoverTitle>
        </PopoverContent>
      </Popover>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open popover' }));
    expect(screen.getByText('Details')).toBeTruthy();
  });
});

describe('Tooltip', () => {
  it('shows content when open', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger render={<Button />}>Hint</TooltipTrigger>
          <TooltipContent>Helpful tip</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(screen.getByText('Helpful tip')).toBeTruthy();
  });
});

describe('DropdownMenu', () => {
  it('opens and shows a menu item', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button />}>Open menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('menuitem', { name: 'Profile' })).toBeTruthy();
  });
});

describe('Toast', () => {
  it('mounts a notice viewport', () => {
    render(<Toaster />);

    expect(document.querySelector('[data-slot="toast-viewport"]')).toBeTruthy();
  });
});
