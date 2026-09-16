import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac } from 'crypto';

const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID!;
const COGNITO_CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET!;
// COGNITO_ISSUER = https://cognito-idp.<region>.amazonaws.com/<userPoolId>
const COGNITO_REGION = process.env.COGNITO_ISSUER?.match(/cognito-idp\.([^.]+)\./)?.[1];

const cognitoClient = new CognitoIdentityProviderClient({ region: COGNITO_REGION });

// 社員のGoogle Workspaceドメイン。このドメインのアカウントのみログインを許可する
const GOOGLE_WORKSPACE_DOMAIN = 'riprice.co.jp';

function computeSecretHash(username: string) {
  return createHmac('sha256', COGNITO_CLIENT_SECRET)
    .update(username + COGNITO_CLIENT_ID)
    .digest('base64');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        // hdはリクエスト時のヒントに過ぎないため、返ってきたprofileの値を必ず検証する
        return profile?.hd === GOOGLE_WORKSPACE_DOMAIN;
      }
      return true;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: { hd: GOOGLE_WORKSPACE_DOMAIN },
      },
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== 'string' || typeof password !== 'string') {
          return null;
        }

        try {
          const result = await cognitoClient.send(
            new InitiateAuthCommand({
              AuthFlow: 'USER_PASSWORD_AUTH',
              ClientId: COGNITO_CLIENT_ID,
              AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
                SECRET_HASH: computeSecretHash(email),
              },
            }),
          );

          if (!result.AuthenticationResult) {
            // NEW_PASSWORD_REQUIRED等のチャレンジ。今回は未対応としてログイン拒否する
            return null;
          }

          return { email };
        } catch {
          // 認証失敗(パスワード誤り等)。詳細をユーザーに見せず一律ログイン失敗として扱う
          return null;
        }
      },
    }),
  ],
});
