'use client';
import * as React from 'react';
import styles from '../styles/Home.module.css';

export interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
}

/** ミュート/フルアイコン付きの音量スライダー(0〜1) */
export function VolumeSlider({ value, onChange, ariaLabel }: VolumeSliderProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <div className={styles.volumeRow}>
      <span className={styles.volumeIcon} aria-hidden="true">
        🔇
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={percent}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className={styles.volumeSlider}
        style={{ ['--volume-percent' as string]: `${percent}%` }}
        aria-label={ariaLabel}
      />
      <span className={styles.volumeIcon} aria-hidden="true">
        🔊
      </span>
    </div>
  );
}
