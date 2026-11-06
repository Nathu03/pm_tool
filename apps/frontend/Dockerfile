FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/frontend/package*.json apps/frontend/
RUN npm ci --workspace=apps/frontend
COPY apps/frontend apps/frontend
RUN npm run build --workspace=apps/frontend

FROM nginx:alpine
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
