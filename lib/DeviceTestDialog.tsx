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
} from './audioOutput';
import styles from '../styles/Home.module.css';

export interface DeviceTestDialogProps {
  onClose: () => void;
}

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
            <span className={styles.deviceTestIndicator}>● マイクのテスト</span>
            <LevelMeterSegments level={micLevel} ariaLabel="マイク入力レベル" />
          </div>
          <span className={styles.volumeLabel}>入力音量</span>
          <VolumeSlider value={micGain} onChange={handleMicGainChange} ariaLabel="入力音量" />
        </section>
      </div>
    </div>
  );
}
