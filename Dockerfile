# Stage: monolith-builder
# Purpose: Uses the Rust image to build monolith
# Notes:
#  - Fine to leave extra here, as only the resulting binary is copied out
FROM docker.io/rust:1.86-bullseye AS monolith-builder

RUN set -eux && cargo install --locked monolith

# Stage: main-app
# Purpose: Compiles the frontend and
# Notes:
#  - Nothing extra should be left here.  All commands should cleanup
FROM node:22.14-bullseye-slim AS main-app

ARG DEBIAN_FRONTEND=noninteractive

# Enable corepack for Yarn 4.x support (must be before any yarn commands)
RUN corepack enable

# Install build tools for native modules and runtime dependencies
RUN set -eux && \
    apt-get update && \
    apt-get install -yqq --no-install-recommends \
        build-essential \
        python3 \
        curl \
        ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir /data

WORKDIR /data

# Copy yarn configuration
COPY .yarnrc.yml ./

COPY ./apps/web/package.json ./apps/web/playwright.config.ts ./apps/web/

COPY ./apps/worker/package.json ./apps/worker/

COPY ./packages ./packages

COPY ./yarn.lock ./package.json ./

# Install dependencies (no cache mount to ensure install-state.gz persists)
RUN yarn install --network-timeout 10000000

# Copy the compiled monolith binary from the builder stage
COPY --from=monolith-builder /usr/local/cargo/bin/monolith /usr/local/bin/monolith

# Copy source code
COPY . .

RUN yarn prisma:generate && \
    yarn web:build

# Cleanup build tools to reduce final image size
RUN apt-get purge -y build-essential python3 && \
    apt-get autoremove -y && \
    yarn cache clean

HEALTHCHECK --interval=30s \
            --timeout=5s \
            --start-period=10s \
            --retries=3 \
            CMD [ "/usr/bin/curl", "--silent", "--fail", "http://127.0.0.1:3000/" ]

EXPOSE 3000

CMD ["sh", "-c", "(yarn prisma:deploy || yarn workspace @linkwarden/prisma prisma db push --accept-data-loss || true) && yarn concurrently:start"]
