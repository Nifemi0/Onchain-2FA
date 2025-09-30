# Use a Node.js base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./frontend/package.json
COPY package-lock.json ./frontend/package-lock.json
RUN npm install --prefix ./frontend

# Copy the rest of the frontend code
COPY . /app/frontend

# Build the Next.js application
RUN npm run build --prefix ./frontend

# Expose the port Next.js runs on
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "start", "--prefix", "./frontend"]
