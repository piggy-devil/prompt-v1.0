# =========================
# 1. Builder Stage
# =========================
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY bun.lock package.json ./

# ติดตั้ง OpenSSL
RUN apt-get update -y && apt-get install -y openssl curl \
  && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies
RUN bun add --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# ปิด telemetry
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun add lightningcss --platform=linux --arch=arm64

ENV NEXT_PUBLIC_IS_PRODUCTION=true

# Build Next.js
RUN bun run build

# =========================
# 2. Runner Stage
# =========================
# FROM oven/bun:1 AS runner
FROM builder AS runner

# WORKDIR /app

# ENV NEXT_TELEMETRY_DISABLED=1
# ENV NODE_ENV=production
# ENV PORT=3000

# ติดตั้ง OpenSSL + Node.js (เพื่อแก้ปัญหา prisma และ next build)
# RUN apt-get update -y && apt-get install -y openssl curl \
#   && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
#   && apt-get install -y nodejs \
#   && rm -rf /var/lib/apt/lists/*

# Copy แค่ไฟล์ที่จำเป็นจาก builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD bunx prisma db push && bun run start


# prisma generate && prisma migrate deploy && next build
