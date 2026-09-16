import { auth } from '@/auth';
import { getRedis } from '@/lib/redis';
import { NextResponse } from 'next/server';

const SESSIONS_KEY = 'usage:sessions';

interface Session {
  identity: string;
  room: string;
  joinedAt: number | null;
  leftAt: number;
  durationSeconds: number | null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const redis = getRedis();
  const raw = await redis.lrange(SESSIONS_KEY, 0, -1);
  const sessions: Session[] = raw.map((item) => JSON.parse(item));

  const byIdentity = new Map<
    string,
    { identity: string; sessionCount: number; totalDurationSeconds: number; lastLeftAt: number }
  >();

  for (const s of sessions) {
    const existing = byIdentity.get(s.identity);
    const duration = s.durationSeconds ?? 0;
    if (existing) {
      existing.sessionCount += 1;
      existing.totalDurationSeconds += duration;
      existing.lastLeftAt = Math.max(existing.lastLeftAt, s.leftAt);
    } else {
      byIdentity.set(s.identity, {
        identity: s.identity,
        sessionCount: 1,
        totalDurationSeconds: duration,
        lastLeftAt: s.leftAt,
      });
    }
  }

  const summary = [...byIdentity.values()].sort((a, b) => b.lastLeftAt - a.lastLeftAt);

  return NextResponse.json({ summary });
}
