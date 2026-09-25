'use client';
import * as React from 'react';

export interface BackgroundBlurSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

/** カメラの▼メニュー内の「背景をぼかす」ON/OFFスイッチ(Zoom等を参考) */
export function BackgroundBlurSwitch({ enabled, onChange }: BackgroundBlurSwitchProps) {
  return (
    <div className="lk-switch-row">
      <span>背景をぼかす</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="背景をぼかす"
        className="lk-switch"
        onClick={() => onChange(!enabled)}
      >
        <span className="lk-switch-thumb" />
      </button>
    </div>
  );
}
