# Build stage
FROM node:16-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY smart_contracts/package*.json ./smart_contracts/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build frontend and smart contracts
RUN npm run build

# Production stage
FROM node:16-alpine

WORKDIR /app

# Copy built artifacts and necessary files
COPY --from=builder /app/frontend/build ./frontend/build
COPY --from=builder /app/smart_contracts/artifacts ./smart_contracts/artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/index.js ./
COPY --from=builder /app/scripts ./scripts

# Install production dependencies only
RUN npm ci --only=production

# Expose ports
EXPOSE 3000 8080

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
