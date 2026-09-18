'use client';
import * as React from 'react';
import { signOut } from 'next-auth/react';
import { AccountAvatar } from './AccountAvatar';
import styles from '../styles/Home.module.css';

export interface AccountMenuProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isAdmin: boolean;
}

/**
 * ヘッダーのアカウントアイコン。クリックするとメニューが開き、利用状況(admin限定)・設定・
 * ログアウトを表示する。「設定」は遷移先が未定のため、現時点では見た目のみ(準備中)。
 */
export function AccountMenu({ name, email, image, isAdmin }: AccountMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className={styles.accountMenuWrap}>
      <button
        type="button"
        className={styles.avatarButton}
        aria-pressed={isOpen}
        onClick={() => setIsOpen((v) => !v)}
      >
        <AccountAvatar name={name} email={email} image={image} />
      </button>
      {isOpen && (
        <ul className={styles.accountMenu}>
          {email && <li className={styles.accountMenuEmail}>{email}</li>}
          {isAdmin && (
            <li>
              <a href="/usage" className={styles.accountMenuItem}>
                利用状況
              </a>
            </li>
          )}
          <li>
            <button type="button" className={styles.accountMenuItem} disabled>
              設定
              <span className={styles.accountMenuBadge}>準備中</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={styles.accountMenuItem}
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              ログアウト
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
