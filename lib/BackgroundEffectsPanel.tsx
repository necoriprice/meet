'use client';
import * as React from 'react';
import { BackgroundBlur, VirtualBackground } from '@livekit/track-processors';
import type { LocalVideoTrack } from 'livekit-client';
import Desk from '../public/background-images/samantha-gades-BlIhVfXbi9s-unsplash.jpg';
import Nature from '../public/background-images/ali-kazal-tbw_KQE3Cbg-unsplash.jpg';

type Mode = 'none' | 'blur' | 'image';
type BlurStrength = 'weak' | 'normal' | 'strong';

const BLUR_RADIUS: Record<BlurStrength, number> = { weak: 5, normal: 10, strong: 20 };
const BACKGROUND_IMAGES = [
  { name: 'デスク', path: Desk.src },
  { name: '自然', path: Nature.src },
];

/**
 * カメラの▼メニュー内の背景効果パネル。「なし/ぼかし/画像」の切り替えに加え、
 * ぼかしは強さ(弱/標準/強)、画像は差し替え先を選べる(Zoom等を参考、菅原さん指示)。
 * `BackgroundBlur`のblurRadiusはprocessor稼働中でも`setProcessor`し直すだけで
 * 反映されるため、カメラの再起動は不要。
 */
export function BackgroundEffectsPanel({ track }: { track?: LocalVideoTrack }) {
  const [mode, setMode] = React.useState<Mode>('none');
  const [strength, setStrength] = React.useState<BlurStrength>('normal');
  const [imagePath, setImagePath] = React.useState(BACKGROUND_IMAGES[0].path);

  React.useEffect(() => {
    if (!track) return;
    if (mode === 'blur') {
      track.setProcessor(BackgroundBlur(BLUR_RADIUS[strength]));
    } else if (mode === 'image') {
      track.setProcessor(VirtualBackground(imagePath));
    } else {
      track.stopProcessor();
    }
  }, [track, mode, strength, imagePath]);

  return (
    <div className="lk-background-effects">
      <div className="lk-segmented-row">
        <span className="lk-segmented-label">背景効果</span>
        <div className="lk-segmented">
          <button
            type="button"
            className="lk-segmented-button"
            aria-pressed={mode === 'none'}
            onClick={() => setMode('none')}
          >
            なし
          </button>
          <button
            type="button"
            className="lk-segmented-button"
            aria-pressed={mode === 'blur'}
            onClick={() => setMode('blur')}
          >
            ぼかし
          </button>
          <button
            type="button"
            className="lk-segmented-button"
            aria-pressed={mode === 'image'}
            onClick={() => setMode('image')}
          >
            画像
          </button>
        </div>
      </div>

      {mode === 'blur' && (
        <div className="lk-segmented-row">
          <span className="lk-segmented-label">強さ</span>
          <div className="lk-segmented">
            <button
              type="button"
              className="lk-segmented-button"
              aria-pressed={strength === 'weak'}
              onClick={() => setStrength('weak')}
            >
              弱
            </button>
            <button
              type="button"
              className="lk-segmented-button"
              aria-pressed={strength === 'normal'}
              onClick={() => setStrength('normal')}
            >
              標準
            </button>
            <button
              type="button"
              className="lk-segmented-button"
              aria-pressed={strength === 'strong'}
              onClick={() => setStrength('strong')}
            >
              強
            </button>
          </div>
        </div>
      )}

      {mode === 'image' && (
        <div className="lk-background-image-grid">
          {BACKGROUND_IMAGES.map((bg) => (
            <button
              key={bg.path}
              type="button"
              className="lk-background-image-thumb"
              aria-pressed={imagePath === bg.path}
              style={{ backgroundImage: `url(${bg.path})` }}
              onClick={() => setImagePath(bg.path)}
            >
              <span>{bg.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
