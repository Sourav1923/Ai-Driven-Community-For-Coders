
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port (default to 3000, can be overridden)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
