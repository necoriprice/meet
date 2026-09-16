import { getRedis } from '@/lib/redis';
import { WebhookReceiver } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;

const JOIN_KEY_TTL_SECONDS = 60 * 60 * 24; // 参加したまま退室イベントが来ない場合の取り残し防止
const SESSIONS_KEY = 'usage:sessions';
const MAX_SESSIONS = 10000; // 記録の肥大化を防ぐための上限

export async function POST(request: NextRequest) {
  if (!API_KEY || !API_SECRET) {
    return new NextResponse('LIVEKIT_API_KEY/SECRET is not configured', { status: 500 });
  }

  const body = await request.text();
  const authHeader = request.headers.get('Authorization') ?? undefined;

  const receiver = new WebhookReceiver(API_KEY, API_SECRET);
  let event;
  try {
    event = await receiver.receive(body, authHeader);
  } catch (error) {
    return new NextResponse('Invalid webhook signature', { status: 401 });
  }

  const redis = getRedis();
  const roomName = event.room?.name;
  const identity = event.participant?.identity;
  const createdAt = Number(event.createdAt); // 秒単位

  if (event.event === 'participant_joined' && roomName && identity) {
    await redis.set(`usage:join:${roomName}:${identity}`, createdAt, 'EX', JOIN_KEY_TTL_SECONDS);
  } else if (event.event === 'participant_left' && roomName && identity) {
    const joinKey = `usage:join:${roomName}:${identity}`;
    const joinedAt = await redis.get(joinKey);
    await redis.del(joinKey);

    const session = {
      identity,
      room: roomName,
      joinedAt: joinedAt ? Number(joinedAt) : null,
      leftAt: createdAt,
      durationSeconds: joinedAt ? createdAt - Number(joinedAt) : null,
    };
    await redis.lpush(SESSIONS_KEY, JSON.stringify(session));
    await redis.ltrim(SESSIONS_KEY, 0, MAX_SESSIONS - 1);
  }

  return new NextResponse('ok');
}
