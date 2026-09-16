'use client';

import { useEffect, useState } from 'react';
import styles from '../../styles/Usage.module.css';

interface UsageSummary {
  identity: string;
  sessionCount: number;
  totalDurationSeconds: number;
  lastLeftAt: number;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}時間${remainingMinutes}分` : `${remainingMinutes}分`;
}

function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString('ja-JP');
}

export default function UsagePage() {
  const [summary, setSummary] = useState<UsageSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/usage')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setSummary(data.summary))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className={styles.main} data-lk-theme="default">
      <h1 className={styles.title}>利用状況</h1>
      {error && <p>取得に失敗しました: {error}</p>}
      {!summary && !error && <p>読み込み中...</p>}
      {summary && summary.length === 0 && <p>まだ利用記録がありません。</p>}
      {summary && summary.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>アカウント</th>
              <th>利用回数</th>
              <th>合計利用時間</th>
              <th>最終利用</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row) => (
              <tr key={row.identity}>
                <td>{row.identity}</td>
                <td>{row.sessionCount}</td>
                <td>{formatDuration(row.totalDurationSeconds)}</td>
                <td>{formatDate(row.lastLeftAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
