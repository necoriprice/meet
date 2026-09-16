FROM node:18-slim AS base

FROM base AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_*はクライアント側バンドルにビルド時に埋め込まれるため、
# .env.local(.dockerignoreで除外、秘密情報を含む)には頼らずbuild argで渡す
ARG NEXT_PUBLIC_COGNITO_DOMAIN
ARG NEXT_PUBLIC_COGNITO_CLIENT_ID
ENV NEXT_PUBLIC_COGNITO_DOMAIN=$NEXT_PUBLIC_COGNITO_DOMAIN
ENV NEXT_PUBLIC_COGNITO_CLIENT_ID=$NEXT_PUBLIC_COGNITO_CLIENT_ID
RUN pnpm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
