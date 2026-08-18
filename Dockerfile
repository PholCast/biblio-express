FROM node:24.19.0-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
COPY prisma.config.ts ./

RUN pnpm exec prisma generate

COPY src ./src
COPY server.js ./

EXPOSE 3000

CMD ["pnpm", "start"]