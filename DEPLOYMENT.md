# SolarBot Website Deployment Guide

This guide explains how to set up and use automatic deployments for the SolarBot website using GitHub Actions and Vercel.

## Automatic Deployment Setup

The repository is configured to automatically deploy to Vercel whenever changes are pushed to the `website` or `main` branches, or when pull requests are merged.

### How It Works

1. When you push changes to the `website` or `main` branch, GitHub Actions will automatically trigger.
2. The workflow will:
   - Check out your code
   - Set up Node.js
   - Install dependencies
   - Build the project
   - Trigger a deployment to Vercel using the deployment hook

### Using the Secure Workflow (Recommended)

For security reasons, we recommend using the secure workflow that stores the Vercel deployment hook URL as a GitHub Secret.

#### Setting Up GitHub Secrets

1. Go to your GitHub repository
2. Click on "Settings"
3. Click on "Secrets and variables" in the left sidebar
4. Click on "Actions"
5. Click on "New repository secret"
6. Enter `VERCEL_DEPLOY_HOOK` as the name
7. Enter your Vercel deployment hook URL as the value:
   ```
   https://api.vercel.com/v1/integrations/deploy/prj_DQgT4Uj2p4OE60K5NeuwzC8G3bBx/lWWVsvEqjO
   ```
8. Click "Add secret"

Once you've set up the secret, the secure workflow will use this value instead of hardcoding the URL in the workflow file.

## Manual Deployment

If you need to manually trigger a deployment, you can:

1. Push a small change to the `website` or `main` branch
2. Use the Vercel dashboard to trigger a deployment
3. Use cURL to trigger the deployment hook:
   ```bash
   curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_DQgT4Uj2p4OE60K5NeuwzC8G3bBx/lWWVsvEqjO
   ```

## Verifying Deployments

After a deployment is triggered:

1. Check the GitHub Actions tab in your repository to see the workflow status
2. Visit the Vercel dashboard to see the deployment status
3. Visit your website to verify the changes are live

## Troubleshooting

If deployments are not working as expected:

1. Check the GitHub Actions logs for any errors
2. Verify that the Vercel deployment hook is correct
3. Make sure your Vercel project is properly configured
4. Check that your build process is completing successfully

## Important Security Note

The Vercel deployment hook URL is sensitive information that allows anyone with the URL to trigger deployments of your project. Always use GitHub Secrets to store this URL and never commit it directly to your repository.
