import { isBugOn } from '@acme/bugs';
import { formatMoney, formatPercent, greeting, useSdui } from '@acme/sdui-context';
import { useEffect, useRef, useState } from 'react';
import { fetchQuote, type Quote } from './api';
import { injectLegacyStyles } from './legacyStyles';
import type { NodeProps } from './types';

export default function OfferNode({ node, onNext }: NodeProps) {
  const ctx = useSdui();
  const { application, setField, user } = ctx;
  const terms = (node.props?.terms as number[] | undefined) ?? [36];
  const amount = Number(application.amount ?? node.props?.defaultAmount ?? 25000);
  const termMonths = Number(application.termMonths ?? terms[1] ?? terms[0]);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);
  // Every quote the user has seen, for the "compare offers" drawer (not built yet).
  const quoteHistory = useRef<Quote[][]>([]);

  useEffect(() => {
    injectLegacyStyles();
  }, []);

  useEffect(() => {
    setError(null);
    fetchQuote(amount, termMonths)
      .then((q) => {
        quoteHistory.current.push(new Array(50_000).fill({ ...q }));
        setQuote(q);
      })
      .catch((e) => setError(String(e)));
  }, [amount, termMonths]);

  useEffect(() => {
    const history = quoteHistory;
    const onResize = () => setCompact(window.innerWidth < 640 && history.current.length > 0);
    window.addEventListener('resize', onResize);
    if (isBugOn('listener-leak')) return;
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <section className="ds-card ds-stack" data-compact={compact || undefined}>
      <p className="ds-muted">{greeting(user)}, here is your personalised offer.</p>

      <div className="ds-row">
        <label className="ds-field">
          <span className="ds-field__label">Amount</span>
          <input
            className="ds-input"
            type="number"
            step={500}
            min={5000}
            max={75000}
            value={amount}
            onChange={(e) => setField('amount', Number(e.target.value))}
          />
        </label>
        <label className="ds-field">
          <span className="ds-field__label">Term</span>
          <select
            className="ds-input"
            value={termMonths}
            onChange={(e) => setField('termMonths', Number(e.target.value))}
          >
            {terms.map((t) => (
              <option key={t} value={t}>
                {t} months
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="ds-error">{error}</p> : null}

      {quote ? (
        <dl className="ds-offer" data-testid="offer">
          <div>
            <dt>Loan amount</dt>
            <dd>{formatMoney(quote.amount, ctx)}</dd>
          </div>
          <div>
            <dt>Monthly payment</dt>
            <dd className="ds-offer__big">{formatMoney(quote.monthlyPayment, ctx)}</dd>
          </div>
          <div>
            <dt>APR</dt>
            <dd>{formatPercent(quote.apr, ctx)}</dd>
          </div>
          <div>
            <dt>Origination fee</dt>
            <dd>{formatMoney(quote.fees.origination, ctx)}</dd>
          </div>
        </dl>
      ) : (
        <p className="ds-muted">Calculating…</p>
      )}

      <button className="ds-button" disabled={!quote} onClick={onNext}>
        Accept offer
      </button>
      <p className="ds-muted ds-footnote">offers release {process.env.NEXT_PUBLIC_RELEASE ?? 'dev'}</p>
    </section>
  );
}
