/** @vitest-environment happy-dom */

import { cleanup, render, screen } from '@testing-library/react';
import { Bar, BarChart, XAxis } from 'recharts';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount } from '#/components/avatar';
import { ChartContainer } from '#/components/chart';
import {
  Questionnaire,
  QuestionnaireDescription,
  QuestionnaireItem,
  QuestionnaireTitle,
} from '#/components/questionnaire';

afterEach(() => {
  cleanup();
});

describe('Avatar', () => {
  it('renders fallback, badge, and group count', () => {
    render(
      <AvatarGroup>
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
          <AvatarBadge />
        </Avatar>
        <AvatarGroupCount>+2</AvatarGroupCount>
      </AvatarGroup>,
    );

    expect(screen.getByText('AB')).toBeTruthy();
    expect(screen.getByText('+2')).toBeTruthy();
    expect(document.querySelector('[data-slot="avatar-badge"]')).toBeTruthy();
  });
});

describe('Chart', () => {
  it('renders a chart container with series data', () => {
    const { container } = render(
      <ChartContainer config={{ desktop: { label: 'Desktop', color: 'oklch(0.5 0.1 200)' } }}>
        <BarChart data={[{ month: 'Jan', desktop: 10 }]}>
          <XAxis dataKey="month" />
          <Bar dataKey="desktop" />
        </BarChart>
      </ChartContainer>,
    );

    expect(container.querySelector('[data-slot="chart"]')).toBeTruthy();
  });
});

describe('Questionnaire', () => {
  it('renders a generic multi-step shell', () => {
    render(
      <Questionnaire>
        <QuestionnaireItem name="q1">
          <QuestionnaireTitle>What is your goal?</QuestionnaireTitle>
          <QuestionnaireDescription>Pick the closest match.</QuestionnaireDescription>
        </QuestionnaireItem>
      </Questionnaire>,
    );

    expect(screen.getByText('What is your goal?')).toBeTruthy();
    expect(screen.getByText('Pick the closest match.')).toBeTruthy();
  });
});
