# Use a Node version that meets the requirement (>=19.0.0)
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install

# Copy the rest of your application code
COPY . .

# Specify the command to run your app.
# If you're using the default start command and have upgraded package.json to include "start",
# you can use: CMD ["yarn", "start"]
# Otherwise, if you want to run "start:auth", use:
CMD ["yarn", "start:auth"]