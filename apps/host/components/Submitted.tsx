import { useSdui } from '@acme/sdui-context';
import type { NodeComponentProps } from './registry';

export function Submitted(_: NodeComponentProps) {
  const { user } = useSdui();
  return (
    <section className="ds-card ds-stack">
      <h2>Application submitted</h2>
      <p>Thanks{user ? `, ${user.name}` : ''}. We will email you within one business day.</p>
    </section>
  );
}
