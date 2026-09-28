FROM node:24.19.0-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

COPY src ./src
COPY server.js ./

EXPOSE 3001

CMD ["pnpm", "start"]