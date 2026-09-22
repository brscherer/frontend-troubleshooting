import { isBugOn } from '@acme/bugs';

// The offers widget used to be embedded in a partner site via <script> and
// shipped its own stylesheet. Nobody removed it when it moved into the host.
const LEGACY_CSS = `
  .ds-card { padding: 8px; border-radius: 0; box-shadow: none; }
  .ds-card button { background: #e11d48; text-transform: uppercase; letter-spacing: .08em; }
  h1, h2 { font-family: Georgia, serif; }
`;

export function injectLegacyStyles() {
  if (!isBugOn('css-leak')) return;
  if (document.getElementById('offers-legacy-css')) return;
  const style = document.createElement('style');
  style.id = 'offers-legacy-css';
  style.textContent = LEGACY_CSS;
  document.head.appendChild(style);
}
