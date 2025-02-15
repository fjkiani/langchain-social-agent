# Use the official Node.js 18 image based on Alpine Linux
FROM node:18-alpine

# Create and set the working directory in the container
WORKDIR /app

# Copy package files first to leverage Docker cache for npm install
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code into the container
COPY . .

# If your app needs a build step, uncomment the next line (and ensure you have a build script defined in package.json)
# RUN npm run build

# Expose the port that your application will listen on (adjust if necessary)
EXPOSE 3000

# Define the command to run your app; adjust if your start command is different
CMD ["npm", "start"]