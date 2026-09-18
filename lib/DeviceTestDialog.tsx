'use client';
import * as React from 'react';
import type { LocalAudioTrack } from 'livekit-client';
import { usePersistentUserChoices, usePreviewTracks } from '@livekit/components-react';
import { DeviceSelect } from './DeviceSelect';
import { LevelMeterSegments } from './LevelMeterSegments';
import { VolumeSlider } from './VolumeSlider';
import { useAudioLevel } from './useAudioLevel';
import {
  loadAudioOutputDeviceId,
  loadMicTestGain,
  loadSpeakerTestVolume,
  playTestTone,
  saveAudioOutputDeviceId,
  saveMicTestGain,
  saveSpeakerTestVolume,
  type SinkCapableAudioElement,
} from './audioOutput';
import styles from '../styles/Home.module.css';

export interface DeviceTestDialogProps {
  onClose: () => void;
}

type MicTestState = 'idle' | 'recording' | 'playing';

/** 「マイクのテスト」は最大この秒数で自動的に録音を止め、再生に移る */
const MIC_TEST_MAX_RECORDING_MS = 5000;

/**
 * マイク・スピーカーの動作確認ダイアログ。アカウントメニューからいつでも開ける
 * (入室前後を問わない)。もともとPreJoin画面に組み込んでいたテスト機能を、
 * こちらへ切り出したもの。マイクの選択・音量メーターはこのダイアログ専用に
 * `usePreviewTracks`でプレビュー用トラックを作る(入室時に使うマイク選択の永続設定は共有)。
 * UIはWindowsのサウンド設定画面(区切りバーのレベルメーター+テストボタン+音量スライダー)に
 * 合わせている(2026-09-18、菅原さん指示)。
 */
