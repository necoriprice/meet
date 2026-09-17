import { auth } from '@/auth';
import { verifyRoomPassword } from '@/lib/roomPassword';
import { NextRequest, NextResponse } from 'next/server';

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
  const password = typeof body?.password === 'string' ? body.password : '';
  const ok = await verifyRoomPassword(roomName, password);
  return NextResponse.json({ ok });
}
