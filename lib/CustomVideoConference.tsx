'use client';
import { RoomEvent, Track } from 'livekit-client';
import * as React from 'react';
import type {
  MessageDecoder,
  MessageEncoder,
  MessageFormatter,
  TrackReferenceOrPlaceholder,
  WidgetState,
} from '@livekit/components-react';
import {
  AudioTrack,
  Chat,
  CarouselLayout,
  ConnectionQualityIndicator,
  ConnectionStateToast,
  ControlBar,
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
  usePinnedTracks,
  useTracks,
  VideoTrack,
} from '@livekit/components-react';
import { ParticipantAvatar } from './ParticipantAvatar';

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

function isEqualTrackRef(
  a?: TrackReferenceOrPlaceholder,
  b?: TrackReferenceOrPlaceholder,
): boolean {
  if (a === undefined || b === undefined) {
    return false;
  }
  if (isTrackReference(a) && isTrackReference(b)) {
    return a.publication.trackSid === b.publication.trackSid;
  }
  return trackRefId(a) === trackRefId(b);
}

export interface CustomVideoConferenceProps extends React.HTMLAttributes<HTMLDivElement> {
  chatMessageFormatter?: MessageFormatter;
  chatMessageEncoder?: MessageEncoder;
  chatMessageDecoder?: MessageDecoder;
  SettingsComponent?: React.ComponentType;
}

/**
 * ライブラリ標準のVideoConferenceに、カメラオフ時のプレースホルダーだけを差し替えたもの。
 * `VideoConference`はタイルの中身をカスタマイズする手段を提供していないため、
 * `ParticipantTile`に自前のchildrenを渡す形でほぼ同じ構成を再実装している。
 * (差分は `<ParticipantPlaceholder />` → `<TileContent />` のみ)
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
  const lastAutoFocusedScreenShareTrack = React.useRef<TrackReferenceOrPlaceholder | null>(null);

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

  const screenShareTracks = tracks
    .filter(isTrackReference)
    .filter((track) => track.publication.source === Track.Source.ScreenShare);

  const focusTrack = usePinnedTracks(layoutContext)?.[0];
  const carouselTracks = tracks.filter((track) => !isEqualTrackRef(track, focusTrack));

  React.useEffect(() => {
    if (
      screenShareTracks.some((track) => track.publication.isSubscribed) &&
      lastAutoFocusedScreenShareTrack.current === null
    ) {
      layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: screenShareTracks[0] });
      lastAutoFocusedScreenShareTrack.current = screenShareTracks[0];
    } else if (
      lastAutoFocusedScreenShareTrack.current &&
      !screenShareTracks.some(
        (track) =>
          track.publication.trackSid ===
          lastAutoFocusedScreenShareTrack.current?.publication?.trackSid,
      )
    ) {
      layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
      lastAutoFocusedScreenShareTrack.current = null;
    }
    if (focusTrack && !isTrackReference(focusTrack)) {
      const updatedFocusTrack = tracks.find(
        (tr) =>
          tr.participant.identity === focusTrack.participant.identity &&
          tr.source === focusTrack.source,
      );
      if (updatedFocusTrack !== focusTrack && isTrackReference(updatedFocusTrack)) {
        layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: updatedFocusTrack });
      }
    }
  }, [
    screenShareTracks
      .map((ref) => `${ref.publication.trackSid}_${ref.publication.isSubscribed}`)
      .join(),
    focusTrack?.publication?.trackSid,
    tracks,
  ]);

  return (
    <div className="lk-video-conference" {...props}>
      {isWeb() && (
        <LayoutContextProvider value={layoutContext} onWidgetChange={widgetUpdate}>
          <div className="lk-video-conference-inner">
            {!focusTrack ? (
              <div className="lk-grid-layout-wrapper">
                <GridLayout tracks={tracks}>
                  <ParticipantTile>
                    <TileContent />
                  </ParticipantTile>
                </GridLayout>
              </div>
            ) : (
              <div className="lk-focus-layout-wrapper">
                <FocusLayoutContainer>
                  <CarouselLayout tracks={carouselTracks}>
                    <ParticipantTile>
                      <TileContent />
                    </ParticipantTile>
                  </CarouselLayout>
                  {focusTrack && (
                    <ParticipantTile trackRef={focusTrack}>
                      <TileContent />
                    </ParticipantTile>
                  )}
                </FocusLayoutContainer>
              </div>
            )}
            <ControlBar controls={{ chat: true, settings: !!SettingsComponent }} />
          </div>
          <Chat
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
