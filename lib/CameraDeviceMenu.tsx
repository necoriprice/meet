'use client';
import * as React from 'react';
import { useMediaDeviceSelect } from '@livekit/components-react';
import type { LocalVideoTrack } from 'livekit-client';
import { BackgroundBlurSwitch } from './BackgroundBlurSwitch';
import { useBackgroundEffect } from './useBackgroundEffect';
import { VideoEffectsDialog } from './VideoEffectsDialog';

export interface CameraDeviceMenuProps {
  track?: LocalVideoTrack;
  initialSelection?: string;
  disabled?: boolean;
  onActiveDeviceChange?: (deviceId: string) => void;
}

/**
 * カメラの▼メニュー。ライブラリ標準の`MediaDeviceMenu`はデバイス一覧のポップアップしか
 * 出せず独自の項目を追加できないため、`useMediaDeviceSelect`で同じ見た目のポップアップを
 * 自作し、デバイス一覧の下に「背景をぼかす」の簡易スイッチと「ビデオとエフェクト」を
 * 追加する(Zoom等と同じくカメラの設定メニューにまとめる形。通話中・プレルームどちらからも
 * 使う。2026-09-24、菅原さん指示)。ぼかしの強さ・背景画像の選択は小さいポップアップに
 * 詰め込みすぎとの指摘を受け、`VideoEffectsDialog`に分離している。
 */
export function CameraDeviceMenu({
  track,
  initialSelection,
  disabled,
  onActiveDeviceChange,
}: CameraDeviceMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isEffectsDialogOpen, setIsEffectsDialogOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({
    kind: 'videoinput',
    track,
  });
  const { mode, setMode, strength, setStrength, imagePath, setImagePath } =
    useBackgroundEffect(track);

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
      if (event.target === buttonRef.current) return;
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    // ライブラリ標準の`MediaDeviceMenu`と同じくFragmentを返し、ボタンとポップアップを
    // `.lk-button-group-menu`の直接の子にする。間に余計なラッパー要素を挟むと、
    // マイク側と見た目を揃えている`.lk-button-group-menu > .lk-button`系のCSSが
    // (子コンビネータのため)効かなくなり、カメラの▼だけ独立した見た目になってしまう。
    <>
      <button
        ref={buttonRef}
        type="button"
        className="lk-button lk-button-menu"
        aria-pressed={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
      />
      {isOpen && (
        <div
          ref={popupRef}
          className="lk-list"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            right: 0,
            width: 'max-content',
            minWidth: '14rem',
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
          <BackgroundBlurSwitch
            enabled={mode !== 'none'}
            onChange={(enabled) => setMode(enabled ? 'blur' : 'none')}
          />
          <button
            type="button"
            className="lk-button"
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => {
              setIsEffectsDialogOpen(true);
              setIsOpen(false);
            }}
          >
            ビデオとエフェクト
          </button>
        </div>
      )}
      {isEffectsDialogOpen && (
        <VideoEffectsDialog
          mode={mode}
          onModeChange={setMode}
          strength={strength}
          onStrengthChange={setStrength}
          imagePath={imagePath}
          onImagePathChange={setImagePath}
          onClose={() => setIsEffectsDialogOpen(false)}
        />
      )}
    </>
  );
}
