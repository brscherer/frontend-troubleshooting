import { SduiProvider, type LoanApplication, type SduiContextValue, type User } from '@acme/sdui-context';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BugSwitcher } from '../components/BugSwitcher';
import { loadDraft, saveDraft } from '../lib/draft';
import '../styles/design-system.css';

export type Session = { locale: string; currency: string; user: User };

export default function App({ Component, pageProps }: AppProps<{ session?: Session }>) {
  const router = useRouter();
  const session = pageProps.session;

  // The server can't see sessionStorage: render the first pass with an empty draft (like the
  // server did) and restore it after hydration, so both sides walk the same graph path.
  const [application, setApplication] = useState<LoanApplication>({});
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    setApplication(loadDraft());
    setRestored(true);
  }, []);

  useEffect(() => {
    if (restored) saveDraft(application);
  }, [restored, application]);

  const setField = useCallback<SduiContextValue['setField']>(
    (field, value) => setApplication((prev) => ({ ...prev, [field]: value })),
    [],
  );
  const goTo = useCallback((nodeId: string) => void router.push(`/apply/${nodeId}`), [router]);

  const value = useMemo<SduiContextValue>(
    () => ({
      locale: session?.locale ?? 'en-US',
      currency: session?.currency ?? 'USD',
      user: session?.user ?? null,
      application,
      setField,
      goTo,
    }),
    [session, application, setField, goTo],
  );

  return (
    <>
      <Head>
        <title>Acme Lending</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <SduiProvider value={value}>
        <Component {...pageProps} />
      </SduiProvider>
      <BugSwitcher />
      {/* Third-party tags managed by Marketing. */}
      <Script src="/vendor/analytics.js" strategy="afterInteractive" />
      <Script src="/vendor/chat-widget.js" strategy="lazyOnload" />
    </>
  );
}
