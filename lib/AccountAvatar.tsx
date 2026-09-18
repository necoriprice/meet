'use client';
import * as React from 'react';
import styles from '../styles/Home.module.css';

export interface AccountAvatarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

/**
 * ヘッダーのアカウントアイコン。カメラオフ時のアバター(ParticipantAvatar)と同じ考え方で、
 * Googleアカウントの写真があればそれを、無ければ名前の頭文字アバターを表示する。
 */
export function AccountAvatar({ name, email, image }: AccountAvatarProps) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const label = name || email || '';
  const initial = Array.from(label.trim())[0]?.toUpperCase() ?? '?';

  if (image && !imageFailed) {
    return (
      <img
        className={styles.accountAvatar}
        src={image}
        alt=""
        referrerPolicy="no-referrer"
        title={email ?? undefined}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      className={`${styles.accountAvatar} ${styles.accountAvatarFallback}`}
      title={email ?? undefined}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}
