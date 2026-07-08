# =============================================================================
# PaperPilot Frontend — Multi-stage Build
# =============================================================================

# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: Serve with Nginx ----
FROM nginxinc/nginx-unprivileged:alpine

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (SPA routing + API proxy)
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
