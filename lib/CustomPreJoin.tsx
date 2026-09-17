'use client';
import * as React from 'react';
import type { LocalAudioTrack, LocalVideoTrack } from 'livekit-client';
import { facingModeFromLocalTrack, Track } from 'livekit-client';
import {
  MediaDeviceMenu,
  ParticipantPlaceholder,
  TrackToggle,
  usePersistentUserChoices,
  usePreviewTracks,
} from '@livekit/components-react';
import type { LocalUserChoices } from '@livekit/components-react';
import { MicLevelMeter } from './MicLevelMeter';
import { loadAudioOutputDeviceId, playTestTone, saveAudioOutputDeviceId } from './audioOutput';

export interface CustomPreJoinProps {
  defaults?: Partial<LocalUserChoices>;
  onSubmit?: (values: LocalUserChoices) => void;
  onError?: (error: Error) => void;
}

/**
 * ライブラリ標準のPreJoinに、参加前のマイク音量メーター・スピーカーの選択とテスト再生を
 * 追加したもの。標準のPreJoinはスピーカーの選択・テスト機能を持たないため、
 * `usePreviewTracks`等の公開APIを使って同等のUIを再実装している。
 */
export function CustomPreJoin({ defaults = {}, onSubmit, onError }: CustomPreJoinProps) {
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
  const [audioOutputDeviceId, setAudioOutputDeviceId] = React.useState<string | undefined>(() =>
    loadAudioOutputDeviceId(),
  );
  const [isTestingSpeaker, setIsTestingSpeaker] = React.useState(false);

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

  const handleSpeakerDeviceChange = (deviceId: string) => {
    setAudioOutputDeviceId(deviceId);
    saveAudioOutputDeviceId(deviceId);
  };

  const handleTestSpeaker = async () => {
    if (isTestingSpeaker) {
      return;
    }
    setIsTestingSpeaker(true);
    try {
      await playTestTone(audioOutputDeviceId);
    } catch (e) {
      console.error('スピーカーのテスト再生に失敗しました', e);
    } finally {
      setIsTestingSpeaker(false);
    }
  };

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
            <ParticipantPlaceholder />
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

      {audioEnabled && (
        <div style={{ padding: '0 0.25rem' }}>
          <MicLevelMeter mediaStreamTrack={audioTrack?.mediaStreamTrack} />
          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px' }}>
            マイクに向かって話すとバーが動きます
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.85rem' }}>スピーカー</span>
          <div className="lk-button-group-menu" style={{ position: 'relative' }}>
            <MediaDeviceMenu
              kind="audiooutput"
              initialSelection={audioOutputDeviceId}
              onActiveDeviceChange={(_, id) => handleSpeakerDeviceChange(id)}
            />
          </div>
        </div>
        <button
          type="button"
          className="lk-button"
          onClick={handleTestSpeaker}
          disabled={isTestingSpeaker}
        >
          {isTestingSpeaker ? '再生中...' : 'スピーカーをテスト再生'}
        </button>
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
