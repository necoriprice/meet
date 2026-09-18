'use client';
import { RoomEvent, Track } from 'livekit-client';
import * as React from 'react';
import type {
  MessageDecoder,
  MessageEncoder,
  MessageFormatter,
  ParticipantClickEvent,
  TrackReferenceOrPlaceholder,
  WidgetState,
} from '@livekit/components-react';
import {
  AudioTrack,
  CarouselLayout,
  ConnectionQualityIndicator,
  ConnectionStateToast,
  FocusLayoutContainer,
  GridLayout,
  isTrackReference,
  LayoutContextProvider,
  LockLockedIcon,
  ParticipantName,
  ParticipantTile,
  RoomAudioRenderer,
  ScreenShareIcon,
  TrackMutedIndicator,
  useCreateLayoutContext,
  useEnsureTrackRef,
  useIsEncrypted,
  useTracks,
  VideoTrack,
} from '@livekit/components-react';
import { CustomChat } from './CustomChat';
import { CustomControlBar } from './CustomControlBar';
import { ParticipantAvatar } from './ParticipantAvatar';
import { LayoutMode, loadLayoutMode, saveLayoutMode } from './layoutMode';

// `@livekit/components-core`は@livekit/components-reactの依存先であってこのアプリの
// 直接の依存先ではないため(pnpmのphantom dependency制限)importできない。
// ごく小さいユーティリティなので、同じロジックをここに複製する。
function isWeb(): boolean {
  return typeof document !== 'undefined';
}

function trackRefId(ref: TrackReferenceOrPlaceholder): string {
  return isTrackReference(ref)
    ? `${ref.participant.identity}_${ref.publication.source}_${ref.publication.trackSid}`
    : `${ref.participant.identity}_${ref.source}_placeholder`;
}

export interface CustomVideoConferenceProps extends React.HTMLAttributes<HTMLDivElement> {
  chatMessageFormatter?: MessageFormatter;
  chatMessageEncoder?: MessageEncoder;
  chatMessageDecoder?: MessageDecoder;
  SettingsComponent?: React.ComponentType;
}

/**
 * ライブラリ標準のVideoConferenceに対して以下2点をカスタマイズしたもの。
 * 1. カメラオフ時のプレースホルダーをアカウントアバターに変更(ParticipantAvatar参照)
 * 2. タイル右上の「ピン留め」矢印アイコンを廃止し、代わりに明示的な「レイアウト」ドロップダウン
 *    (全画面/右/左/上)で一覧(サムネイル)の表示位置を選べるようにした。
 *    メインに表示する相手は 画面共有 > 手動でクリックした人 > アクティブな発言者 > 先頭の人 の優先順位で決まる。
 * `VideoConference`はどちらもカスタマイズする手段を提供していないため、ほぼ同じ構成を再実装している。
 */
