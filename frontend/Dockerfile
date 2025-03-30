# Use Node.js LTS version
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Create certs directory
RUN mkdir -p certs

# Copy the rest of the application
COPY . .

# Copy Docker-specific env file as .env
COPY .env.docker ./.env

# Expose port 5173
EXPOSE 5173

# Start the development server
CMD ["npm", "run", "dev"] 