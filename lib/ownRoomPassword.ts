const STORAGE_PREFIX = 'riprice-meet-own-room-password:';

/**
 * 「新規ミーティング」はランダムなルームIDをその場で作ってすぐ入室するため、
 * 作成した本人に対してまで直後にパスワード入力を求めるのは不要な手間になる。
 * 作成時に設定したパスワードをこのタブのsessionStorageに覚えておき、
 * 直後の入室(および同タブでの再読み込み)ではゲートをスキップできるようにする。
 * タブを閉じれば消えるため、後から別セッションで開いた場合は通常どおり
 * パスワード入力が必要(セキュリティ上の唯一の関所はサーバー側の検証のまま)。
 */
export function rememberOwnRoomPassword(roomName: string, password: string) {
  if (!password) return;
  try {
    window.sessionStorage.setItem(`${STORAGE_PREFIX}${roomName}`, password);
  } catch {
    // sessionStorageが使えない場合は諦める(通常どおりパスワード入力を求められるだけ)
  }
}

export function getOwnRoomPassword(roomName: string): string | undefined {
  try {
    return window.sessionStorage.getItem(`${STORAGE_PREFIX}${roomName}`) ?? undefined;
  } catch {
    return undefined;
  }
}
