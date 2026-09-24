import { auth } from '@/auth';
import { getLiveKitURL } from '@/lib/getLiveKitURL';
import { isFixedRoomOwner } from '@/lib/roomAccounts';
import { verifyRoomPassword } from '@/lib/roomPassword';
import { ConnectionDetails } from '@/lib/types';
import { AccessToken, AccessTokenOptions, VideoGrant } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    // なりすまし防止のため、identityは自己申告のparticipantNameではなく検証済みセッションから取得する
    const identity = session.user.email ?? session.user.name;
    if (!identity) {
      return new NextResponse('Cognito session has no email/name claim', { status: 401 });
    }

    // Parse query parameters
    const roomName = request.nextUrl.searchParams.get('roomName');
    const participantName = request.nextUrl.searchParams.get('participantName') ?? identity;
    const region = request.nextUrl.searchParams.get('region');
    // カメラオフ時にGoogleアカウントのアバターを表示するため、写真URLをmetadataに埋め込む
    // (honsha1等のCognito共有アカウントはimageを持たないため未設定のままになる)
    const metadata = JSON.stringify({ avatarUrl: session.user.image ?? undefined });
    if (!LIVEKIT_URL) {
      throw new Error('LIVEKIT_URL is not defined');
    }
    const livekitServerUrl = region ? getLiveKitURL(LIVEKIT_URL, region) : LIVEKIT_URL;
    if (livekitServerUrl === undefined) {
      throw new Error('Invalid region');
    }

    if (typeof roomName !== 'string') {
      return new NextResponse('Missing required query parameter: roomName', { status: 400 });
    }

    // ルームにパスワードが設定されている場合、URLを知っているだけでは入室できないようにする
    // (フロント側の入力画面はUXのためのもので、実際のアクセス制御はここで行う)。
    // ただし本人専用の固定ルーム(拠点共有アカウント)は、自分でかけたパスワードを
    // 自分自身の入室時にまで要求する必要がないため、所有者本人ならスキップする。
    if (!isFixedRoomOwner(session.user.email, roomName)) {
      const password = request.nextUrl.searchParams.get('password') ?? '';
      if (!(await verifyRoomPassword(roomName, password))) {
        return new NextResponse('Incorrect room password', { status: 403 });
      }
    }

    // Generate participant token
    const participantToken = await createParticipantToken(
      {
        identity,
        name: participantName,
        metadata,
      },
      roomName,
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: livekitServerUrl,
      roomName: roomName,
      participantToken: participantToken,
      participantName: participantName,
    };
    return new NextResponse(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(userInfo: AccessTokenOptions, roomName: string) {
  const at = new AccessToken(API_KEY, API_SECRET, userInfo);
  at.ttl = '5m';
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);
  return at.toJwt();
}
