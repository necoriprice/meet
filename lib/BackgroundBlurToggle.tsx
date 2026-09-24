'use client';
import * as React from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { BackgroundBlur } from '@livekit/track-processors';
import { isLocalTrack, LocalTrackPublication } from 'livekit-client';

/**
 * カメラ映像に背景ぼかしを適用するトグルボタン。`@livekit/track-processors`による
 * ブラウザ内処理(WASM)で、サーバー側の変更は不要。カメラのオン/オフや
 * デバイス切り替えでトラックが変わっても、有効中は自動的に再適用される。
 */
export function BackgroundBlurToggle() {
  const { cameraTrack } = useLocalParticipant();
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    const track = (cameraTrack as LocalTrackPublication | undefined)?.track;
    if (!track || !isLocalTrack(track)) return;
    if (enabled) {
      track.setProcessor(BackgroundBlur());
    } else {
      track.stopProcessor();
    }
  }, [cameraTrack, enabled]);

  return (
    <button
      type="button"
      className="lk-button"
      aria-pressed={enabled}
      onClick={() => setEnabled((v) => !v)}
    >
      背景ぼかし
    </button>
  );
}
