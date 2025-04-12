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

# Vercel production deploy hook URL
# NOTE: Update this with the new deploy hook URL after recreating the Vercel project
DEPLOY_HOOK="https://api.vercel.com/v1/integrations/deploy/prj_kT3zsi2xyA9xLsVFoW0ThIRAeHUc/c4RmDPNB6d"

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