export function CustomVideoConference({
  chatMessageFormatter,
  chatMessageDecoder,
  chatMessageEncoder,
  SettingsComponent,
  ...props
}: CustomVideoConferenceProps) {
  const [widgetState, setWidgetState] = React.useState<WidgetState>({
    showChat: false,
    unreadMessages: 0,
    showSettings: false,
  });
  const [layoutMode, setLayoutModeState] = React.useState<LayoutMode>('grid');
  const [manualPinIdentity, setManualPinIdentity] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLayoutModeState(loadLayoutMode());
  }, []);

  const handleLayoutModeChange = (mode: LayoutMode) => {
    setLayoutModeState(mode);
    setManualPinIdentity(null);
    saveLayoutMode(mode);
  };

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false },
  );

  const widgetUpdate = (state: WidgetState) => {
    setWidgetState(state);
  };

  const layoutContext = useCreateLayoutContext();

  // 「右/左/上」レイアウト時のメインを決める: 画面共有 > 手動で選んだ人 > アクティブな発言者 > 先頭
  const mainTrack = React.useMemo<TrackReferenceOrPlaceholder | undefined>(() => {
    if (layoutMode === 'grid' || tracks.length === 0) {
      return undefined;
    }
    const screenShare = tracks.find((t) => t.source === Track.Source.ScreenShare);
    if (screenShare) {
      return screenShare;
    }
    const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);
    if (manualPinIdentity) {
      const pinned = cameraTracks.find((t) => t.participant.identity === manualPinIdentity);
      if (pinned) {
        return pinned;
      }
    }
    const speaking = cameraTracks.find((t) => t.participant.isSpeaking);
    if (speaking) {
      return speaking;
    }
    return cameraTracks[0] ?? tracks[0];
  }, [layoutMode, tracks, manualPinIdentity]);

  const sideTracks = React.useMemo(() => {
    if (!mainTrack) {
      return tracks;
    }
    const mainId = trackRefId(mainTrack);
    return tracks.filter((t) => trackRefId(t) !== mainId);
  }, [tracks, mainTrack]);

  const handleThumbnailClick = (event: ParticipantClickEvent) => {
    setManualPinIdentity(event.participant.identity);
  };

  const showFocusLayout = layoutMode !== 'grid' && !!mainTrack;

  return (
    <div className="lk-video-conference" {...props}>
      {isWeb() && (
        <LayoutContextProvider value={layoutContext} onWidgetChange={widgetUpdate}>
          <div className="lk-video-conference-inner">
            {!showFocusLayout ? (
              <div className="lk-grid-layout-wrapper">
                <GridLayout tracks={tracks}>
                  <ParticipantTile>
                    <TileContent />
                  </ParticipantTile>
                </GridLayout>
              </div>
            ) : (
              <div className="lk-focus-layout-wrapper">
                <FocusLayoutContainer data-lk-layout-position={layoutMode}>
                  <CarouselLayout tracks={sideTracks}>
                    <ParticipantTile onParticipantClick={handleThumbnailClick}>
                      <TileContent />
                    </ParticipantTile>
                  </CarouselLayout>
                  <ParticipantTile trackRef={mainTrack}>
                    <TileContent />
                  </ParticipantTile>
                </FocusLayoutContainer>
              </div>
            )}
            <CustomControlBar
              showSettings={!!SettingsComponent}
              layoutMode={layoutMode}
              onLayoutModeChange={handleLayoutModeChange}
            />
          </div>
          <CustomChat
            style={{ display: widgetState.showChat ? 'grid' : 'none' }}
            messageFormatter={chatMessageFormatter}
            messageEncoder={chatMessageEncoder}
            messageDecoder={chatMessageDecoder}
          />
          {SettingsComponent && (
            <div
              className="lk-settings-menu-modal"
              style={{ display: widgetState.showSettings ? 'block' : 'none' }}
            >
              <SettingsComponent />
            </div>
          )}
        </LayoutContextProvider>
      )}
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </div>
  );
}

/**
 * `ParticipantTile`標準のchildren(video/audioトラック描画 + プレースホルダー + メタデータ表示)を
 * そのまま再現しつつ、`ParticipantPlaceholder`(人型アイコン)だけ`ParticipantAvatar`に差し替える。
 */
function TileContent() {
  const trackRef = useEnsureTrackRef();
  const isEncrypted = useIsEncrypted(trackRef.participant);

  return (
    <>
      {isTrackReference(trackRef) &&
      (trackRef.publication?.kind === 'video' ||
        trackRef.source === Track.Source.Camera ||
        trackRef.source === Track.Source.ScreenShare) ? (
        <VideoTrack trackRef={trackRef} />
      ) : (
        isTrackReference(trackRef) && <AudioTrack trackRef={trackRef} />
      )}
      <div className="lk-participant-placeholder">
        <ParticipantAvatar />
      </div>
      <div className="lk-participant-metadata">
        <div className="lk-participant-metadata-item">
          {trackRef.source === Track.Source.Camera ? (
            <>
              {isEncrypted && <LockLockedIcon style={{ marginRight: '0.25rem' }} />}
              <TrackMutedIndicator
                trackRef={{ participant: trackRef.participant, source: Track.Source.Microphone }}
                show="muted"
              />
              <ParticipantName />
            </>
          ) : (
            <>
              <ScreenShareIcon style={{ marginRight: '0.25rem' }} />
              <ParticipantName>&apos;s screen</ParticipantName>
            </>
          )}
        </div>
        <ConnectionQualityIndicator className="lk-participant-metadata-item" />
      </div>
    </>
  );
}
