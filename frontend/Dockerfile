# Stage 1: Build the app
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Ensure a clean esbuild
RUN npm rebuild esbuild

RUN npm run build

# Stage 2: Serve using lightweight HTTP server
FROM node:20-alpine
WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
