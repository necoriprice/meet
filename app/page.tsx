'use client';

import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { generateRoomId } from '@/lib/client-utils';
import styles from '../styles/Home.module.css';

// 拠点別アカウントの固定ルームID対応表(2026-09-16決定)。該当しないアカウントは
// 「新規ミーティング」のみ表示する。
const FIXED_ROOM_BY_EMAIL: Record<string, string> = {
  'honsha1@riprice.co.jp': 'honsha-room-1',
  'honsha2@riprice.co.jp': 'honsha-room-2',
  'honsha3@riprice.co.jp': 'honsha-room-3',
  'tokyo1@riprice.co.jp': 'tokyo-room-1',
  'tokyo2@riprice.co.jp': 'tokyo-room-2',
  'tokyo3@riprice.co.jp': 'tokyo-room-3',
  'oosaka1@riprice.co.jp': 'oosaka-room-1',
  'oosaka2@riprice.co.jp': 'oosaka-room-2',
  'oosaka3@riprice.co.jp': 'oosaka-room-3',
};

export default function Page() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const email = session?.user?.email?.toLowerCase();
  const fixedRoomId = email ? FIXED_ROOM_BY_EMAIL[email] : undefined;

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
