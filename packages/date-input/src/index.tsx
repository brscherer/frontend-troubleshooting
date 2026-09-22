import { useId, useState } from 'react';

export type DateInputProps = {
  value?: string;
  onChange: (isoDate: string) => void;
  max?: string;
};

/** Three-field date input (DD / MM / YYYY) that emits ISO dates. */
export function DateInput({ value, onChange, max }: DateInputProps) {
  const id = useId();
  const [parts, setParts] = useState(() => {
    const [y = '', m = '', d = ''] = (value ?? '').split('-');
    return { d, m, y };
  });

  const update = (key: 'd' | 'm' | 'y', v: string) => {
    const next = { ...parts, [key]: v.replace(/\D/g, '') };
    setParts(next);
    if (next.d.length && next.m.length && next.y.length === 4) {
      const iso = `${next.y}-${next.m.padStart(2, '0')}-${next.d.padStart(2, '0')}`;
      if (!max || iso <= max) onChange(iso);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8 }} role="group" aria-labelledby={id}>
      <input className="ds-input" aria-label="Day" placeholder="DD" maxLength={2} value={parts.d} onChange={(e) => update('d', e.target.value)} style={{ width: 64 }} />
      <input className="ds-input" aria-label="Month" placeholder="MM" maxLength={2} value={parts.m} onChange={(e) => update('m', e.target.value)} style={{ width: 64 }} />
      <input className="ds-input" aria-label="Year" placeholder="YYYY" maxLength={4} value={parts.y} onChange={(e) => update('y', e.target.value)} style={{ width: 96 }} />
    </div>
  );
}
