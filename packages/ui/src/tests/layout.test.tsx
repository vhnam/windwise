/** @vitest-environment happy-dom */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/components/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '#/components/table';

afterEach(() => {
  cleanup();
});

describe('Card', () => {
  it('renders composed card sections', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your profile</CardDescription>
          <CardAction>Edit</CardAction>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );

    expect(screen.getByText('Account')).toBeTruthy();
    expect(screen.getByText('Manage your profile')).toBeTruthy();
    expect(screen.getByText('Edit')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
    expect(screen.getByText('Footer')).toBeTruthy();
  });
});

describe('Table', () => {
  it('renders a data table with caption', () => {
    render(
      <Table>
        <TableCaption>People</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getByText('People')).toBeTruthy();
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Ada')).toBeTruthy();
  });
});
