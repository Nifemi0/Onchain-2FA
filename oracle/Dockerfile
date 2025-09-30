# Use a Node.js base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./oracle/package.json
COPY package-lock.json ./oracle/package-lock.json
RUN npm install --prefix ./oracle

# Copy the rest of the oracle code
COPY . /app/oracle

# Expose the port the oracle runs on
EXPOSE 4430

# Start the oracle application
CMD ["npm", "start", "--prefix", "./oracle"]
