'use client';
import * as React from 'react';
import { getOwnRoomPassword } from './ownRoomPassword';

/**
 * ルームにパスワードが設定されている場合、PreJoin画面より前に入力を求める。
 * 実際のアクセス制御はサーバー側(/api/connection-details)で行うため、ここでの
 * 確認はUXのため(誤入力に早く気づける)であり、セキュリティ上の唯一の関所ではない。
 * ただし「新規ミーティング」を作った本人(このタブでパスワードを覚えている場合)は
 * 直後の入室で自分の設定したパスワードを再入力させられないよう自動でスキップする。
 */
export function RoomPasswordGate({
  roomName,
  onVerified,
}: {
  roomName: string;
  onVerified: (password: string | undefined) => void;
}) {
  const [required, setRequired] = React.useState<boolean | null>(null);
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const onVerifiedRef = React.useRef(onVerified);
  onVerifiedRef.current = onVerified;

  React.useEffect(() => {
    const ownPassword = getOwnRoomPassword(roomName);
    if (ownPassword !== undefined) {
      setRequired(false);
      onVerifiedRef.current(ownPassword);
      return;
    }

    let cancelled = false;
    fetch(`/api/room-password?roomName=${encodeURIComponent(roomName)}`)
      .then((res) => (res.ok ? res.json() : { hasPassword: false }))
      .then((data: { hasPassword?: boolean }) => {
        if (cancelled) return;
        if (data.hasPassword) {
          setRequired(true);
        } else {
          setRequired(false);
          onVerifiedRef.current(undefined);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRequired(false);
          onVerifiedRef.current(undefined);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [roomName]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/room-verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, password }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (data.ok) {
        onVerifiedRef.current(password);
      } else {
        setError('パスワードが正しくありません');
      }
    } catch {
      setError('確認に失敗しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  if (!required) {
    return null;
  }

  return (
    <div
      style={{
        margin: 'auto',
        width: '100%',
        maxWidth: '360px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <p style={{ textAlign: 'center' }}>このルームはパスワードで保護されています</p>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
      >
        <input
          className="lk-form-control"
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        <button
          className="lk-button lk-join-button"
          type="submit"
          disabled={submitting || !password}
        >
          {submitting ? '確認中...' : '確認'}
        </button>
        {error && <p style={{ color: '#d64958', textAlign: 'center', margin: 0 }}>{error}</p>}
      </form>
    </div>
  );
}
