export type QuoteRequest = { amount: number; termMonths: number };

export type Quote = {
  id: string;
  amount: number;
  termMonths: number;
  apr: number;
  monthlyPayment: number;
  fees?: { origination: number };
};

let seq = 0;

export function priceQuote({ amount, termMonths }: QuoteRequest, bugs: Set<string>): Quote {
  const apr = termMonths >= 60 ? 0.079 : termMonths >= 36 ? 0.069 : 0.065;
  const r = apr / 12;
  const monthlyPayment = Math.round(((amount * r) / (1 - Math.pow(1 + r, -termMonths))) * 100) / 100;
  const quote: Quote = {
    id: `q_${++seq}`,
    amount,
    termMonths,
    apr,
    monthlyPayment,
    fees: { origination: Math.round(amount * 0.01) },
  };
  // Pricing v2 dropped the fees block for long terms ("fees are bundled into APR").
  // The offers remote was never updated.
  if (bugs.has('prod-crash') && termMonths === 84) delete quote.fees;
  return quote;
}

/**
 * Small loans hit the legacy pricing engine, which is slow.
 * Deterministic so the race in the offers remote reproduces on stage.
 */
export function quoteLatencyMs(amount: number, bugs: Set<string>) {
  if (!bugs.has('quote-race')) return 120;
  return amount < 20000 ? 1500 : 150;
}
