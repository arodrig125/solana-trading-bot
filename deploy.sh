#!/bin/bash

# Risk Automation System Deployment Script for Digital Ocean
echo "Preparing to deploy Risk Automation System to Digital Ocean..."

# Ensure we have the latest code
if [ -z "$(git status --porcelain)" ]; then 
  echo "Working directory clean, proceeding with deployment"
else 
  echo "Uncommitted changes found. Please commit your changes before deploying."
  git status
  exit 1
fi

# Build deployment package
echo "Creating deployment package..."
rm -f deploy.zip
zip -r deploy.zip . -x "node_modules/*" ".git/*" "*.zip" "*.log"

echo "=========================="
echo "Deployment package created: deploy.zip"
echo "=========================="
echo "To deploy to your Digital Ocean droplet:"
echo "1. Upload the deployment package to your droplet:"
echo "   scp deploy.zip user@your-droplet-ip:/path/to/app"
echo "2. SSH into your droplet:"
echo "   ssh user@your-droplet-ip"
echo "3. Unzip and install dependencies:"
echo "   cd /path/to/app"
echo "   unzip -o deploy.zip"
echo "   npm install"
echo "4. Restart the application:"
echo "   pm2 restart app.json"
echo "=========================="
