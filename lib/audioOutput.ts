const STORAGE_KEY = 'riprice-meet-audio-output-device-id';

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

type SinkCapableAudioElement = HTMLAudioElement & {
  setSinkId?: (deviceId: string) => Promise<void>;
};

/**
 * 指定したスピーカー(出力デバイス)からテスト音(440Hzのビープ、約0.8秒)を再生する。
 * `setSinkId`未対応のブラウザ(Firefox/Safari等)では既定の出力デバイスで再生する。
 */
export async function playTestTone(deviceId?: string): Promise<void> {
  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = 440;
  gain.gain.value = 0.2;
  oscillator.connect(gain).connect(destination);

  const audioEl: SinkCapableAudioElement = new Audio();
  audioEl.srcObject = destination.stream;

  if (deviceId && typeof audioEl.setSinkId === 'function') {
    try {
      await audioEl.setSinkId(deviceId);
    } catch (e) {
      console.warn('スピーカーの出力先切り替えに失敗しました。既定のデバイスで再生します', e);
    }
  }

  try {
    oscillator.start();
    await audioEl.play();
    await new Promise((resolve) => setTimeout(resolve, 800));
  } finally {
    oscillator.stop();
    audioEl.pause();
    destination.stream.getTracks().forEach((t) => t.stop());
    await audioContext.close();
  }
}
