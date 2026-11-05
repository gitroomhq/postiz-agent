# syntax=docker/dockerfile:1
# The CLI auth server (cli-auth.postiz.com) for AWS Fargate, built by
# .github/workflows/deploy-aws.yml with ./server as the context. Not named
# Dockerfile, so Railway keeps building this folder with Railpack.
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json index.ts ./
RUN pnpm run build

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
# Amazon RDS certificates: on AWS the database connection verifies the server
# (sslmode=verify-full in DATABASE_URL, NODE_EXTRA_CA_CERTS set by the ECS task)
ADD --chmod=644 https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /app/rds-ca.pem
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER node
EXPOSE 8080
CMD ["node", "dist/index.js"]
