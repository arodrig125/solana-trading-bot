#!/bin/bash

# Script to update both website-with-icons and main branches, and trigger Vercel deployment

# Check if a commit message was provided
if [ -z "$1" ]; then
  echo "Please provide a commit message"
  echo "Usage: ./deploy-all.sh \"Your commit message\""
  exit 1
fi

# Store the commit message
COMMIT_MESSAGE="$1"

# Make sure we're on the website-with-icons branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "website-with-icons" ]; then
  echo "Switching to website-with-icons branch..."
  git checkout website-with-icons
fi

# Add and commit changes to website-with-icons
echo "Adding and committing changes to website-with-icons branch..."
git add website/
git commit -m "$COMMIT_MESSAGE"
git push origin website-with-icons

# Now update the main branch
echo "Switching to main branch..."
git checkout main

# Merge changes from website-with-icons
echo "Merging changes from website-with-icons branch..."
git merge website-with-icons -m "Merge website changes: $COMMIT_MESSAGE"

# Push to main
echo "Pushing to main branch..."
git push origin main

# Trigger Vercel deployment
echo "Triggering Vercel deployment..."

# Vercel deploy hook URL
# TODO: Replace this with your new deploy hook URL from Vercel
DEPLOY_HOOK="https://api.vercel.com/v1/integrations/deploy/YOUR_NEW_PROJECT_ID/YOUR_NEW_DEPLOY_HOOK_TOKEN"

# Check if deploy hook is configured
if [[ $DEPLOY_HOOK == *"YOUR_NEW_PROJECT_ID"* ]]; then
  echo "⚠️ Deploy hook not configured! Please update the DEPLOY_HOOK variable in this script."
  echo "You can find your deploy hook in the Vercel dashboard under Settings > Git > Deploy Hooks."
else
  curl -X POST $DEPLOY_HOOK

  # Check the response
  if [ $? -eq 0 ]; then
    echo "✅ Deploy hook executed successfully!"
  else
    echo "❌ Error executing deploy hook. Please check your internet connection or the hook URL."
  fi
fi

# Go back to the website-with-icons branch
git checkout website-with-icons

echo ""
echo "Deployment process completed!"
