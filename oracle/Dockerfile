# Use a Node.js base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install Python3, make, and g++ for node-gyp compilation
RUN apk add --no-cache python3 make g++

# Set Python as the default for node-gyp
ENV NPM_CONFIG_PYTHON=/usr/bin/python3

# Copy package.json and install dependencies
COPY package.json ./oracle/package.json
COPY package-lock.json ./oracle/package-lock.json
RUN rm -rf ./oracle/node_modules && npm install --prefix ./oracle

# Copy the rest of the oracle code
COPY . /app/oracle

# Expose the port the oracle runs on
EXPOSE 4430

# Start the oracle application
CMD ["npm", "start", "--prefix", "./oracle"]
