import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
    const res = NextResponse.redirect(loginUrl);
    // ブラウザの「戻る」操作がこのリダイレクト応答をキャッシュから再利用し、
    // ログイン済みでもログイン画面に戻ってしまう問題を防ぐ
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store');
  return res;
});

export const config = {
  // api/webhooks: LiveKitサーバーからの直接呼び出し(Cognitoセッションを持たない)。
  // 署名検証はルートハンドラ側(WebhookReceiver)で行う
  matcher: ['/((?!api/auth|api/webhooks|login|_next/static|_next/image|favicon.ico|images).*)'],
};
