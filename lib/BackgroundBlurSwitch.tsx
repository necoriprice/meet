'use client';
import * as React from 'react';
import { BackgroundBlur } from '@livekit/track-processors';
import type { LocalVideoTrack } from 'livekit-client';

/**
 * カメラ映像に背景ぼかしを適用するON/OFFスイッチ(Zoom等と同じ見た目)。
 * `track`はカメラの▼メニューの呼び出し元(通話中/プレルームそれぞれ)から渡される
 * 実体の`LocalVideoTrack`で、このコンポーネント自体はコンテキストに依存しない。
 */
export function BackgroundBlurSwitch({ track }: { track?: LocalVideoTrack }) {
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    if (!track) return;
    if (enabled) {
      track.setProcessor(BackgroundBlur());
    } else {
      track.stopProcessor();
    }
  }, [track, enabled]);

  return (
    <div className="lk-switch-row">
      <span>背景をぼかす</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="背景をぼかす"
        className="lk-switch"
        onClick={() => setEnabled((v) => !v)}
      >
        <span className="lk-switch-thumb" />
      </button>
    </div>
  );
}
