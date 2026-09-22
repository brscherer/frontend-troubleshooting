import Fastify from 'fastify';
import { buildLoanGraph } from './graph.js';
import { priceQuote, quoteLatencyMs, type QuoteRequest } from './quotes.js';

const app = Fastify({ logger: { level: 'info' } });

/** Demo-only: the host forwards the presenter's bug switches as `x-bugs`. */
function bugsOf(headers: Record<string, unknown>): Set<string> {
  const fromHeader = typeof headers['x-bugs'] === 'string' ? headers['x-bugs'] : '';
  const cookie = typeof headers['cookie'] === 'string' ? headers['cookie'] : '';
  const fromCookie = cookie.split(/;\s*/).find((c) => c.startsWith('bugs='))?.slice(5) ?? '';
  return new Set(
    decodeURIComponent(`${fromHeader},${fromCookie}`)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

app.get('/health', async () => ({ ok: true }));

app.get('/graphs/loan', async (req) => buildLoanGraph(bugsOf(req.headers)));

app.post<{ Body: QuoteRequest }>('/quotes', async (req, reply) => {
  const bugs = bugsOf(req.headers);
  const amount = Number(req.body?.amount);
  const termMonths = Number(req.body?.termMonths);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(termMonths)) {
    return reply.code(400).send({ error: 'amount and termMonths are required' });
  }
  await new Promise((r) => setTimeout(r, quoteLatencyMs(amount, bugs)));
  return priceQuote({ amount, termMonths }, bugs);
});

const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
