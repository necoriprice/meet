'use client';
import * as React from 'react';
import { LAYOUT_MODE_LABELS, LayoutMode } from './layoutMode';

const OPTIONS: LayoutMode[] = ['grid', 'right', 'left', 'top'];

export interface LayoutMenuProps {
  layoutMode: LayoutMode;
  onChange: (mode: LayoutMode) => void;
}

/**
 * 参加者一覧(サムネイル)の表示位置を選ぶドロップダウン。画面共有とチャットの間に配置する。
 * `MediaDeviceMenu`と違い floating-ui(位置自動計算)には依存せず、単純な相対配置のポップアップにしている。
 */
export function LayoutMenu({ layoutMode, onChange }: LayoutMenuProps) {
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
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className="lk-button"
        aria-pressed={isOpen}
        onClick={() => setIsOpen((v) => !v)}
      >
        レイアウト: {LAYOUT_MODE_LABELS[layoutMode]}
      </button>
      {isOpen && (
        <ul
          className="lk-list"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: 0,
            width: 'max-content',
            minWidth: '8rem',
            padding: '0.5rem',
            background: 'var(--lk-bg2, #1f1f1f)',
            border: '1px solid var(--lk-border-color, rgba(255,255,255,0.15))',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            zIndex: 5,
          }}
        >
          {OPTIONS.map((option) => (
            <li key={option} data-lk-active={option === layoutMode}>
              <button
                type="button"
                className="lk-button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
              >
                {LAYOUT_MODE_LABELS[option]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
