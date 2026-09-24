'use client';
import * as React from 'react';
import { useMediaDeviceSelect } from '@livekit/components-react';
import type { LocalVideoTrack } from 'livekit-client';
import { BackgroundBlurSwitch } from './BackgroundBlurSwitch';

export interface CameraDeviceMenuProps {
  track?: LocalVideoTrack;
  initialSelection?: string;
  disabled?: boolean;
  onActiveDeviceChange?: (deviceId: string) => void;
}

/**
 * カメラの▼メニュー。ライブラリ標準の`MediaDeviceMenu`はデバイス一覧のポップアップしか
 * 出せず独自の項目を追加できないため、`useMediaDeviceSelect`で同じ見た目のポップアップを
 * 自作し、デバイス一覧の下に「背景をぼかす」スイッチを追加する(Zoom等と同じくカメラの
 * 設定メニューにまとめる形。通話中・プレルームどちらからも使う。2026-09-24、菅原さん指示)。
 */
export function CameraDeviceMenu({
  track,
  initialSelection,
  disabled,
  onActiveDeviceChange,
}: CameraDeviceMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({
    kind: 'videoinput',
    track,
  });

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
      onActiveDeviceChange?.(activeDeviceId);
    }
  }, [activeDeviceId, onActiveDeviceChange]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    // 親の`.lk-button-group-menu`が`position:relative`を持つため、`display:contents`で
    // このラッパー自体はレイアウトに影響させず、ポップアップの絶対配置の基準はそちらに任せる
    <div ref={wrapperRef} style={{ display: 'contents' }}>
      <button
        type="button"
        className="lk-button lk-button-menu"
        aria-pressed={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
      />
      {isOpen && (
        <div
          className="lk-list"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            right: 0,
            width: 'max-content',
            minWidth: '12rem',
            padding: '0.5rem',
            background: 'var(--lk-bg2, #1f1f1f)',
            border: '1px solid var(--lk-border-color, rgba(255,255,255,0.15))',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            zIndex: 5,
          }}
        >
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {devices.map((device) => (
              <li key={device.deviceId} data-lk-active={device.deviceId === activeDeviceId}>
                <button
                  type="button"
                  className="lk-button"
                  onClick={() => {
                    setActiveMediaDevice(device.deviceId);
                    setIsOpen(false);
                  }}
                >
                  {device.label || 'カメラ'}
                </button>
              </li>
            ))}
          </ul>
          <hr style={{ margin: '0.4rem 0', border: 'none', borderTop: '1px solid rgba(255,255,255,0.12)' }} />
          <BackgroundBlurSwitch track={track} />
        </div>
      )}
    </div>
  );
}
