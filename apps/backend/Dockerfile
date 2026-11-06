FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/backend/package*.json apps/backend/
COPY prisma ./prisma
RUN npm ci --workspace=apps/backend
RUN npx prisma generate
COPY apps/backend apps/backend
RUN npm run build --workspace=apps/backend

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main"]
