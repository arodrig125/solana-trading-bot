#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env

# Configuration
APP_NAME="solana-trading-bot"
DOCKER_REGISTRY="registry.digitalocean.com"
DOCKER_REPO="your-registry"  # Replace with your Digital Ocean registry name

# Build the Docker image
echo "Building Docker image..."
docker build -t $APP_NAME .

# Tag the image
echo "Tagging image..."
docker tag $APP_NAME $DOCKER_REGISTRY/$DOCKER_REPO/$APP_NAME:latest

# Push to Digital Ocean Registry
echo "Pushing to Digital Ocean Registry..."
docker push $DOCKER_REGISTRY/$DOCKER_REPO/$APP_NAME:latest

# Update the app on Digital Ocean App Platform
echo "Deploying to Digital Ocean..."
doctl apps create-deployment your-app-id  # Replace with your Digital Ocean app ID

echo "Deployment complete!"
