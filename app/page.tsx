'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AppHeader } from '@/lib/AppHeader';
import { generateRoomId } from '@/lib/client-utils';
import { FIXED_ROOM_BY_EMAIL } from '@/lib/roomAccounts';
import { rememberOwnRoomPassword } from '@/lib/ownRoomPassword';
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

  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [newRoomPasswordEditing, setNewRoomPasswordEditing] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);

  const [fixedRoomHasPassword, setFixedRoomHasPassword] = useState(false);
  const [fixedRoomPasswordEditing, setFixedRoomPasswordEditing] = useState(false);
  const [fixedRoomPasswordInput, setFixedRoomPasswordInput] = useState('');
  const [fixedRoomPasswordSaving, setFixedRoomPasswordSaving] = useState(false);
  const [fixedRoomPasswordMessage, setFixedRoomPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;
    fetch('/api/join-history')
      .then((res) => (res.ok ? res.json() : { history: [] }))
      .then((data) => setJoinHistory(data.history ?? []))
      .catch(() => {});
  }, [email]);

  useEffect(() => {
    if (!fixedRoomId) return;
    fetch(`/api/room-password?roomName=${encodeURIComponent(fixedRoomId)}`)
      .then((res) => (res.ok ? res.json() : { hasPassword: false }))
      .then((data) => setFixedRoomHasPassword(!!data.hasPassword))
      .catch(() => {});
  }, [fixedRoomId]);

  const handleStartNewRoom = async () => {
    setCreatingRoom(true);
    try {
      const roomId = generateRoomId();
      const password = newRoomPassword.trim();
      if (password) {
        await fetch('/api/room-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: roomId,
            password,
            ttlSeconds: 60 * 60 * 24,
          }),
        }).catch(() => {
          // 設定に失敗してもルーム作成自体は継続する(パスワードなしになるだけ)
        });
        // 作った本人にまで直後の入室でパスワード入力を求めないよう覚えておく
        rememberOwnRoomPassword(roomId, password);
      }
      router.push(`/rooms/${roomId}`);
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleSaveFixedRoomPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixedRoomId) return;
    setFixedRoomPasswordSaving(true);
    setFixedRoomPasswordMessage(null);
    try {
      const password = fixedRoomPasswordInput.trim();
      const res = await fetch('/api/room-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: fixedRoomId, password }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setFixedRoomHasPassword(!!password);
      setFixedRoomPasswordMessage(password ? 'パスワードを設定しました' : 'パスワードを解除しました');
      setFixedRoomPasswordInput('');
      setFixedRoomPasswordEditing(false);
    } catch {
      setFixedRoomPasswordMessage('保存に失敗しました。もう一度お試しください。');
    } finally {
      setFixedRoomPasswordSaving(false);
    }
  };

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
      <AppHeader />
      <main className={styles.main} data-lk-theme="default">
        <p className={styles.tagline}>社内向けビデオ会議システム</p>
        {status !== 'loading' && (
          <div className={styles.tabContent}>
            {fixedRoomId && (
              <div className={styles.actionBlock}>
                <button
                  className={styles.primaryButton}
                  onClick={() => router.push(`/rooms/${fixedRoomId}`)}
                >
                  ミーティングの開始
                </button>
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setFixedRoomPasswordEditing((v) => !v)}
                >
                  {fixedRoomHasPassword ? '🔒 パスワード設定済み(変更する)' : '🔒 パスワードを設定'}
                </button>
                {fixedRoomPasswordEditing && (
                  <form className={styles.joinForm} onSubmit={handleSaveFixedRoomPassword}>
                    <input
                      className={styles.joinInput}
                      type="password"
                      placeholder="新しいパスワード(空欄で解除)"
                      value={fixedRoomPasswordInput}
                      onChange={(e) => setFixedRoomPasswordInput(e.target.value)}
                    />
                    <button
                      className={styles.joinButton}
                      type="submit"
                      disabled={fixedRoomPasswordSaving}
                    >
                      {fixedRoomPasswordSaving ? '保存中...' : '保存'}
                    </button>
                  </form>
                )}
                {fixedRoomPasswordMessage && (
                  <p className={styles.joinLabel}>{fixedRoomPasswordMessage}</p>
                )}
              </div>
            )}
            <div className={styles.actionBlock}>
              <button
                className={styles.secondaryButton}
                onClick={handleStartNewRoom}
                disabled={creatingRoom}
              >
                {creatingRoom ? '作成中...' : '新規ミーティング'}
              </button>
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setNewRoomPasswordEditing((v) => !v)}
              >
                {newRoomPassword ? '🔒 パスワード設定済み(変更する)' : '🔒 パスワードを設定'}
              </button>
              {newRoomPasswordEditing && (
                <input
                  className={styles.joinInput}
                  type="password"
                  placeholder="新規ミーティングのパスワード(任意)"
                  value={newRoomPassword}
                  onChange={(e) => setNewRoomPassword(e.target.value)}
                />
              )}
            </div>
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
              <button
                className={styles.joinButton}
                type="submit"
                disabled={!joinInput.trim() || checkingRoom}
              >
                {checkingRoom ? '確認中...' : '参加'}
              </button>
            </form>
            {joinError && <p className={styles.joinError}>{joinError}</p>}
          </div>
        )}
      </main>
      <footer data-lk-theme="default">リプライス株式会社</footer>
    </>
  );
}
