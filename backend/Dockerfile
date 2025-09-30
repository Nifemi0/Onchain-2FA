# Use a Node.js base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./backend/package.json
COPY package-lock.json ./backend/package-lock.json
RUN npm install --prefix ./backend

# Copy the rest of the backend code
COPY . /app/backend

# Expose the port the backend runs on
EXPOSE 3001

# Start the backend application
CMD ["npm", "start", "--prefix", "./backend"]
