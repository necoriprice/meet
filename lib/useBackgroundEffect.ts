'use client';
import * as React from 'react';
import { BackgroundBlur, VirtualBackground } from '@livekit/track-processors';
import type { LocalVideoTrack } from 'livekit-client';
import Desk from '../public/background-images/samantha-gades-BlIhVfXbi9s-unsplash.jpg';
import Nature from '../public/background-images/ali-kazal-tbw_KQE3Cbg-unsplash.jpg';

export type BackgroundEffectMode = 'none' | 'blur' | 'image';
export type BlurStrength = 'weak' | 'normal' | 'strong';

export const BLUR_RADIUS_BY_STRENGTH: Record<BlurStrength, number> = {
  weak: 5,
  normal: 10,
  strong: 20,
};

export const BACKGROUND_IMAGES = [
  { name: 'デスク', path: Desk.src },
  { name: '自然', path: Nature.src },
];

/**
 * 背景効果(なし/ぼかし/画像)の状態と、実際のカメラトラックへの適用をまとめて管理する。
 * カメラ▼メニューの簡易スイッチと「ビデオとエフェクト」ダイアログの両方から
 * 同じ状態を参照・変更できるように、呼び出し元(`CameraDeviceMenu`)で1つだけ生成して
 * 両方に渡す。`BackgroundBlur`の強さはprocessor稼働中でも`setProcessor`し直すだけで
 * 反映されるため、カメラの再起動は不要。
 */
export function useBackgroundEffect(track?: LocalVideoTrack) {
  const [mode, setMode] = React.useState<BackgroundEffectMode>('none');
  const [strength, setStrength] = React.useState<BlurStrength>('normal');
  const [imagePath, setImagePath] = React.useState(BACKGROUND_IMAGES[0].path);

  React.useEffect(() => {
    if (!track) return;
    if (mode === 'blur') {
      track.setProcessor(BackgroundBlur(BLUR_RADIUS_BY_STRENGTH[strength]));
    } else if (mode === 'image') {
      track.setProcessor(VirtualBackground(imagePath));
    } else {
      track.stopProcessor();
    }
  }, [track, mode, strength, imagePath]);

  return { mode, setMode, strength, setStrength, imagePath, setImagePath };
}
