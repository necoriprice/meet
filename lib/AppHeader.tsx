'use client';
import { useSession } from 'next-auth/react';
import { AccountMenu } from './AccountMenu';
import { isUsageAdmin } from './adminAccess';
import styles from '../styles/Home.module.css';

/**
 * ロゴ+タイトルを左寄せ、アカウントメニューを右寄せにしたヘッダー。
 * ホーム画面とプレルーム画面の両方で使う。
 */
export function AppHeader() {
  const { data: session } = useSession();

  return (
    <header className={styles.topBar} data-lk-theme="default">
      <div className={styles.topBarBrand}>
        <img
          src="/images/riprice/riprice-meet-logo-256.png"
          alt="RIPRICE Meet"
          width="32"
          height="32"
        />
        <span className={styles.topBarTitle}>RIPRICE Meet</span>
      </div>
      {session?.user?.email && (
        <AccountMenu
          name={session.user.name}
          email={session.user.email}
          image={session.user.image}
          isAdmin={isUsageAdmin(session.user.email)}
        />
      )}
    </header>
  );
}
