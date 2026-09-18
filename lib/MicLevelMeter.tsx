'use client';
import * as React from 'react';

/** マイクの入力音量をリアルタイムのバーで表示し、実際に音を拾えているか一目で確認できるようにする */
export function MicLevelMeter({ mediaStreamTrack }: { mediaStreamTrack?: MediaStreamTrack }) {
  const [level, setLevel] = React.useState(0);

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
      setLevel(Math.min(1, rms * 4));
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

  return (
    <div
      role="meter"
      aria-label="マイク入力レベル"
      aria-valuenow={Math.round(level * 100)}
      style={{
        width: '100%',
        height: '6px',
        borderRadius: '3px',
        backgroundColor: 'rgba(255,255,255,0.15)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.round(level * 100)}%`,
          height: '100%',
          backgroundColor: level > 0.05 ? '#22c55e' : 'rgba(255,255,255,0.3)',
          transition: 'width 80ms linear',
        }}
      />
    </div>
  );
}
