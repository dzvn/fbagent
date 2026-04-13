FROM oven/bun:1.1

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Expose port
EXPOSE 9000

# Default command
CMD ["bun", "run", "dev"]
