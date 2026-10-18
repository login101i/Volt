FROM node:22-bookworm-slim AS build
WORKDIR /frontend
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL=https://elektrykpoznan.online
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Fail early if landing source is missing from the build context
RUN test -f app/page.tsx \
  && test -f app/LandingPageClient.tsx \
  && grep -q 'LandingPageClient' app/page.tsx \
  && grep -q 'data-page="landing"' app/LandingPageClient.tsx \
  && test -f app/panel/page.tsx \
  && test ! -e app/app/page.tsx
RUN npm run build
# Fail if `/` did not prerender the landing page
RUN test -f .next/server/app/index.html \
  && grep -q 'data-page="landing"' .next/server/app/index.html \
  || (echo "ERROR: / did not prerender landing" && exit 1)

FROM node:22-bookworm-slim AS runtime
WORKDIR /frontend
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /frontend/.next/standalone ./
COPY --from=build /frontend/.next/static ./.next/static
COPY --from=build /frontend/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
