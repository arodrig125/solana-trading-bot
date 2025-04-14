./deploy-vps-autoscaling.sh
#!/bin/bash

# SolarBot VPS Auto-scaling Deployment Script
echo "=========================================="
echo "SolarBot VPS Auto-scaling Deployment"
echo "=========================================="

# List of files to copy
FILES_TO_COPY=(
    "ecosystem.config.js"
    "cluster.js"
    "server.js"
    "utils/scaling-manager.js"
    "utils/alerts.js"
    "scripts/deploy-autoscaling.sh"
)

# Your VPS details (replace these with your actual values)
VPS_USER="solarbot"
VPS_HOST="your-vps-ip"
VPS_DIR="/home/solarbot/solana-telegram-arb-bot"

# Create required directories on VPS
echo "Creating directories on VPS..."
ssh $VPS_USER@$VPS_HOST "mkdir -p $VPS_DIR/utils $VPS_DIR/scripts"

# Copy new files to VPS
echo "Copying auto-scaling configuration files..."
for file in "${FILES_TO_COPY[@]}"; do
    echo "Copying $file..."
    scp "$file" "$VPS_USER@$VPS_HOST:$VPS_DIR/$file"
done

# SSH into VPS and setup auto-scaling
echo "Setting up auto-scaling on VPS..."
ssh $VPS_USER@$VPS_HOST << 'EOF'
    cd ~/solana-telegram-arb-bot

    # Make deploy script executable
    chmod +x scripts/deploy-autoscaling.sh

    # Install dependencies if needed
    npm install express cluster os

    # Stop existing PM2 processes
    pm2 delete all

    # Start with new auto-scaling configuration
    ./scripts/deploy-autoscaling.sh

    # Show status
    echo "Current PM2 status:"
    pm2 list

    # Show monitoring instructions
    echo ""
    echo "Auto-scaling deployment complete!"
    echo "To monitor:"
    echo "- View metrics: pm2 monit"
    echo "- View logs: pm2 logs"
    echo "- Check status: pm2 list"
EOF

echo ""
echo "=========================================="
echo "Deployment completed!"
echo "=========================================="
