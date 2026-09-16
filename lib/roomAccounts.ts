// 拠点別アカウントの固定ルームID・表示名対応表(2026-09-16決定)。
// 該当しないアカウント(Google Workspaceでログインする社員等)は、
// ホーム画面では「新規ミーティング」のみ表示し、PreJoinの表示名は
// 各自の名前(session.user.name)を使う。
export interface RoomAccount {
  roomId: string;
  label: string;
}

export const FIXED_ROOM_BY_EMAIL: Record<string, RoomAccount> = {
  'honsha1@riprice.co.jp': { roomId: 'honsha-room-1', label: '本社1ミーティングルーム' },
  'honsha2@riprice.co.jp': { roomId: 'honsha-room-2', label: '本社2ミーティングルーム' },
  'honsha3@riprice.co.jp': { roomId: 'honsha-room-3', label: '本社3ミーティングルーム' },
  'tokyo1@riprice.co.jp': { roomId: 'tokyo-room-1', label: '東京1ミーティングルーム' },
  'tokyo2@riprice.co.jp': { roomId: 'tokyo-room-2', label: '東京2ミーティングルーム' },
  'tokyo3@riprice.co.jp': { roomId: 'tokyo-room-3', label: '東京3ミーティングルーム' },
  'oosaka1@riprice.co.jp': { roomId: 'oosaka-room-1', label: '大阪1ミーティングルーム' },
  'oosaka2@riprice.co.jp': { roomId: 'oosaka-room-2', label: '大阪2ミーティングルーム' },
  'oosaka3@riprice.co.jp': { roomId: 'oosaka-room-3', label: '大阪3ミーティングルーム' },
};
