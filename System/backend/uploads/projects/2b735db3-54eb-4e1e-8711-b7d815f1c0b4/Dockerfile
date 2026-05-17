
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install serve globally
RUN npm install -g serve

# Expose port
EXPOSE 3001

# Set the PORT environment variable
ENV PORT=3001

# Serve the built application
CMD ["serve", "-s", "build", "-l", "3001"]
