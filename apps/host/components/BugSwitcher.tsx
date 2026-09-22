/**
 * DEMO PLUMBING — the presenter's control panel. Ctrl+Shift+B to open.
 */
import { BUGS, parseBugs, readCookie, serializeBugs, type BugName } from '@acme/bugs';
import { useEffect, useState } from 'react';

export function BugSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Set<BugName>>(new Set());

  useEffect(() => {
    setActive(parseBugs(readCookie(document.cookie)));
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'b') setOpen((o) => !o);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  const apply = (next: Set<BugName>) => {
    document.cookie = `bugs=${encodeURIComponent(serializeBugs(next))}; path=/; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <aside
      style={{
        position: 'fixed', right: 16, bottom: 16, zIndex: 9999, width: 380, maxWidth: 'calc(100vw - 32px)',
        background: '#0b1020', color: '#e5e7eb', borderRadius: 10, padding: 16, font: '13px/1.4 ui-monospace, monospace',
        boxShadow: '0 12px 40px rgba(0,0,0,.35)',
      }}
    >
      <strong style={{ display: 'block', marginBottom: 8 }}>Bug switcher</strong>
      {(Object.keys(BUGS) as BugName[]).map((name) => (
        <label key={name} style={{ display: 'flex', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={active.has(name)}
            onChange={(e) => {
              const next = new Set(active);
              if (e.target.checked) next.add(name);
              else next.delete(name);
              apply(next);
            }}
          />
          <span>
            <b>{name}</b>
            <br />
            <span style={{ opacity: 0.65 }}>{BUGS[name]}</span>
          </span>
        </label>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button style={{ all: 'revert' }} onClick={() => apply(new Set())}>Clear all</button>
        <button
          style={{ all: 'revert' }}
          onClick={() => {
            sessionStorage.clear();
            window.location.href = '/apply/start';
          }}
        >
          Reset application
        </button>
      </div>
    </aside>
  );
}
