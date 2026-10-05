import { Head, Html, Main, NextScript } from 'next/document';

/**
 * Fallback for machines where the React DevTools *extension* can't be installed
 * (corporate Chrome policy). Run the standalone app instead:
 *
 *   npx react-devtools                                  # window with the Components tab
 *   NEXT_PUBLIC_RDT_STANDALONE=1 pnpm dev               # app connects to it on :8097
 *
 * The script must load before React, which is why it lives here and not in _app.
 */
const standaloneDevtools = process.env.NEXT_PUBLIC_RDT_STANDALONE === '1';

export default function Document() {
  return (
    <Html lang="en">
      <Head>{standaloneDevtools ? <script src="http://localhost:8097" /> : null}</Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
