import { greeting, useSdui } from '@acme/sdui-context';
import type { NodeComponentProps } from './registry';

export function Welcome({ onNext }: NodeComponentProps) {
  const { user } = useSdui();
  return (
    <section className="ds-card ds-stack">
      <h2>{greeting(user)} 👋</h2>
      <p>Personal loans from 5.000 to 75.000, decided in minutes. It takes about 4 minutes.</p>
      <button className="ds-button" onClick={onNext}>
        Start application
      </button>
    </section>
  );
}
