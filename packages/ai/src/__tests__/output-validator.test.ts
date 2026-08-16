import { describe, expect, it } from 'vite-plus/test';

import { templatedRephrase, validateAssistantText } from '../output-validator.ts';

describe('validateAssistantText', () => {
  const toolResults = [
    {
      items: [
        {
          scoreBreakdown: {
            modelCode: 'YCL-255',
            displayName: 'Yamaha YCL-255',
            price: { amountMin: 11000000, amountMax: 15000000, scope: 'vn_street' },
          },
        },
      ],
    },
  ];

  it('accepts tokens present in the tool result', () => {
    expect(validateAssistantText('Gợi ý Yamaha YCL-255, giá khoảng 11000000 VND.', toolResults)).toEqual({ ok: true });
  });

  it('flags unsourced model codes', () => {
    const outcome = validateAssistantText('Bạn nên mua YAS-82Z với giá 99999999 VND.', toolResults);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.flaggedTokens.length).toBeGreaterThan(0);
    }
  });

  it('builds a templated fallback from the tool result', () => {
    expect(templatedRephrase(toolResults)).toContain('YCL-255');
  });
});
