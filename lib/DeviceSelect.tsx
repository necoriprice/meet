'use client';
import * as React from 'react';
import { useMediaDeviceSelect } from '@livekit/components-react';
import type { LocalAudioTrack } from 'livekit-client';
import styles from '../styles/Home.module.css';

export interface DeviceSelectProps {
  kind: 'audioinput' | 'audiooutput';
  initialSelection?: string;
  track?: LocalAudioTrack;
  onActiveDeviceChange: (deviceId: string) => void;
  disabled?: boolean;
}

/**
 * ライブラリ標準の`MediaDeviceMenu`(シェブロンのみのボタンを押すとポップアップで
 * デバイス一覧が開く形式)だと選択中のデバイス名が常時見えないため、Windowsのサウンド設定の
 * ように選択中のデバイス名をそのまま表示するネイティブ`<select>`を使う。
 */
export function DeviceSelect({
  kind,
  initialSelection,
  track,
  onActiveDeviceChange,
  disabled,
}: DeviceSelectProps) {
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind, track });

  const appliedInitialSelection = React.useRef(false);
  React.useEffect(() => {
    if (!appliedInitialSelection.current && initialSelection !== undefined) {
      appliedInitialSelection.current = true;
      setActiveMediaDevice(initialSelection);
    }
  }, [initialSelection, setActiveMediaDevice]);

  const previousActiveDeviceId = React.useRef(activeDeviceId);
  React.useEffect(() => {
    if (activeDeviceId !== previousActiveDeviceId.current) {
      previousActiveDeviceId.current = activeDeviceId;
      onActiveDeviceChange(activeDeviceId);
    }
  }, [activeDeviceId, onActiveDeviceChange]);

  const fallbackLabel = kind === 'audioinput' ? 'マイク' : 'スピーカー';
  const hasActiveInList = devices.some((d) => d.deviceId === activeDeviceId);

  return (
    <select
      className={styles.deviceSelect}
      value={hasActiveInList ? activeDeviceId : ''}
      onChange={(e) => setActiveMediaDevice(e.target.value)}
      disabled={disabled || devices.length === 0}
    >
      {!hasActiveInList && <option value="">デバイスが見つかりません</option>}
      {devices.map((d) => (
        <option key={d.deviceId} value={d.deviceId}>
          {d.label || fallbackLabel}
        </option>
      ))}
    </select>
  );
}
