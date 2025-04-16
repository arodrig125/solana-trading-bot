#!/bin/bash

# Script to trigger a Vercel deployment

echo "Triggering Vercel deployment..."
curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_DQgT4Uj2p4OE60K5NeuwzC8G3bBx/lWWVsvEqjO"

echo ""
echo "Deployment triggered. Check your Vercel dashboard for deployment status."
echo "Visit your site to verify the deployment."
