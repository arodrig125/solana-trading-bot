#!/bin/bash

# Script to deploy website changes to Vercel

# Make sure we're on the website-with-icons branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "website-with-icons" ]; then
  echo "Switching to website-with-icons branch..."
  git checkout website-with-icons
fi

# Step 1: Add website changes to git
echo "Adding website changes to git..."
git add website/ vercel.json

# Step 2: Commit changes
echo "Enter commit message:"
read commit_message
git commit -m "$commit_message"

# Step 3: Push to GitHub
echo "Pushing to GitHub..."
git push origin website-with-icons

# Step 4: Trigger Vercel deployment
echo "Triggering Vercel deployment..."

# Replace with your actual Vercel deploy hook URL
DEPLOY_HOOK="https://api.vercel.com/v1/integrations/deploy/YOUR_PROJECT_ID/YOUR_DEPLOY_HOOK_TOKEN"

# Check if deploy hook is configured
if [[ $DEPLOY_HOOK == *"YOUR_PROJECT_ID"* ]]; then
  echo "⚠️ Deploy hook not configured! Please update the DEPLOY_HOOK variable in this script."
  echo "You can find your deploy hook in the Vercel dashboard under Settings > Git > Deploy Hooks."
else
  curl -X POST $DEPLOY_HOOK
fi

echo "\nDeployment process completed!"
