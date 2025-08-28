# Build stage
FROM node:18-alpine AS build
WORKDIR /app
RUN npm i -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile
COPY . .
RUN pnpm build && pnpm prune --prod

# Production stage - distroless for minimal size
FROM gcr.io/distroless/nodejs18-debian11
WORKDIR /app
ENV DISCORD_TOKEN=${DISCORD_TOKEN}
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
USER 1001
CMD ["dist/index.js"]