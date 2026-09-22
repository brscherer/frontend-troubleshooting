import type { ScreenNode } from '../lib/graph';
import styles from './Stepper.module.css';

export function Stepper({ steps, currentId }: { steps: ScreenNode[]; currentId: string }) {
  const currentIndex = steps.findIndex((s) => s.id === currentId);
  return (
    <ol className={styles.stepper} aria-label="Progress">
      {steps.map((s, i) => (
        <li
          key={s.id}
          className={i === currentIndex ? styles.current : i < currentIndex ? styles.done : undefined}
          aria-current={i === currentIndex ? 'step' : undefined}
        >
          <span className={styles.dot}>{i + 1}</span>
          {s.title}
        </li>
      ))}
    </ol>
  );
}
