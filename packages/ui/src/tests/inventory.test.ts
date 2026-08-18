import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const componentsDir = fileURLToPath(new URL('../components/', import.meta.url));
const packageJsonPath = fileURLToPath(new URL('../../package.json', import.meta.url));

const ALL_MODULES = [
  'alert.tsx',
  'attachment.tsx',
  'avatar.tsx',
  'badge.tsx',
  'breadcrumb.tsx',
  'button-group.tsx',
  'button.tsx',
  'card.tsx',
  'chart.tsx',
  'dialog.tsx',
  'dropdown-menu.tsx',
  'empty.tsx',
  'field.tsx',
  'input-group.tsx',
  'input.tsx',
  'label.tsx',
  'pagination.tsx',
  'popover.tsx',
  'questionnaire.tsx',
  'select.tsx',
  'separator.tsx',
  'sheet.tsx',
  'sidebar.tsx',
  'skeleton.tsx',
  'table.tsx',
  'tabs.tsx',
  'textarea.tsx',
  'toast.tsx',
  'tooltip.tsx',
] as const;

const DOMAIN_BASENAME = /instrument|recommendation|consultation/i;
const DOMAIN_KEBAB = new Set(['provider-price-table', 'instrument-card', 'recommendation-card', 'consultation-step']);

describe('component inventory', () => {
  it('includes every component module file', () => {
    for (const fileName of ALL_MODULES) {
      expect(existsSync(join(componentsDir, fileName))).toBe(true);
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
      exports: Record<string, string>;
    };

    expect(packageJson.exports['./components/*']).toBe('./src/components/*.tsx');
  });

  it('does not encode Windwise domain names in component file basenames', () => {
    const files = readdirSync(componentsDir).filter((name) => name.endsWith('.tsx'));

    for (const fileName of files) {
      const basename = fileName.replace(/\.tsx$/, '');

      expect(DOMAIN_BASENAME.test(basename)).toBe(false);
      expect(DOMAIN_KEBAB.has(basename)).toBe(false);
    }
  });
});
