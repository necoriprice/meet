'use client';
import * as React from 'react';
import { BackgroundBlur, VirtualBackground } from '@livekit/track-processors';
import type { LocalVideoTrack } from 'livekit-client';
import Desk from '../public/background-images/samantha-gades-BlIhVfXbi9s-unsplash.jpg';
import Nature from '../public/background-images/ali-kazal-tbw_KQE3Cbg-unsplash.jpg';

export type BackgroundEffectMode = 'none' | 'blur' | 'image';

export const BLUR_RADIUS_MIN = 2;
export const BLUR_RADIUS_MAX = 30;
export const BLUR_RADIUS_DEFAULT = 10;

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
  const [blurRadius, setBlurRadius] = React.useState(BLUR_RADIUS_DEFAULT);
  const [images, setImages] = React.useState(() => [...BACKGROUND_IMAGES]);
  const [imagePath, setImagePath] = React.useState(BACKGROUND_IMAGES[0].path);
  const createdObjectUrls = React.useRef<string[]>([]);

  React.useEffect(() => {
    if (!track) return;
    if (mode === 'blur') {
      track.setProcessor(BackgroundBlur(blurRadius));
    } else if (mode === 'image') {
      track.setProcessor(VirtualBackground(imagePath));
    } else {
      track.stopProcessor();
    }
  }, [track, mode, blurRadius, imagePath]);

  // タブを離れる際にアップロード画像のobject URLを解放する(追加した画像自体は消さない)
  React.useEffect(() => {
    return () => {
      createdObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const addCustomImage = React.useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    createdObjectUrls.current.push(url);
    const name = file.name.replace(/\.[^./]+$/, '') || 'カスタム背景';
    setImages((prev) => [...prev, { name, path: url }]);
    setImagePath(url);
    setMode('image');
  }, []);

  return {
    mode,
    setMode,
    blurRadius,
    setBlurRadius,
    images,
    imagePath,
    setImagePath,
    addCustomImage,
  };
}
