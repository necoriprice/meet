'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { generateRoomId } from '@/lib/client-utils';
import { FIXED_ROOM_BY_EMAIL } from '@/lib/roomAccounts';
import styles from '../styles/Home.module.css';

// 「ルーム名/room-idを含むURL」「ルーム名/room-idのみ」のどちらで入力されても
// 対応できるように、URLならpathからルームIDを取り出す
function extractRoomId(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/rooms\/([^/]+)/);
    if (match) return decodeURIComponent(match[1]);
  } catch {
    // URLでなければそのまま使う
  }
  return trimmed;
}

export default function Page() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const email = session?.user?.email?.toLowerCase();
  const fixedRoomId = email ? FIXED_ROOM_BY_EMAIL[email]?.roomId : undefined;
  const [joinInput, setJoinInput] = useState('');
  const [joinHistory, setJoinHistory] = useState<string[]>([]);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [checkingRoom, setCheckingRoom] = useState(false);

  useEffect(() => {
    if (!email) return;
    fetch('/api/join-history')
      .then((res) => (res.ok ? res.json() : { history: [] }))
      .then((data) => setJoinHistory(data.history ?? []))
      .catch(() => {});
  }, [email]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    const roomId = extractRoomId(joinInput);
    if (!roomId || !email) return;

    setCheckingRoom(true);
    try {
      const res = await fetch(`/api/room-exists?roomName=${encodeURIComponent(roomId)}`);
      const data = await res.json();
      if (!data.exists) {
        setJoinError('ミーティングルームが見つかりません');
        return;
      }
    } catch {
      setJoinError('確認に失敗しました。もう一度お試しください。');
      return;
    } finally {
      setCheckingRoom(false);
    }

    // 履歴保存はベストエフォート(失敗しても参加自体は続行する)
    fetch('/api/join-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId }),
    }).catch(() => {});
    router.push(`/rooms/${encodeURIComponent(roomId)}`);
  };

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
        {status !== 'loading' && (
          <div className={styles.tabContent}>
            <p className={styles.joinLabel}>ミーティングIDまたはURLで参加</p>
            <form className={styles.joinForm} onSubmit={handleJoin}>
              <input
                className={styles.joinInput}
                type="text"
                list="join-room-history"
                placeholder="例: honsha-room-1"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
              />
              <datalist id="join-room-history">
                {joinHistory.map((roomId) => (
                  <option key={roomId} value={roomId} />
                ))}
              </datalist>
              <button className="lk-button" type="submit" disabled={!joinInput.trim() || checkingRoom}>
                {checkingRoom ? '確認中...' : '参加'}
              </button>
            </form>
            {joinError && <p className={styles.joinError}>{joinError}</p>}
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
