export type ValidationOutcome = { ok: true } | { ok: false; flaggedTokens: string[] };

const MODEL_CODE = /\b[A-Z]{2,5}-?[A-Z0-9]{2,8}\b/g;
const CURRENCY = /\b\d{1,3}(?:[.,]\d{3})+(?:\s*(?:VND|USD|đ|₫))?\b|\b\d+(?:\.\d+)?\s*(?:triệu|VND|USD)\b/gi;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function tokenVariants(token: string): string[] {
  const stripped = token.replaceAll(/\s*(VND|USD|đ|₫|triệu)/gi, '').trim();
  return unique([token, stripped, stripped.replaceAll(',', '').replaceAll('.', '')]).filter(Boolean);
}

export function validateAssistantText(text: string, toolResults: unknown[]): ValidationOutcome {
  const haystack = JSON.stringify(toolResults);
  const tokens = unique([...(text.match(MODEL_CODE) ?? []), ...(text.match(CURRENCY) ?? [])]);
  const flaggedTokens = tokens.filter((token) => !tokenVariants(token).some((variant) => haystack.includes(variant)));

  if (flaggedTokens.length > 0) {
    return { ok: false, flaggedTokens };
  }
  return { ok: true };
}

export function templatedRephrase(toolResults: unknown[]): string {
  return `Kết quả tư vấn (chỉ dựa trên dữ liệu hệ thống):\n${JSON.stringify(toolResults, null, 2)}`;
}
