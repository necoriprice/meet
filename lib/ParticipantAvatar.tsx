'use client';
import * as React from 'react';
import { useEnsureTrackRef } from '@livekit/components-react';

interface ParticipantAvatarMetadata {
  avatarUrl?: string;
}

function parseMetadata(metadata: string | undefined): ParticipantAvatarMetadata {
  if (!metadata) {
    return {};
  }
  try {
    return JSON.parse(metadata);
  } catch {
    return {};
  }
}

/**
 * カメラオフ時のプレースホルダー。Googleアカウントでログインしている社員は
 * プロフィール写真を表示し、写真が無い(拠点共有アカウント等)・読み込み失敗時は
 * 名前の頭文字アバターにフォールバックする。
 */
export function ParticipantAvatar() {
  const trackRef = useEnsureTrackRef();
  const participant = trackRef.participant;
  const { avatarUrl } = parseMetadata(participant.metadata);
  const [imageFailed, setImageFailed] = React.useState(false);

  const name = participant.name || participant.identity || '';
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? '?';

  if (avatarUrl && !imageFailed) {
    return (
      <img
        className="lk-account-avatar"
        src={avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className="lk-account-avatar lk-account-avatar-fallback" aria-hidden="true">
      {initial}
    </div>
  );
}
