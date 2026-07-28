FROM node:20-slim

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy tsconfig and source code
COPY tsconfig.json ./
COPY src/ ./src/

# Ensure workspace directories exist
RUN mkdir -p uploads reports

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npx", "tsx", "src/server.ts"]
