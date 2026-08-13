# CardioInsight AI — frontend image
# Multi-stage: build the Vite app, then serve static files via nginx with an
# /api reverse proxy to the backend service.
#
# The "Download Master Dataset" feature ships the 124 MB NHANES CSV inside the
# image by default (INCLUDE_DATASET=true). Remove it with
# `--build-arg INCLUDE_DATASET=false` to produce a slim image; the landing
# dataset page will then show no download link as documented in DEPLOYMENT.md.
FROM node:20-alpine AS build
ARG INCLUDE_DATASET=true
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY frontend/ .
RUN if [ "$INCLUDE_DATASET" = "false" ]; then rm -rf public/datasets; fi && npm run build

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:80/healthz >/dev/null || exit 1