'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../../styles/Login.module.css';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    // pushだとブラウザの「戻る」でログイン画面に戻ってしまうためreplaceする
    router.replace(callbackUrl);
  };

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.brandRow}>
          <img
            className={styles.logo}
            src="/images/riprice/riprice-meet-logo-256.png"
            alt="RIPRICE Meet"
            width="48"
            height="48"
          />
          <span className={styles.brandName}>RIPRICE Meet</span>
        </div>
        <h1 className={styles.title}>ログイン</h1>
        <p className={styles.subtitle}>
          RIPRICE Meetを利用するには
          <br />
          社内アカウントでログインしてください。
        </p>

        <button
          className={styles.googleButton}
          type="button"
          onClick={() => signIn('google', { callbackUrl })}
        >
          <svg className={styles.googleIcon} viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          Googleでログイン
        </button>
        <div className={styles.divider}>または</div>
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
          <div className={styles.passwordField}>
            <input
              id="password"
              className={styles.input}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
            >
              {showPassword ? '隠す' : '表示'}
            </button>
          </div>
          <p className={styles.helpText}>
            パスワードを忘れた場合は、管理者にお問い合わせください。
          </p>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.submitButton} type="submit" disabled={submitting}>
            {submitting ? 'ログイン中...' : '続ける'}
          </button>
        </form>
      </div>
    </main>
  );
}
