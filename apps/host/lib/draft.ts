import type { LoanApplication } from '@acme/sdui-context';

const KEY = 'acme:loan-draft';

/**
 * DEMO PLUMBING: `?seed=<name>` fills the application draft so you can jump straight to a
 * step instead of typing the forms. Combine with `?bugs=`, e.g.
 *   /apply/offer?seed=ana&bugs=singleton-split
 */
export const SEEDS: Record<string, LoanApplication> = {
  // The customer of the hero demo: employed, comfortably above the threshold.
  ana: { fullName: 'Ana Schmidt', email: 'ana@example.com', dateOfBirth: '1991-04-12', amount: 18000, employmentType: 'employed', employer: 'Helios GmbH', income: 45000 },
  // Right on the eligibility boundary: for the graph-cycle lightning bug.
  threshold: { fullName: 'Ana Schmidt', email: 'ana@example.com', amount: 18000, employmentType: 'employed', income: 30000 },
  // Takes the self-employed branch: for hydration-path and unknown-node.
  'self-employed': { fullName: 'Ana Schmidt', email: 'ana@example.com', amount: 18000, employmentType: 'self-employed', employer: 'Schmidt Design', income: 45000 },
};

/** Applies `?seed=` if present and removes it from the URL. Returns true when it seeded. */
export function applySeedFromUrl(): boolean {
  const params = new URLSearchParams(window.location.search);
  const seed = params.get('seed');
  if (seed === null) return false;
  if (SEEDS[seed]) saveDraft(SEEDS[seed]);
  else if (seed === '') saveDraft({});
  params.delete('seed');
  const query = params.toString();
  window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : ''));
  return true;
}

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
