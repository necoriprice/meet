'use client';

import { useRouter } from 'next/navigation';
import { generateRoomId } from '@/lib/client-utils';
import styles from '../styles/Home.module.css';

// 3拠点の定例会議用に固定のルーム名を使う運用(design docの方針)。変更する場合は
// NEXT_PUBLIC_FIXED_ROOM_ID を設定する。
const FIXED_ROOM_ID = process.env.NEXT_PUBLIC_FIXED_ROOM_ID ?? 'honsha-room-1';

export default function Page() {
  const router = useRouter();

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
          <p className={styles.tagline}>社内向けリモート接客ビデオ会議システム</p>
        </div>
        <div className={styles.tabContent}>
          <button
            className="lk-button"
            style={{ paddingBlock: '0.75rem' }}
            onClick={() => router.push(`/rooms/${FIXED_ROOM_ID}`)}
          >
            ミーティングの開始
          </button>
          <button
            className="lk-button"
            style={{ paddingBlock: '0.75rem' }}
            onClick={() => router.push(`/rooms/${generateRoomId()}`)}
          >
            新規ミーティング
          </button>
        </div>
      </main>
      <footer data-lk-theme="default">リプライス株式会社</footer>
    </>
  );
}
