#!/bin/bash

# Script to deploy website changes to Vercel

# Make sure we're on the website branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "website" ]; then
  echo "Switching to website branch..."
  git checkout website
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
git push origin website

# Step 4: Trigger Vercel deployment
echo "Triggering Vercel deployment..."

# Vercel production deploy hook URL for dedicated website project
# NOTE: This hook deploys only the website directory as the root
DEPLOY_HOOK="https://api.vercel.com/v1/integrations/deploy/prj_YcHJG6sUCfsmrFGRhIcx4i4ZG8e4/jsBOCMWQr4"

# Execute the deploy hook
echo "Executing deploy hook..."
curl -X POST $DEPLOY_HOOK

# Check the response
if [ $? -eq 0 ]; then
  echo "✅ Deploy hook executed successfully!"
else
  echo "❌ Error executing deploy hook. Please check your internet connection or the hook URL."
fi

echo ""
echo "Deployment process completed!"
