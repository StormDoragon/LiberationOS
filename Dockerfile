FROM node:22-alpine AS app

RUN apk add --no-cache openssl
RUN corepack enable

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm db:generate

ARG APP=web
ENV APP=$APP
ENV NODE_ENV=production

RUN if [ "$APP" = "web" ]; then pnpm --filter @liberation-os/web build; else echo "Skipping Next.js build for worker image"; fi

EXPOSE 3000
CMD ["sh", "-c", "if [ \"$APP\" = \"web\" ]; then pnpm start:web; else pnpm start:worker; fi"]
