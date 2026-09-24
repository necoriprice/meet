'use client';
import * as React from 'react';
import { LocalTrackPublication, LocalVideoTrack, Track } from 'livekit-client';
import {
  ChatIcon,
  ChatToggle,
  DisconnectButton,
  GearIcon,
  LeaveIcon,
  MediaDeviceMenu,
  StartMediaButton,
  TrackToggle,
  useLocalParticipant,
  useLocalParticipantPermissions,
  useMaybeLayoutContext,
  usePersistentUserChoices,
} from '@livekit/components-react';
import { CameraDeviceMenu } from './CameraDeviceMenu';
import { LayoutMenu } from './LayoutMenu';
import { LayoutMode } from './layoutMode';

// `supportsScreenSharing`は@livekit/components-coreにしかないため(phantom dependency)複製する
function supportsScreenSharing(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    !!navigator.mediaDevices.getDisplayMedia
  );
}

export interface CustomControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
  showSettings: boolean;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
}

/**
 * ライブラリ標準のControlBarに「レイアウト」ドロップダウンを画面共有とチャットの間に
 * 追加したもの。`ControlBar`は途中にボタンを差し込む手段を提供していないため、
 * ほぼ同じ構成を再実装している(レスポンシブ切り替え(useMediaQuery)は内部限定APIのため省略し、
 * 常にアイコン表示にしている。文言は既存のCSSで日本語に上書きされるため見た目に影響はない)。
 */
export function CustomControlBar({
  showSettings,
  layoutMode,
  onLayoutModeChange,
  ...props
}: CustomControlBarProps) {
  const layoutContext = useMaybeLayoutContext();
  const localPermissions = useLocalParticipantPermissions();
  const { cameraTrack } = useLocalParticipant();
  const cameraVideoTrack = (cameraTrack as LocalTrackPublication | undefined)?.track as
    | LocalVideoTrack
    | undefined;
  const browserSupportsScreenSharing = supportsScreenSharing();

  const canPublishSource = (source: Track.Source) => {
    if (!localPermissions) return false;
    const trackSourceToProtocol = (s: Track.Source) => {
      switch (s) {
        case Track.Source.Camera:
          return 1;
        case Track.Source.Microphone:
          return 2;
        case Track.Source.ScreenShare:
          return 3;
        default:
          return 0;
      }
    };
    return (
      localPermissions.canPublish &&
      (localPermissions.canPublishSources.length === 0 ||
        localPermissions.canPublishSources.includes(trackSourceToProtocol(source)))
    );
  };
  const canPublishCamera = canPublishSource(Track.Source.Camera);
  const canPublishMicrophone = canPublishSource(Track.Source.Microphone);
  const canPublishScreenShare = canPublishSource(Track.Source.ScreenShare);
  const canPublishChat = !!localPermissions?.canPublishData;

  const {
    saveAudioInputEnabled,
    saveVideoInputEnabled,
    saveAudioInputDeviceId,
    saveVideoInputDeviceId,
  } = usePersistentUserChoices({});

  const toggleSettings = () => {
    layoutContext?.widget.dispatch?.({ msg: 'toggle_settings' });
  };

  return (
    <div className="lk-control-bar" {...props}>
      {canPublishMicrophone && (
        <div className="lk-button-group">
          <TrackToggle
            source={Track.Source.Microphone}
            showIcon
            onChange={(enabled, isUserInitiated) =>
              isUserInitiated ? saveAudioInputEnabled(enabled) : null
            }
          />
          <div className="lk-button-group-menu">
            <MediaDeviceMenu
              kind="audioinput"
              onActiveDeviceChange={(_kind, deviceId) =>
                saveAudioInputDeviceId(deviceId ?? 'default')
              }
            />
          </div>
        </div>
      )}
      {canPublishCamera && (
        <div className="lk-button-group">
          <TrackToggle
            source={Track.Source.Camera}
            showIcon
            onChange={(enabled, isUserInitiated) =>
              isUserInitiated ? saveVideoInputEnabled(enabled) : null
            }
          />
          <div className="lk-button-group-menu">
            <CameraDeviceMenu
              track={cameraVideoTrack}
              onActiveDeviceChange={(deviceId) => saveVideoInputDeviceId(deviceId ?? 'default')}
            />
          </div>
        </div>
      )}
      {canPublishScreenShare && browserSupportsScreenSharing && (
        <TrackToggle
          source={Track.Source.ScreenShare}
          captureOptions={{ audio: true, selfBrowserSurface: 'include' }}
          showIcon
        />
      )}
      <LayoutMenu layoutMode={layoutMode} onChange={onLayoutModeChange} />
      {canPublishChat && (
        <ChatToggle>
          <ChatIcon />
        </ChatToggle>
      )}
      {showSettings && (
        <button type="button" className="lk-button" onClick={toggleSettings}>
          <GearIcon />
        </button>
      )}
      <DisconnectButton>
        <LeaveIcon />
      </DisconnectButton>
      <StartMediaButton />
    </div>
  );
}
