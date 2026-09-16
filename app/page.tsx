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

const JOIN_HISTORY_MAX = 10;

// アカウント(メールアドレス)ごとに履歴を分ける。同じPC・ブラウザを複数アカウントで
// 使い回すケース(拠点共有PC等)があるため、ブラウザ単位ではなくアカウント単位にする
function joinHistoryKey(email: string): string {
  return `riprice-meet-join-history:${email}`;
}

function loadJoinHistory(email: string): string[] {
  try {
    const raw = window.localStorage.getItem(joinHistoryKey(email));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveJoinHistory(email: string, roomId: string, previous: string[]): string[] {
  const next = [roomId, ...previous.filter((id) => id !== roomId)].slice(0, JOIN_HISTORY_MAX);
  try {
    window.localStorage.setItem(joinHistoryKey(email), JSON.stringify(next));
  } catch {
    // ブラウザ側の制限等で保存に失敗しても致命的ではないため無視する
  }
  return next;
}

export default function Page() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const email = session?.user?.email?.toLowerCase();
  const fixedRoomId = email ? FIXED_ROOM_BY_EMAIL[email]?.roomId : undefined;
  const [joinInput, setJoinInput] = useState('');
  const [joinHistory, setJoinHistory] = useState<string[]>([]);

  useEffect(() => {
    if (email) {
      setJoinHistory(loadJoinHistory(email));
    }
  }, [email]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const roomId = extractRoomId(joinInput);
    if (!roomId || !email) return;
    saveJoinHistory(email, roomId, joinHistory);
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
              <button className="lk-button" type="submit" disabled={!joinInput.trim()}>
                参加
              </button>
            </form>
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
