import { auth } from '@/auth';
import { getRedis } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

const HISTORY_MAX = 10;

function historyKey(email: string): string {
  return `join-history:${email}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const redis = getRedis();
  const history = await redis.lrange(historyKey(session.user.email), 0, HISTORY_MAX - 1);
  return NextResponse.json({ history });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const roomId = body?.roomId;
  if (typeof roomId !== 'string' || !roomId.trim()) {
    return new NextResponse('roomId is required', { status: 400 });
  }

  const redis = getRedis();
  const key = historyKey(session.user.email);
  // 同じルームIDが既にあれば一旦消してから先頭に積み直す(重複排除・最新順)
  await redis.lrem(key, 0, roomId);
  await redis.lpush(key, roomId);
  await redis.ltrim(key, 0, HISTORY_MAX - 1);
  return NextResponse.json({ ok: true });
}
