# Use a Node.js base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install Python3, make, and g++ for node-gyp compilation
RUN apk add --no-cache python3 make g++

# Set Python as the default for node-gyp
ENV NPM_CONFIG_PYTHON=/usr/bin/python3

# Copy package.json and install dependencies
COPY package.json ./backend/package.json
COPY package-lock.json ./backend/package-lock.json
RUN rm -rf ./backend/node_modules && npm install --prefix ./backend

# Copy the rest of the backend code
COPY . /app/backend

# Expose the port the backend runs on
EXPOSE 3001

# Start the backend application
CMD ["npm", "start", "--prefix", "./backend"]
