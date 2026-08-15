import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const stylesPath = fileURLToPath(new URL('./styles.css', import.meta.url));

describe('styles.css', () => {
  it('exposes a non-empty stylesheet that imports Tailwind', () => {
    const content = readFileSync(stylesPath, 'utf-8');

    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain('@import "tailwindcss"');
  });
});
