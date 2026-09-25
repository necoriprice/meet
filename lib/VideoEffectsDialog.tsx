'use client';
import * as React from 'react';
import {
  BACKGROUND_IMAGES,
  type BackgroundEffectMode,
  type BlurStrength,
} from './useBackgroundEffect';
import styles from '../styles/Home.module.css';

export interface VideoEffectsDialogProps {
  mode: BackgroundEffectMode;
  onModeChange: (mode: BackgroundEffectMode) => void;
  strength: BlurStrength;
  onStrengthChange: (strength: BlurStrength) => void;
  imagePath: string;
  onImagePathChange: (path: string) => void;
  onClose: () => void;
}

/**
 * カメラ▼メニューの「ビデオとエフェクト」から開くダイアログ。簡易スイッチだけでは
 * 選べない、ぼかしの強さ・背景画像の選択をここにまとめる(菅原さん指示。当初は
 * カメラ▼の小さいポップアップに全部詰め込んでいたが「詰め込みすぎ」との指摘で分離)。
 */
export function VideoEffectsDialog({
  mode,
  onModeChange,
  strength,
  onStrengthChange,
  imagePath,
  onImagePathChange,
  onClose,
}: VideoEffectsDialogProps) {
  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.dialogCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHeader}>
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
              {BACKGROUND_IMAGES.map((bg) => (
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
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
