FROM node:20-alpine

WORKDIR /app

# For some native deps (if any) we might need build tools, but keep it lean for now.

COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund

COPY . .

# Build TypeScript (skip db:generate as it requires interactive input)
# Migrations are included in the repo and run automatically at startup
RUN npm run build:skip-generate

EXPOSE 8787

CMD ["npm", "run", "dev"]
