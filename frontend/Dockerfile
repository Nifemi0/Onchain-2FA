# Use a Node.js base image
FROM node:20-alpine

# Set working directory
WORKDIR /app/frontend

# Copy package.json and install dependencies
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "start"]
