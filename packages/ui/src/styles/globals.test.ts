import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const stylesPath = fileURLToPath(new URL('./globals.css', import.meta.url));

const CONTRAST_TOKENS = ['--background:', '--foreground:', '--primary:', '--primary-foreground:'] as const;

function extractBlock(source: string, selector: string) {
  const match = source.match(new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`));

  return match?.[1] ?? '';
}

describe('globals.css', () => {
  it('exposes a non-empty stylesheet that imports Tailwind', () => {
    const content = readFileSync(stylesPath, 'utf-8');

    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain('@import "tailwindcss"');
    expect(content).toContain('@import "@fontsource-variable/inter"');
    expect(content).not.toContain('../../../components/');
  });

  it('defines light and dark contrast token pairs', () => {
    const content = readFileSync(stylesPath, 'utf-8');
    const rootBlock = extractBlock(content, ':root');
    const darkBlock = extractBlock(content, '\\.dark');

    expect(rootBlock.length).toBeGreaterThan(0);
    expect(darkBlock.length).toBeGreaterThan(0);

    for (const token of CONTRAST_TOKENS) {
      expect(rootBlock).toContain(token);
      expect(darkBlock).toContain(token);
    }
  });
});
