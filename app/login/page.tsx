'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../../styles/Login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setSubmitting(false);
    if (result?.error) {
      setError('メールアドレスまたはパスワードが正しくありません。');
      return;
    }
    router.push(callbackUrl);
  };

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.headerRow}>
          <img
            src="/images/riprice/riprice-meet-logo-256.png"
            alt="RIPRICE Meet"
            width="48"
            height="48"
          />
          <h1 className={styles.title}>RIPRICE Meet</h1>
        </div>
        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label} htmlFor="email">
            メールアドレス
          </label>
          <input
            id="email"
            className={styles.input}
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className={styles.label} htmlFor="password">
            パスワード
          </label>
          <input
            id="password"
            className={styles.input}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.submitButton} type="submit" disabled={submitting}>
            {submitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </main>
  );
}
