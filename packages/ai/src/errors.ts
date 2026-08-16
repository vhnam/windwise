export class MissingRequiredCriteriaError extends Error {
  readonly name = 'MissingRequiredCriteriaError';
  constructor(readonly missing: string[]) {
    super(`Missing required criteria: ${missing.join(', ')}`);
  }
}

export class ProviderUnavailableError extends Error {
  readonly name = 'ProviderUnavailableError';
  constructor(message = 'The conversational assistant is unavailable. Switch to the form.') {
    super(message);
  }
}

export class UnmappedCriteriaError extends Error {
  readonly name = 'UnmappedCriteriaError';
  constructor(message = 'Could not map the answer to a known option. Please rephrase or use the form.') {
    super(message);
  }
}
