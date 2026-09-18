'use client';
import * as React from 'react';
import { useAudioLevel } from './useAudioLevel';

/** マイクの入力音量をリアルタイムのバーで表示し、実際に音を拾えているか一目で確認できるようにする */
export function MicLevelMeter({ mediaStreamTrack }: { mediaStreamTrack?: MediaStreamTrack }) {
  const level = useAudioLevel(mediaStreamTrack);

  return (
    <div
      role="meter"
      aria-label="マイク入力レベル"
      aria-valuenow={Math.round(level * 100)}
      style={{
        width: '100%',
        height: '6px',
        borderRadius: '3px',
        backgroundColor: 'rgba(255,255,255,0.15)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.round(level * 100)}%`,
          height: '100%',
          backgroundColor: level > 0.05 ? '#22c55e' : 'rgba(255,255,255,0.3)',
          transition: 'width 80ms linear',
        }}
      />
    </div>
  );
}
