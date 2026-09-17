import { createHash, randomBytes } from 'crypto';
import { getRedis } from './redis';

/** 新規ミーティング(使い捨てルーム)のパスワードは24時間で自動失効させる */
export const ADHOC_ROOM_PASSWORD_TTL_SECONDS = 60 * 60 * 24;

function passwordKey(roomName: string): string {
  return `room-password:${roomName}`;
}

function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

/**
 * ルームのパスワードを設定する。password省略(undefined/空文字)で解除する。
 * ttlSeconds指定時はその秒数で自動失効する(本社/東京/大阪の固定ルームでは指定しない=無期限)。
 */
export async function setRoomPassword(
  roomName: string,
  password: string | undefined,
  ttlSeconds?: number,
): Promise<void> {
  const redis = getRedis();
  const key = passwordKey(roomName);
  if (!password) {
    await redis.del(key);
    return;
  }
  const salt = randomBytes(16).toString('hex');
  const value = `${salt}:${hashPassword(password, salt)}`;
  if (ttlSeconds) {
    await redis.set(key, value, 'EX', ttlSeconds);
  } else {
    await redis.set(key, value);
  }
}

export async function hasRoomPassword(roomName: string): Promise<boolean> {
  const redis = getRedis();
  return (await redis.exists(passwordKey(roomName))) === 1;
}

/** パスワード未設定のルームは既存動作どおり誰でも入室可能(true)とする */
export async function verifyRoomPassword(roomName: string, password: string): Promise<boolean> {
  const redis = getRedis();
  const stored = await redis.get(passwordKey(roomName));
  if (!stored) {
    return true;
  }
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) {
    return false;
  }
  return hashPassword(password, salt) === hash;
}
