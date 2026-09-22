export type Quote = {
  id: string;
  amount: number;
  termMonths: number;
  apr: number;
  monthlyPayment: number;
  fees: { origination: number };
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
  return res.json();
}
