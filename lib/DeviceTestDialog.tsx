'use client';
import * as React from 'react';
import type { LocalAudioTrack } from 'livekit-client';
import { MediaDeviceMenu, usePersistentUserChoices, usePreviewTracks } from '@livekit/components-react';
import { MicLevelMeter } from './MicLevelMeter';
import { loadAudioOutputDeviceId, playTestTone, saveAudioOutputDeviceId } from './audioOutput';
import styles from '../styles/Home.module.css';

export interface DeviceTestDialogProps {
  onClose: () => void;
}

/**
 * マイク・スピーカーの動作確認ダイアログ。アカウントメニューからいつでも開ける
 * (入室前後を問わない)。もともとPreJoin画面に組み込んでいたテスト機能を、
 * こちらへ切り出したもの。マイクの選択・音量メーターはこのダイアログ専用に
 * `usePreviewTracks`でプレビュー用トラックを作る(入室時に使うマイク選択の永続設定は共有)。
 */
export function DeviceTestDialog({ onClose }: DeviceTestDialogProps) {
  const { userChoices, saveAudioInputDeviceId } = usePersistentUserChoices({});
  const [audioDeviceId, setAudioDeviceId] = React.useState(userChoices.audioDeviceId);
  const [audioOutputDeviceId, setAudioOutputDeviceId] = React.useState<string | undefined>(() =>
    loadAudioOutputDeviceId(),
  );
  const [isTestingSpeaker, setIsTestingSpeaker] = React.useState(false);

  const handlePreviewError = React.useCallback((e: Error) => {
    console.error('マイクのプレビュー取得に失敗しました', e);
  }, []);

  const tracks = usePreviewTracks({ audio: { deviceId: audioDeviceId }, video: false }, handlePreviewError);
  const audioTrack = tracks?.[0] as LocalAudioTrack | undefined;

  const handleAudioDeviceChange = (id: string) => {
    setAudioDeviceId(id);
    saveAudioInputDeviceId(id);
  };

  const handleSpeakerDeviceChange = (id: string) => {
    setAudioOutputDeviceId(id);
    saveAudioOutputDeviceId(id);
  };

  const handleTestSpeaker = async () => {
    if (isTestingSpeaker) return;
    setIsTestingSpeaker(true);
    try {
      await playTestTone(audioOutputDeviceId);
    } catch (e) {
      console.error('スピーカーのテスト再生に失敗しました', e);
    } finally {
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
          <div className={styles.dialogSectionHead}>
            <span>マイク</span>
            <div className="lk-button-group-menu" style={{ position: 'relative' }}>
              <MediaDeviceMenu
                kind="audioinput"
                initialSelection={audioDeviceId}
                disabled={!audioTrack}
                tracks={{ audioinput: audioTrack }}
                onActiveDeviceChange={(_, id) => handleAudioDeviceChange(id)}
              />
            </div>
          </div>
          <MicLevelMeter mediaStreamTrack={audioTrack?.mediaStreamTrack} />
          <p className={styles.dialogHint}>マイクに向かって話すとバーが動きます</p>
        </section>

        <section className={styles.dialogSection}>
          <div className={styles.dialogSectionHead}>
            <span>スピーカー</span>
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
            className={styles.secondaryButton}
            onClick={handleTestSpeaker}
            disabled={isTestingSpeaker}
          >
            {isTestingSpeaker ? '再生中...' : 'スピーカーをテスト再生'}
          </button>
        </section>
      </div>
    </div>
  );
}
