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

RUN mkdir /data

WORKDIR /data

COPY ./apps/web/package.json ./apps/web/playwright.config.ts ./apps/web/

COPY ./apps/worker/package.json ./apps/worker/

COPY ./packages ./packages

COPY ./yarn.lock ./package.json ./

RUN --mount=type=cache,sharing=locked,target=/usr/local/share/.cache/yarn \
    set -eux && \
    # Install build tools for native modules (msgpackr-extract, etc.) and runtime dependencies
    apt-get update && \
    apt-get install -yqq --no-install-recommends \
        build-essential \
        python3 \
        curl \
        ca-certificates && \
    yarn install --network-timeout 10000000 && \
    # Cleanup build tools to reduce image size
    apt-get purge -y build-essential python3 && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy the compiled monolith binary from the builder stage
COPY --from=monolith-builder /usr/local/cargo/bin/monolith /usr/local/bin/monolith

RUN set -eux && \
    apt-get clean && \
    yarn cache clean

COPY . .

RUN yarn prisma:generate && \
    yarn web:build

HEALTHCHECK --interval=30s \
            --timeout=5s \
            --start-period=10s \
            --retries=3 \
            CMD [ "/usr/bin/curl", "--silent", "--fail", "http://127.0.0.1:3000/" ]

EXPOSE 3000

CMD ["sh", "-c", "yarn prisma:deploy && yarn concurrently:start"]
