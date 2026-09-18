'use client';
import * as React from 'react';
import type { LocalAudioTrack, LocalVideoTrack } from 'livekit-client';
import { facingModeFromLocalTrack, Track } from 'livekit-client';
import { MediaDeviceMenu, TrackToggle, usePersistentUserChoices, usePreviewTracks } from '@livekit/components-react';
import type { LocalUserChoices } from '@livekit/components-react';
import { useSession } from 'next-auth/react';
import { CameraOffAvatar } from './CameraOffAvatar';

export interface CustomPreJoinProps {
  defaults?: Partial<LocalUserChoices>;
  onSubmit?: (values: LocalUserChoices) => void;
  onError?: (error: Error) => void;
}

/**
 * ライブラリ標準のPreJoinに、カメラオフ時のプレースホルダーをアカウントアバターに
 * 差し替えたもの(標準は差し替え手段が無いため`usePreviewTracks`等の公開APIで再実装)。
 * マイク・スピーカーのテストはアカウントメニューの「デバイステスト」に移設した。
 */
export function CustomPreJoin({ defaults = {}, onSubmit, onError }: CustomPreJoinProps) {
  const { data: session } = useSession();
  const {
    userChoices: initialUserChoices,
    saveAudioInputDeviceId,
    saveAudioInputEnabled,
    saveVideoInputDeviceId,
    saveVideoInputEnabled,
    saveUsername,
  } = usePersistentUserChoices({ defaults });

  const [username, setUsername] = React.useState(initialUserChoices.username);
  const [audioEnabled, setAudioEnabled] = React.useState(initialUserChoices.audioEnabled);
  const [videoEnabled, setVideoEnabled] = React.useState(initialUserChoices.videoEnabled);
  const [audioDeviceId, setAudioDeviceId] = React.useState(initialUserChoices.audioDeviceId);
  const [videoDeviceId, setVideoDeviceId] = React.useState(initialUserChoices.videoDeviceId);

  React.useEffect(() => {
    saveAudioInputEnabled(audioEnabled);
  }, [audioEnabled, saveAudioInputEnabled]);
  React.useEffect(() => {
    saveVideoInputEnabled(videoEnabled);
  }, [videoEnabled, saveVideoInputEnabled]);
  React.useEffect(() => {
    saveAudioInputDeviceId(audioDeviceId);
  }, [audioDeviceId, saveAudioInputDeviceId]);
  React.useEffect(() => {
    saveVideoInputDeviceId(videoDeviceId);
  }, [videoDeviceId, saveVideoInputDeviceId]);
  React.useEffect(() => {
    saveUsername(username);
  }, [username, saveUsername]);

  const tracks = usePreviewTracks(
    {
      audio: audioEnabled ? { deviceId: initialUserChoices.audioDeviceId } : false,
      video: videoEnabled ? { deviceId: initialUserChoices.videoDeviceId } : false,
    },
    onError,
  );

  const videoTrack = React.useMemo(
    () => tracks?.find((t) => t.kind === Track.Kind.Video) as LocalVideoTrack | undefined,
    [tracks],
  );
  const audioTrack = React.useMemo(
    () => tracks?.find((t) => t.kind === Track.Kind.Audio) as LocalAudioTrack | undefined,
    [tracks],
  );

  const facingMode = React.useMemo(() => {
    if (videoTrack) {
      return facingModeFromLocalTrack(videoTrack).facingMode;
    }
    return 'undefined';
  }, [videoTrack]);

  const videoEl = React.useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    if (videoEl.current && videoTrack) {
      videoTrack.unmute();
      videoTrack.attach(videoEl.current);
    }
    return () => {
      videoTrack?.detach();
    };
  }, [videoTrack]);

  const userChoices: LocalUserChoices = {
    username,
    videoEnabled,
    videoDeviceId,
    audioEnabled,
    audioDeviceId,
  };
  const isValid = username !== '';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isValid) {
      onSubmit?.(userChoices);
    }
  };

  return (
    <div className="lk-prejoin">
      <div className="lk-video-container">
        {videoTrack && (
          <video ref={videoEl} width="1280" height="720" data-lk-facing-mode={facingMode} />
        )}
        {(!videoTrack || !videoEnabled) && (
          <div className="lk-camera-off-note">
            <CameraOffAvatar
              name={session?.user?.name}
              email={session?.user?.email}
              image={session?.user?.image}
            />
          </div>
        )}
      </div>

      <div className="lk-button-group-container">
        <div className="lk-button-group audio">
          <TrackToggle
            initialState={audioEnabled}
            source={Track.Source.Microphone}
            onChange={setAudioEnabled}
          >
            マイク
          </TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu
              initialSelection={audioDeviceId}
              kind="audioinput"
              disabled={!audioTrack}
              tracks={{ audioinput: audioTrack }}
              onActiveDeviceChange={(_, id) => setAudioDeviceId(id)}
            />
          </div>
        </div>
        <div className="lk-button-group video">
          <TrackToggle
            initialState={videoEnabled}
            source={Track.Source.Camera}
            onChange={setVideoEnabled}
          >
            カメラ
          </TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu
              initialSelection={videoDeviceId}
              kind="videoinput"
              disabled={!videoTrack}
              tracks={{ videoinput: videoTrack }}
              onActiveDeviceChange={(_, id) => setVideoDeviceId(id)}
            />
          </div>
        </div>
      </div>

      <form className="lk-username-container">
        <input
          className="lk-form-control"
          id="username"
          name="username"
          type="text"
          value={username}
          placeholder="表示名"
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="off"
        />
        <button
          className="lk-button lk-join-button"
          type="submit"
          onClick={handleSubmit}
          disabled={!isValid}
        >
          参加
        </button>
      </form>
    </div>
  );
}
