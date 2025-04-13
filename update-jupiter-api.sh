#!/bin/bash

# Update Jupiter API integration
echo "Updating Jupiter API integration..."

# Run the update script
node update-jupiter-api.js

# Check if the update was successful
if [ $? -eq 0 ]; then
  echo "✅ Jupiter API update completed successfully!"
else
  echo "❌ Error updating Jupiter API"
  exit 1
fi

# Restart the bot
echo "Restarting the bot..."
pm2 restart all || node server.js

echo "✅ Bot restarted"
