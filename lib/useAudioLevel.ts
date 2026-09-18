'use client';
import * as React from 'react';

/**
 * マイク音声トラックの入力レベル(0〜1)をリアルタイムで返す。`gain`は表示上の感度調整用の
 * 乗数(実際のマイクのハードウェア音量はブラウザから操作できないため、メーター上の見た目のみに反映)。
 */
export function useAudioLevel(mediaStreamTrack?: MediaStreamTrack, gain: number = 1): number {
  const [level, setLevel] = React.useState(0);
  const gainRef = React.useRef(gain);
  gainRef.current = gain;

  React.useEffect(() => {
    if (!mediaStreamTrack) {
      setLevel(0);
      return;
    }

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(new MediaStream([mediaStreamTrack]));
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    /*
     * このAudioContextはダイアログを開いた後の非同期処理(getUserMedia解決後)で
     * 生成されるため、ブラウザのオートプレイ制限によりsuspended状態で作られる。
     * resume()を呼ばないと音量メーターが常に0のまま動かなかったため、生成直後と
     * 以降の最初のユーザー操作のタイミングで明示的にresumeする。
     */
    const resumeIfSuspended = () => {
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }
    };
    resumeIfSuspended();
    window.addEventListener('pointerdown', resumeIfSuspended);
    window.addEventListener('keydown', resumeIfSuspended);

    let rafId: number;
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sumSquares = 0;
      for (let i = 0; i < data.length; i++) {
        const normalized = (data[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / data.length);
      setLevel(Math.min(1, rms * 4 * gainRef.current));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointerdown', resumeIfSuspended);
      window.removeEventListener('keydown', resumeIfSuspended);
      cancelAnimationFrame(rafId);
      source.disconnect();
      audioContext.close();
    };
  }, [mediaStreamTrack]);

  return level;
}
