'use client';
import * as React from 'react';

const SEGMENT_COUNT = 10;

/** Windowsのサウンド設定のような、区切られたバーで音声レベルを表示するメーター */
export function LevelMeterSegments({ level, ariaLabel }: { level: number; ariaLabel: string }) {
  const clamped = Math.min(1, Math.max(0, level));
  const activeCount = Math.round(clamped * SEGMENT_COUNT);

  return (
    <div
      className="lk-level-meter"
      role="meter"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(clamped * 100)}
    >
      {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
        <span
          key={i}
          className={`lk-level-meter-segment${i < activeCount ? ' lk-level-meter-segment-active' : ''}`}
        />
      ))}
    </div>
  );
}
