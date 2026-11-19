# Production image for the Next.js site (self-hosted on the Contabo VPS).
# NEXT_PUBLIC_* values are inlined at build time: put them in .env.production next to this file
# on the build host (never in git).
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# One image per public domain. NEXT_PUBLIC_SITE_URL overrides the value from .env.production.
ARG NEXT_PUBLIC_SITE_URL=https://www.greenycorner.ae
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
# The static public/robots.txt, public/sitemap.xml and the About-page text carry the host literally.
RUN H="${NEXT_PUBLIC_SITE_URL#https://}"; \
    sed -i "s#https://www\.greenycorner\.ae#${NEXT_PUBLIC_SITE_URL}#g" public/robots.txt public/sitemap.xml && \
    sed -i "s#\"www\.greenycorner\.ae\"#\"${H}\"#g" src/lib/i18n.ts
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
RUN mkdir -p .next/cache && chown -R node:node .next
USER node
EXPOSE 3000
CMD ["node", "server.js"]
