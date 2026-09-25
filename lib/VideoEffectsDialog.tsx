'use client';
import * as React from 'react';
import type { BackgroundEffectMode, BlurStrength } from './useBackgroundEffect';
import styles from '../styles/Home.module.css';

export interface VideoEffectsDialogProps {
  mode: BackgroundEffectMode;
  onModeChange: (mode: BackgroundEffectMode) => void;
  strength: BlurStrength;
  onStrengthChange: (strength: BlurStrength) => void;
  images: { name: string; path: string }[];
  imagePath: string;
  onImagePathChange: (path: string) => void;
  onAddImage: (file: File) => void;
  onClose: () => void;
}

/**
 * カメラ▼メニューの「ビデオとエフェクト」から開くダイアログ。簡易スイッチだけでは
 * 選べない、ぼかしの強さ・背景画像の選択をここにまとめる(菅原さん指示。当初は
 * カメラ▼の小さいポップアップに全部詰め込んでいたが「詰め込みすぎ」との指摘で分離)。
 * タイトルバーをドラッグして自由に移動できる(初期位置は中央、菅原さん指示)。
 */
export function VideoEffectsDialog({
  mode,
  onModeChange,
  strength,
  onStrengthChange,
  images,
  imagePath,
  onImagePathChange,
  onAddImage,
  onClose,
}: VideoEffectsDialogProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [position, setPosition] = React.useState<{ x: number; y: number } | null>(null);
  const dragOffset = React.useRef<{ x: number; y: number } | null>(null);

  const handleHeaderPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    dragOffset.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    if (!position) {
      setPosition({ x: rect.left, y: rect.top });
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleHeaderPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragOffset.current) return;
    setPosition({
      x: event.clientX - dragOffset.current.x,
      y: event.clientY - dragOffset.current.y,
    });
  };

  const handleHeaderPointerUp = () => {
    dragOffset.current = null;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onAddImage(file);
    event.target.value = '';
  };

  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div
        ref={cardRef}
        className={styles.dialogCard}
        style={
          position
            ? { position: 'fixed', left: position.x, top: position.y, margin: 0 }
            : undefined
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={styles.dialogHeader}
          style={{ cursor: 'move', touchAction: 'none' }}
          onPointerDown={handleHeaderPointerDown}
          onPointerMove={handleHeaderPointerMove}
          onPointerUp={handleHeaderPointerUp}
        >
          <h2 className={styles.dialogTitle}>ビデオとエフェクト</h2>
          <button type="button" className={styles.dialogClose} onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>

        <section className={styles.dialogSection}>
          <span className={styles.dialogSectionHead}>背景効果</span>
          <div className="lk-segmented">
            <button
              type="button"
              className="lk-segmented-button"
              aria-pressed={mode === 'none'}
              onClick={() => onModeChange('none')}
            >
              なし
            </button>
            <button
              type="button"
              className="lk-segmented-button"
              aria-pressed={mode === 'blur'}
              onClick={() => onModeChange('blur')}
            >
              ぼかし
            </button>
            <button
              type="button"
              className="lk-segmented-button"
              aria-pressed={mode === 'image'}
              onClick={() => onModeChange('image')}
            >
              画像
            </button>
          </div>
        </section>

        {mode === 'blur' && (
          <section className={styles.dialogSection}>
            <span className={styles.dialogSectionHead}>強さ</span>
            <div className="lk-segmented">
              <button
                type="button"
                className="lk-segmented-button"
                aria-pressed={strength === 'weak'}
                onClick={() => onStrengthChange('weak')}
              >
                弱
              </button>
              <button
                type="button"
                className="lk-segmented-button"
                aria-pressed={strength === 'normal'}
                onClick={() => onStrengthChange('normal')}
              >
                標準
              </button>
              <button
                type="button"
                className="lk-segmented-button"
                aria-pressed={strength === 'strong'}
                onClick={() => onStrengthChange('strong')}
              >
                強
              </button>
            </div>
          </section>
        )}

        {mode === 'image' && (
          <section className={styles.dialogSection}>
            <span className={styles.dialogSectionHead}>背景画像</span>
            <div className="lk-background-image-grid">
              {images.map((bg) => (
                <button
                  key={bg.path}
                  type="button"
                  className="lk-background-image-thumb"
                  aria-pressed={imagePath === bg.path}
                  style={{ backgroundImage: `url(${bg.path})` }}
                  onClick={() => onImagePathChange(bg.path)}
                >
                  <span>{bg.name}</span>
                </button>
              ))}
              <button
                type="button"
                className="lk-background-image-add"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="lk-background-image-add-icon">＋</span>
                追加
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
