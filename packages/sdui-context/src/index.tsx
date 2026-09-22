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

export function SduiProvider({ value, children }: { value: SduiContextValue; children: ReactNode }) {
  return <SduiContext.Provider value={value}>{children}</SduiContext.Provider>;
}

export function useSdui() {
  return useContext(SduiContext);
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