export function DeviceTestDialog({ onClose }: DeviceTestDialogProps) {
  const { userChoices, saveAudioInputDeviceId } = usePersistentUserChoices({});
  const [audioDeviceId, setAudioDeviceId] = React.useState(userChoices.audioDeviceId);
  const [audioOutputDeviceId, setAudioOutputDeviceId] = React.useState<string | undefined>(() =>
    loadAudioOutputDeviceId(),
  );
  const [isTestingSpeaker, setIsTestingSpeaker] = React.useState(false);
  const [speakerLevel, setSpeakerLevel] = React.useState(0);
  const [speakerVolume, setSpeakerVolume] = React.useState(() => loadSpeakerTestVolume());
  const [micGain, setMicGain] = React.useState(() => loadMicTestGain());
  const [micTestState, setMicTestState] = React.useState<MicTestState>('idle');
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const autoStopTimeoutRef = React.useRef<number | undefined>(undefined);

  const handlePreviewError = React.useCallback((e: Error) => {
    console.error('マイクのプレビュー取得に失敗しました', e);
  }, []);

  const tracks = usePreviewTracks({ audio: { deviceId: audioDeviceId }, video: false }, handlePreviewError);
  const audioTrack = tracks?.[0] as LocalAudioTrack | undefined;
  const micLevel = useAudioLevel(audioTrack?.mediaStreamTrack, micGain);

  const handleAudioDeviceChange = React.useCallback(
    (id: string) => {
      setAudioDeviceId(id);
      saveAudioInputDeviceId(id);
    },
    [saveAudioInputDeviceId],
  );

  const handleSpeakerDeviceChange = React.useCallback((id: string) => {
    setAudioOutputDeviceId(id);
    saveAudioOutputDeviceId(id);
  }, []);

  const handleSpeakerVolumeChange = (volume: number) => {
    setSpeakerVolume(volume);
    saveSpeakerTestVolume(volume);
  };

  const handleMicGainChange = (gain: number) => {
    setMicGain(gain);
    saveMicTestGain(gain);
  };

  const handleTestSpeaker = async () => {
    if (isTestingSpeaker) return;
    setIsTestingSpeaker(true);
    try {
      await playTestTone(audioOutputDeviceId, speakerVolume, setSpeakerLevel);
    } catch (e) {
      console.error('スピーカーのテスト再生に失敗しました', e);
    } finally {
      setSpeakerLevel(0);
      setIsTestingSpeaker(false);
    }
  };

  React.useEffect(() => {
    return () => {
      window.clearTimeout(autoStopTimeoutRef.current);
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        // アンマウント後に録音停止→再生が走らないよう先にハンドラを外す
        recorder.onstop = null;
        recorder.stop();
      }
    };
  }, []);

  /**
   * 「● マイクのテスト」は押すと録音を開始し、もう一度押す(または5秒経過)と自動的に
   * 停止して録音した音声を再生する。レベルメーターは「拾えているか」しか分からないため、
   * 実際にエンコード・再生まで通しで確認できるようにしている。
   */
  const handleMicTestClick = () => {
    if (micTestState === 'recording') {
      mediaRecorderRef.current?.stop();
      return;
    }
    if (micTestState !== 'idle' || !audioTrack?.mediaStreamTrack) return;
    if (typeof MediaRecorder === 'undefined') {
      console.error('このブラウザはMediaRecorderに対応していません');
      return;
    }

    const stream = new MediaStream([audioTrack.mediaStreamTrack]);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream);
    } catch (e) {
      console.error('マイクの録音開始に失敗しました', e);
      return;
    }

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = async () => {
      window.clearTimeout(autoStopTimeoutRef.current);
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });

      /*
       * `new Audio(blobUrl)`でMediaRecorderが吐いたwebmをそのまま再生しようとすると、
       * ChromeでreadyStateが0のまま進まず無限に固まる既知の癖があるため(録音時間の情報が
       * ヘッダに無いストリーミング形式のwebmだとdurationの解決に失敗する)、
       * `playTestTone`と同じ「Web Audioでデコード→MediaStreamDestination経由で再生」方式にする。
       */
      const playbackContext = new AudioContext();
      const finish = () => {
        playbackContext.close().catch(() => {});
        setMicTestState('idle');
      };

      try {
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await playbackContext.decodeAudioData(arrayBuffer);
        const source = playbackContext.createBufferSource();
        source.buffer = audioBuffer;
        const destination = playbackContext.createMediaStreamDestination();
        source.connect(destination);

        const audioEl: SinkCapableAudioElement = new Audio();
        audioEl.srcObject = destination.stream;

        if (audioOutputDeviceId && typeof audioEl.setSinkId === 'function') {
          try {
            await audioEl.setSinkId(audioOutputDeviceId);
          } catch (e) {
            console.warn('録音音声の再生先切り替えに失敗しました。既定のデバイスで再生します', e);
          }
        }

        source.onended = finish;
        setMicTestState('playing');
        source.start();
        await audioEl.play();
      } catch (e) {
        console.error('録音した音声の再生に失敗しました', e);
        finish();
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setMicTestState('recording');
    autoStopTimeoutRef.current = window.setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, MIC_TEST_MAX_RECORDING_MS);
  };

  const micTestLabel =
    micTestState === 'recording'
      ? '■ 停止(録音中...)'
      : micTestState === 'playing'
        ? '▶ 再生中...'
        : '● マイクのテスト';

  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.dialogCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHeader}>
          <h2 className={styles.dialogTitle}>デバイステスト</h2>
          <button type="button" className={styles.dialogClose} onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>

        <section className={styles.dialogSection}>
          <span className={styles.dialogSectionHead}>スピーカー</span>
          <DeviceSelect
            kind="audiooutput"
            initialSelection={audioOutputDeviceId}
            onActiveDeviceChange={handleSpeakerDeviceChange}
          />
          <div className={styles.deviceTestRow}>
            <button
              type="button"
              className={styles.deviceTestButton}
              onClick={handleTestSpeaker}
              disabled={isTestingSpeaker}
            >
              ▶ {isTestingSpeaker ? '再生中...' : 'スピーカーのテスト'}
            </button>
            <LevelMeterSegments level={speakerLevel} ariaLabel="スピーカー出力レベル" />
          </div>
          <span className={styles.volumeLabel}>出力音量</span>
          <VolumeSlider value={speakerVolume} onChange={handleSpeakerVolumeChange} ariaLabel="出力音量" />
        </section>

        <section className={styles.dialogSection}>
          <span className={styles.dialogSectionHead}>マイク</span>
          <DeviceSelect
            kind="audioinput"
            initialSelection={audioDeviceId}
            track={audioTrack}
            onActiveDeviceChange={handleAudioDeviceChange}
          />
          <div className={styles.deviceTestRow}>
            <button
              type="button"
              className={`${styles.deviceTestIndicator}${micTestState === 'recording' ? ` ${styles.deviceTestIndicatorRecording}` : ''}`}
              onClick={handleMicTestClick}
              disabled={!audioTrack || micTestState === 'playing'}
            >
              {micTestLabel}
            </button>
            <LevelMeterSegments level={micLevel} ariaLabel="マイク入力レベル" />
          </div>
          <span className={styles.volumeLabel}>入力音量</span>
          <VolumeSlider value={micGain} onChange={handleMicGainChange} ariaLabel="入力音量" />
        </section>
      </div>
    </div>
  );
}
