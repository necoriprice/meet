import { auth } from '@/auth';
import { hasRoomPassword, setRoomPassword } from '@/lib/roomPassword';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const roomName = request.nextUrl.searchParams.get('roomName');
  if (!roomName) {
    return new NextResponse('roomName is required', { status: 400 });
  }
  return NextResponse.json({ hasPassword: await hasRoomPassword(roomName) });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const roomName = body?.roomName;
  if (typeof roomName !== 'string' || !roomName.trim()) {
    return new NextResponse('roomName is required', { status: 400 });
  }
  const password = typeof body?.password === 'string' ? body.password.trim() : undefined;
  const ttlSeconds = typeof body?.ttlSeconds === 'number' ? body.ttlSeconds : undefined;
  await setRoomPassword(roomName, password || undefined, ttlSeconds);
  return NextResponse.json({ ok: true });
}
