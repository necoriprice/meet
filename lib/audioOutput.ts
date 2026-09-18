const STORAGE_KEY = 'riprice-meet-audio-output-device-id';
const SPEAKER_VOLUME_KEY = 'riprice-meet-speaker-test-volume';
const MIC_GAIN_KEY = 'riprice-meet-mic-test-gain';

/** 選択したスピーカー(出力デバイス)をブラウザに保存し、次回入室時にも引き継ぐ */
export function saveAudioOutputDeviceId(deviceId: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, deviceId);
  } catch {
    // プライベートモード等でlocalStorageが使えない場合は保存をあきらめる
  }
}

export function loadAudioOutputDeviceId(): string | undefined {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

/** スピーカーのテスト再生音量(0〜1)。次回のデバイステスト時にも引き継ぐ */
export function saveSpeakerTestVolume(volume: number) {
  try {
    window.localStorage.setItem(SPEAKER_VOLUME_KEY, String(volume));
  } catch {
    // 保存できない場合は次回デフォルト値に戻る
  }
}

export function loadSpeakerTestVolume(): number {
  try {
    const stored = window.localStorage.getItem(SPEAKER_VOLUME_KEY);
    return stored !== null ? Number(stored) : 0.7;
  } catch {
    return 0.7;
  }
}

/**
 * マイクの入力感度(0〜1)。実際のマイクのハードウェア音量はブラウザから操作できないため、
 * デバイステストダイアログのレベルメーター表示にのみ反映する。
 */
export function saveMicTestGain(gain: number) {
  try {
    window.localStorage.setItem(MIC_GAIN_KEY, String(gain));
  } catch {
    // 保存できない場合は次回デフォルト値に戻る
  }
}

export function loadMicTestGain(): number {
  try {
    const stored = window.localStorage.getItem(MIC_GAIN_KEY);
    return stored !== null ? Number(stored) : 0.7;
  } catch {
    return 0.7;
  }
}

type SinkCapableAudioElement = HTMLAudioElement & {
  setSinkId?: (deviceId: string) => Promise<void>;
};

/**
 * 指定したスピーカー(出力デバイス)からテスト音(440Hzのビープ、約0.8秒)を再生する。
 * `setSinkId`未対応のブラウザ(Firefox/Safari等)では既定の出力デバイスで再生する。
 * `volume`(0〜1)で音量を調整でき、`onLevel`が渡されていれば再生中の音声レベル(0〜1)を
 * 継続的に通知する(レベルメーター表示用)。
 */
export async function playTestTone(
  deviceId?: string,
  volume: number = 1,
  onLevel?: (level: number) => void,
): Promise<void> {
  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  oscillator.frequency.value = 440;
  gain.gain.value = 0.4 * Math.min(1, Math.max(0, volume));
  oscillator.connect(gain).connect(analyser).connect(destination);

  const audioEl: SinkCapableAudioElement = new Audio();
  audioEl.srcObject = destination.stream;

  if (deviceId && typeof audioEl.setSinkId === 'function') {
    try {
      await audioEl.setSinkId(deviceId);
    } catch (e) {
      console.warn('スピーカーの出力先切り替えに失敗しました。既定のデバイスで再生します', e);
    }
  }

  let rafId: number | undefined;
  if (onLevel) {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sumSquares = 0;
      for (let i = 0; i < data.length; i++) {
        const normalized = (data[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      onLevel(Math.min(1, Math.sqrt(sumSquares / data.length) * 4));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  try {
    oscillator.start();
    await audioEl.play();
    await new Promise((resolve) => setTimeout(resolve, 800));
  } finally {
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId);
    }
    onLevel?.(0);
    oscillator.stop();
    audioEl.pause();
    destination.stream.getTracks().forEach((t) => t.stop());
    await audioContext.close();
  }
}
