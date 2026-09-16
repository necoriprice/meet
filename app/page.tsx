'use client';

import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { generateRoomId } from '@/lib/client-utils';
import { FIXED_ROOM_BY_EMAIL } from '@/lib/roomAccounts';
import styles from '../styles/Home.module.css';

export default function Page() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const email = session?.user?.email?.toLowerCase();
  const fixedRoomId = email ? FIXED_ROOM_BY_EMAIL[email]?.roomId : undefined;

  return (
    <>
      <main className={styles.main} data-lk-theme="default">
        <div className={styles.header}>
          <div className={styles.headerRow}>
            <img
              src="/images/riprice/riprice-meet-logo-256.png"
              alt="RIPRICE Meet"
              width="56"
              height="56"
            />
            <h1 className={styles.appTitle}>RIPRICE Meet</h1>
          </div>
          <p className={styles.tagline}>社内向けビデオ会議システム</p>
        </div>
        {status !== 'loading' && (
          <div className={styles.tabContent}>
            {fixedRoomId && (
              <button
                className="lk-button"
                style={{ paddingBlock: '0.75rem' }}
                onClick={() => router.push(`/rooms/${fixedRoomId}`)}
              >
                ミーティングの開始
              </button>
            )}
            <button
              className="lk-button"
              style={{ paddingBlock: '0.75rem' }}
              onClick={() => router.push(`/rooms/${generateRoomId()}`)}
            >
              新規ミーティング
            </button>
          </div>
        )}
        {session?.user?.email && (
          <div className={styles.accountBar}>
            <span>{session.user.email}</span>
            <a href="/usage">利用状況</a>
            <button className="lk-button" onClick={() => signOut({ callbackUrl: '/' })}>
              ログアウト
            </button>
          </div>
        )}
      </main>
      <footer data-lk-theme="default">リプライス株式会社</footer>
    </>
  );
}
