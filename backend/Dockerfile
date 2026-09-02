# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# OpenSSL needed for Prisma on Alpine
RUN apk add --no-cache openssl

# Set NODE_ENV to development so devDependencies (Typescript, Prisma CLI) are installed even on Render
ENV NODE_ENV=development

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src/
RUN npx tsc --outDir dist

# Stage 2: Runtime (lean image)
FROM node:20-alpine AS runner
WORKDIR /app

# OpenSSL needed for Prisma on Alpine
RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Copy production deps and explicitly install Prisma CLI for runtime migrations
COPY package*.json ./
RUN npm ci --omit=dev && npm install prisma@^5.22.0

# Change ownership of /app so the node user can execute and read
RUN chown -R node:node /app

# Switch to non-root user for security
USER node

# Copy Prisma schema, migrations, and generated client from builder with correct ownership
COPY --chown=node:node --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=node:node --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --chown=node:node --from=builder /app/prisma ./prisma/

# Copy compiled app
COPY --chown=node:node --from=builder /app/dist ./dist/

EXPOSE 3001

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/index.js"]
