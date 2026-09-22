import { formatMoney, useSdui } from '@acme/sdui-context';
import type { NodeProps } from './types';

const LABELS: Record<string, string> = {
  fullName: 'Name',
  email: 'Email',
  amount: 'Amount',
  termMonths: 'Term (months)',
  employmentType: 'Employment',
  income: 'Annual income',
  coSignerName: 'Co-signer',
};

export default function ReviewNode({ onNext }: NodeProps) {
  const ctx = useSdui();
  const rows = Object.entries(LABELS).filter(([k]) => ctx.application[k] !== undefined);
  return (
    <section className="ds-card ds-stack">
      <dl className="ds-summary">
        {rows.map(([k, label]) => {
          const v = ctx.application[k];
          return (
            <div key={k}>
              <dt>{label}</dt>
              <dd>{k === 'amount' || k === 'income' ? formatMoney(Number(v), ctx) : String(v)}</dd>
            </div>
          );
        })}
      </dl>
      {rows.length === 0 ? <p className="ds-muted">Nothing to review yet.</p> : null}
      <button className="ds-button" onClick={onNext}>
        Submit application
      </button>
    </section>
  );
}
