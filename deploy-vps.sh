#!/bin/bash

# SolarBot VPS Deployment Script
# This script helps deploy the SolarBot arbitrage trading bot to a VPS

echo "=========================================="
echo "SolarBot VPS Deployment Script"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run this script as root or with sudo"
  exit 1
fi

# Update system packages
echo "Updating system packages..."
apt update
apt upgrade -y

# Install required dependencies
echo "Installing dependencies..."
apt install -y curl git build-essential

# Install Node.js
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify Node.js installation
echo "Node.js version:"
node -v
echo "NPM version:"
npm -v

# Create a new user for running the bot (more secure than running as root)
echo "Creating a new user 'solarbot' for running the application..."
adduser --disabled-password --gecos "" solarbot

# Clone the repository
echo "Cloning the SolarBot repository..."
cd /home/solarbot
git clone https://github.com/arodrig125/solana-telegram-arb-bot.git
chown -R solarbot:solarbot solana-telegram-arb-bot

# Switch to the solarbot user
echo "Switching to solarbot user and setting up the application..."
su - solarbot << 'EOF'
cd ~/solana-telegram-arb-bot
npm install

# Create .env file from example
cp .env.example .env
echo "Created .env file. You'll need to edit it with your credentials."

# Install PM2 globally
echo "Installing PM2 process manager..."
npm install -g pm2

# Set up PM2 to start on boot
echo "Setting up PM2 to start on system boot..."
pm2 startup
EOF

# Set up PM2 startup as root
pm2 startup systemd -u solarbot --hp /home/solarbot

echo ""
echo "=========================================="
echo "Deployment completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your credentials:"
echo "   nano /home/solarbot/solana-telegram-arb-bot/.env"
echo ""
echo "2. Start the bot with PM2:"
echo "   su - solarbot"
echo "   cd ~/solana-telegram-arb-bot"
echo "   pm2 start server.js --name solarbot"
echo "   pm2 save"
echo ""
echo "3. Monitor the bot:"
echo "   pm2 logs solarbot"
echo "   pm2 monit"
echo ""
echo "For more information, visit: https://solarbot.io/documentation.html#vps-deployment"
echo ""
