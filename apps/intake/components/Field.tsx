import type { ReactNode } from 'react';

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="ds-field">
      <span className="ds-field__label">{label}</span>
      {children}
      {hint ? <span className="ds-field__hint">{hint}</span> : null}
    </label>
  );
}
