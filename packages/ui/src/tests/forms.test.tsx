/** @vitest-environment happy-dom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Field, FieldDescription, FieldError, FieldLabel } from '#/components/field';
import { Input } from '#/components/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '#/components/input-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/select';

afterEach(() => {
  cleanup();
});

describe('Field', () => {
  it('shows label, description, and error', () => {
    render(
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input id="email" />
        <FieldDescription>We will not share this.</FieldDescription>
        <FieldError>Email is required.</FieldError>
      </Field>,
    );

    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('We will not share this.')).toBeTruthy();
    expect(screen.getByText('Email is required.')).toBeTruthy();
  });
});

describe('InputGroup', () => {
  it('renders grouped control and addon', () => {
    const { container } = render(
      <InputGroup>
        <InputGroupAddon>@</InputGroupAddon>
        <InputGroupInput aria-label="Username" />
      </InputGroup>,
    );

    expect(container.querySelector('[data-slot="input-group"]')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Username' })).toBeTruthy();
    expect(screen.getByText('@')).toBeTruthy();
  });
});

describe('Select', () => {
  it('opens and shows options', () => {
    render(
      <Select defaultValue="apple">
        <SelectTrigger aria-label="Fruit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
        </SelectContent>
      </Select>,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));

    expect(screen.getByRole('option', { name: 'Orange' })).toBeTruthy();
  });
});
