import { auth } from '@/auth';
import { RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.LIVEKIT_API_KEY!;
const API_SECRET = process.env.LIVEKIT_API_SECRET!;
const LIVEKIT_URL = process.env.LIVEKIT_URL!;

// RoomServiceClientはhttp(s)のホストを要求するため、wss://→https://に変換する
function toHttpUrl(url: string): string {
  return url.replace(/^ws/, 'http');
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const roomName = request.nextUrl.searchParams.get('roomName');
  if (!roomName) {
    return new NextResponse('roomName is required', { status: 400 });
  }

  const svc = new RoomServiceClient(toHttpUrl(LIVEKIT_URL), API_KEY, API_SECRET);
  const rooms = await svc.listRooms([roomName]);
  return NextResponse.json({ exists: rooms.length > 0 });
}
