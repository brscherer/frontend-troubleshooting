import type { LoanApplication } from '@acme/sdui-context';

const KEY = 'acme:loan-draft';

export function loadDraft(): LoanApplication {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function saveDraft(app: LoanApplication) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(app));
  } catch {
    /* private mode, quota — the draft is a convenience */
  }
}
