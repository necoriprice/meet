'use client';
import * as React from 'react';

export interface CameraOffAvatarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

/**
 * PreJoin画面でカメラオフの時に表示するアカウントアバター。通話中の`ParticipantAvatar`と
 * 見た目・CSSクラス(`lk-account-avatar`)は同じだが、PreJoinの時点ではLiveKitの
 * participant/trackRefがまだ存在しないため、next-authのセッション情報から直接描画する。
 */
export function CameraOffAvatar({ name, email, image }: CameraOffAvatarProps) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const label = name || email || '';
  const initial = Array.from(label.trim())[0]?.toUpperCase() ?? '?';

  if (image && !imageFailed) {
    return (
      <img
        className="lk-account-avatar"
        src={image}
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
