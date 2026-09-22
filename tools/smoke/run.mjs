// Usage: pnpm smoke [bug-name]   (dev profile must be running: pnpm dev)
// Checks every bug twice: flag OFF must look healthy, flag ON must reproduce.
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL ?? 'http://localhost:3100';
const DRAFT = { fullName: 'Ana Schmidt', email: 'ana@example.com', amount: 18000, employmentType: 'employed', income: 45000 };
const isNoise = (l) => /acme-analytics|HelpChat|helpchat|React DevTools|HMR|Fast Refresh/.test(l);

async function session({ bugs = '', draft }) {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext();
  await ctx.addCookies([{ name: 'bugs', value: encodeURIComponent(bugs), url: BASE }]);
  if (draft) {
    await ctx.addInitScript((d) => {
      if (!sessionStorage.getItem('acme:loan-draft')) sessionStorage.setItem('acme:loan-draft', d);
    }, JSON.stringify(draft));
  }
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  return { browser, ctx, page, logs, errors: () => logs.filter((l) => !isNoise(l) && /error/.test(l)) };
}

/** Each check returns a value; `healthy`/`buggy` decide pass/fail for OFF/ON. */
const checks = {
  'singleton-split': {
    async run(bugs) {
      const { browser, page } = await session({ bugs, draft: DRAFT });
      await page.goto(`${BASE}/apply/offer`);
      await page.waitForSelector('[data-testid=offer]');
      const text = await page.locator('main section').innerText();
      await browser.close();
      return text;
    },
    healthy: (t) => t.includes('Hi, Ana') && t.includes('€'),
    buggy: (t) => t.includes('Hi, Guest') && t.includes('$'),
  },
  'hydration-path': {
    async run(bugs) {
      const s = await session({ bugs, draft: { ...DRAFT, employmentType: 'self-employed' } });
      await s.page.goto(`${BASE}/apply/income`);
      await s.page.waitForTimeout(2500);
      await s.browser.close();
      // Dev: "Hydration failed…"; prod: "Minified React error #418 / #423".
      return s.logs.filter((l) => /hydrat|did not match|error #41[89]|error #42[35]/i.test(l)).length;
    },
    healthy: (n) => n === 0,
    buggy: (n) => n > 0,
  },
  'graph-cycle': {
    async run(bugs) {
      const { browser, page } = await session({ bugs, draft: { ...DRAFT, income: 30000 } });
      await page.goto(`${BASE}/apply/income`);
      await page.waitForSelector('form button');
      await page.waitForTimeout(300);
      page.getByRole('button', { name: 'Check eligibility' }).click({ timeout: 5000, noWaitAfter: true }).catch(() => {});
      const r = await page.waitForURL('**/apply/offer', { timeout: 6000 }).then(() => 'offer', () => 'frozen');
      await browser.close().catch(() => {});
      return r;
    },
    healthy: (r) => r === 'offer',
    buggy: (r) => r === 'frozen',
  },
  'unknown-node': {
    async run(bugs) {
      const { browser, page } = await session({ bugs, draft: { ...DRAFT, employmentType: 'self-employed' } });
      await page.goto(`${BASE}/apply/documents`);
      await page.waitForTimeout(2500);
      const n = await page.locator('main form, main [role=alert]').count();
      await browser.close();
      return n;
    },
    healthy: (n) => n > 0,
    buggy: (n) => n === 0,
  },
  'quote-race': {
    async run(bugs) {
      const { browser, page } = await session({ bugs, draft: { ...DRAFT, amount: 25000 } });
      await page.goto(`${BASE}/apply/offer`);
      await page.waitForSelector('[data-testid=offer]');
      const input = page.locator('input[type=number]').first();
      await input.fill('15000');
      await page.waitForTimeout(100);
      await input.fill('30000');
      await page.waitForTimeout(2500);
      const shown = await page.locator('[data-testid=offer] dd').first().innerText();
      await browser.close();
      return shown;
    },
    healthy: (s) => s.startsWith('30'),
    buggy: (s) => s.startsWith('15'),
  },
  'two-reacts': {
    async run(bugs) {
      const s = await session({ bugs });
      await s.page.goto(`${BASE}/apply/applicant`);
      await s.page.waitForTimeout(3500);
      const form = await s.page.locator('main form').count();
      await s.browser.close();
      return form;
    },
    healthy: (n) => n === 1,
    buggy: (n) => n === 0,
  },
  'listener-leak': {
    async run(bugs) {
      const { browser, ctx, page } = await session({ bugs, draft: DRAFT });
      await page.goto(`${BASE}/apply/offer`);
      await page.waitForSelector('[data-testid=offer]');
      for (let i = 0; i < 4; i++) {
        await page.getByRole('button', { name: 'Accept offer' }).click();
        await page.waitForURL('**/review');
        await page.goBack();
        await page.waitForSelector('[data-testid=offer]');
      }
      const cdp = await ctx.newCDPSession(page);
      const { result } = await cdp.send('Runtime.evaluate', { expression: 'window' });
      const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
      await browser.close();
      return listeners.filter((l) => l.type === 'resize').length;
    },
    healthy: (n) => n <= 2,
    buggy: (n) => n > 4,
  },
  'css-leak': {
    async run(bugs) {
      const { browser, page } = await session({ bugs, draft: DRAFT });
      await page.goto(`${BASE}/apply/income`);
      await page.waitForSelector('form button');
      await page.getByRole('button', { name: 'Check eligibility' }).click();
      await page.waitForSelector('[data-testid=offer]');
      await page.goBack();
      await page.waitForSelector('form button');
      const tt = await page.locator('main button').first().evaluate((b) => getComputedStyle(b).textTransform);
      await browser.close();
      return tt;
    },
    healthy: (t) => t === 'none',
    buggy: (t) => t === 'uppercase',
  },
  'prod-crash': {
    async run(bugs) {
      const { browser, page } = await session({ bugs, draft: { ...DRAFT, termMonths: 84 } });
      await page.goto(`${BASE}/apply/offer`);
      await page.waitForTimeout(3000);
      const crashed = await page.getByText('temporarily unavailable').count();
      await browser.close();
      return crashed;
    },
    healthy: (n) => n === 0,
    buggy: (n) => n === 1,
  },
  // stale-remote-entry needs a prod build + redeploy: see docs/bugs/03-stale-remote-entry.md
};

const only = process.argv[2];
let failed = 0;
for (const [name, c] of Object.entries(checks)) {
  if (only && only !== name) continue;
  const off = await c.run('').catch((e) => `error: ${e.message.split('\n')[0]}`);
  const on = await c.run(name).catch((e) => `error: ${e.message.split('\n')[0]}`);
  const ok = c.healthy(off) && c.buggy(on);
  if (!ok) failed++;
  console.log(`${ok ? '✔' : '✘'} ${name.padEnd(16)} off=${JSON.stringify(off).slice(0, 60)}  on=${JSON.stringify(on).slice(0, 60)}`);
}
process.exit(failed ? 1 : 0);
