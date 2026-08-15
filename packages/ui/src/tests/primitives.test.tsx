/** @vitest-environment happy-dom */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Badge } from '#/components/badge';
import { Button } from '#/components/button';
import { Input } from '#/components/input';
import { Label } from '#/components/label';
import { Separator } from '#/components/separator';
import { Skeleton } from '#/components/skeleton';
import { Textarea } from '#/components/textarea';

afterEach(() => {
  cleanup();
});

describe('Button', () => {
  it('exposes its accessible name', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });

  it('respects the disabled state', () => {
    render(<Button disabled>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty('disabled', true);
  });
});

describe('Badge', () => {
  it('renders its text content', () => {
    render(<Badge>New</Badge>);

    expect(screen.getByText('New')).toBeTruthy();
  });
});

describe('Input', () => {
  it('renders an accessible textbox', () => {
    render(<Input aria-label="Email" placeholder="you@example.com" />);

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeTruthy();
  });
});

describe('Textarea', () => {
  it('renders an accessible multiline textbox', () => {
    render(<Textarea aria-label="Notes" />);

    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeTruthy();
  });
});

describe('Label', () => {
  it('associates with a control via htmlFor', () => {
    render(
      <>
        <Label htmlFor="name">Name</Label>
        <Input id="name" />
      </>,
    );

    expect(screen.getByLabelText('Name')).toBeTruthy();
  });
});

describe('Separator', () => {
  it('renders a horizontal separator', () => {
    const { container } = render(<Separator />);

    expect(container.querySelector('[data-slot="separator"]')).toBeTruthy();
  });
});

describe('Skeleton', () => {
  it('renders a loading placeholder', () => {
    const { container } = render(<Skeleton />);

    expect(container.querySelector('[data-slot="skeleton"]')).toBeTruthy();
  });
});
