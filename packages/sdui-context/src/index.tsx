import { createContext, useContext, type ReactNode } from 'react';

export type User = { id: string; name: string } | null;

export type LoanApplication = Record<string, string | number | boolean | undefined>;

export type SduiContextValue = {
  locale: string;
  currency: string;
  user: User;
  application: LoanApplication;
  setField: (field: string, value: LoanApplication[string]) => void;
  goTo: (nodeId: string) => void;
};

// Sensible defaults so components render in isolation (Storybook, unit tests).
const defaultValue: SduiContextValue = {
  locale: 'en-US',
  currency: 'USD',
  user: null,
  application: {},
  setField: () => {},
  goTo: () => {},
};

export const SduiContext = createContext<SduiContextValue>(defaultValue);
SduiContext.displayName = 'SduiContext';

// Context identity is object identity: two copies of this module = two contexts that never
// see each other's Provider. Make that loud instead of silently rendering defaults.
if (typeof window !== 'undefined') {
  const w = window as unknown as { __ACME_SDUI_CONTEXT_COPIES__?: number };
  w.__ACME_SDUI_CONTEXT_COPIES__ = (w.__ACME_SDUI_CONTEXT_COPIES__ ?? 0) + 1;
  if (w.__ACME_SDUI_CONTEXT_COPIES__ > 1) {
    console.error(
      '[sdui-context] Multiple copies of @acme/sdui-context are loaded. ' +
        'Every federated app must list it in `shared` with `singleton: true`.',
    );
  }
}

export function SduiProvider({ value, children }: { value: SduiContextValue; children: ReactNode }) {
  return <SduiContext.Provider value={value}>{children}</SduiContext.Provider>;
}

let warnedNoProvider = false;

export function useSdui() {
  const value = useContext(SduiContext);
  if (value === defaultValue && !warnedNoProvider && process.env.NODE_ENV !== 'production') {
    warnedNoProvider = true;
    console.error(
      '[sdui-context] useSdui() found no SduiProvider and is rendering with defaults (en-US, USD, no user). ' +
        'If a Provider exists above this component, this module is probably duplicated.',
    );
  }
  return value;
}

export function formatMoney(amount: number, ctx: Pick<SduiContextValue, 'locale' | 'currency'>) {
  return new Intl.NumberFormat(ctx.locale, { style: 'currency', currency: ctx.currency }).format(amount);
}

export function formatPercent(rate: number, ctx: Pick<SduiContextValue, 'locale'>) {
  return new Intl.NumberFormat(ctx.locale, { style: 'percent', minimumFractionDigits: 1 }).format(rate);
}

export function greeting(user: User) {
  return `Hi, ${user?.name ?? 'Guest'}`;
}
