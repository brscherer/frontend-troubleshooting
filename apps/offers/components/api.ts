export type Quote = {
  id: string;
  amount: number;
  termMonths: number;
  apr: number;
  monthlyPayment: number;
  /** Pricing v2 omits fees for long terms: they are bundled into the APR. */
  fees?: { origination: number };
};

// Relative on purpose: remotes run inside the host origin, which proxies /api/graph.
export async function fetchQuote(amount: number, termMonths: number, signal?: AbortSignal): Promise<Quote> {
  const res = await fetch('/api/graph/quotes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ amount, termMonths }),
    signal,
  });
  if (!res.ok) throw new Error(`Quote failed: ${res.status}`);
  const quote: Quote = await res.json();
  // Validate the wire at the boundary so contract drift fails here, not deep in render.
  if (typeof quote.monthlyPayment !== 'number' || typeof quote.apr !== 'number') {
    throw new Error(`Unexpected quote shape: ${JSON.stringify(quote).slice(0, 120)}`);
  }
  return quote;
}
