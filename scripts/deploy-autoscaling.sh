#!/bin/bash

# Deploy script for auto-scaling configuration

echo "Deploying SolarBot with auto-scaling configuration..."

# Ensure PM2 is installed globally
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Stop any existing instances
pm2 delete all

# Create logs directory if it doesn't exist
mkdir -p logs

# Set environment variables for production
export NODE_ENV=production

# Start the application with PM2 in cluster mode
echo "Starting application with auto-scaling configuration..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup

echo "Deployment complete!"
echo "Monitoring commands:"
echo "- View logs: pm2 logs"
echo "- Monitor processes: pm2 monit"
echo "- View metrics: pm2 prettylist"
echo "- Scale manually: pm2 scale solarbot-worker +1/-1"
