import { useSdui } from '@acme/sdui-context';
import type { ReactNode } from 'react';
import styles from './Layout.module.css';

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useSdui();
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.brand}>Acme Lending</span>
        <span className="ds-muted">{user ? user.name : 'Sign in'}</span>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
