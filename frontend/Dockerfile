FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile || bun install

FROM base AS dev
COPY --from=install /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["bun", "run", "dev"]
