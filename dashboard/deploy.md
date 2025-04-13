# SolarBot Dashboard Deployment Guide

## Deployment to Vercel

This guide will help you deploy the SolarBot dashboard to Vercel and configure it to work with your existing website at solarbot.io.

### Prerequisites

1. A Vercel account connected to your GitHub repository
2. Your SolarBot API running and accessible (for production deployment)

### Option 1: Deploy as a Subdomain (Recommended)

Deploying as a subdomain (e.g., `dashboard.solarbot.io`) provides clean separation between your main website and the dashboard.

#### Steps:

1. **Push the dashboard code to GitHub**

   ```bash
   # From the dashboard directory
   git add .
   git commit -m "Add SolarBot dashboard"
   git push origin main
   ```

2. **Create a new project in Vercel**

   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your repository
   - Configure the project:
     - Framework Preset: Create React App
     - Root Directory: `/dashboard` (if your repo contains other code)
     - Build Command: `npm run build`
     - Output Directory: `build`
     - Install Command: `npm install`

3. **Configure Environment Variables**

   Add the following environment variables in Vercel project settings:
   
   ```
   REACT_APP_API_ENDPOINT=https://api.solarbot.io
   ```

4. **Set up Custom Domain**

   - In your Vercel project, go to "Settings" > "Domains"
   - Add domain: `dashboard.solarbot.io`
   - Follow the instructions to configure DNS settings with your domain provider

### Option 2: Deploy as Part of Your Main Website

If you prefer to have the dashboard accessible at `solarbot.io/dashboard`:

1. **Set up vercel.json in your main website repository**

   Create a `vercel.json` file in your main website repository:

   ```json
   {
     "rewrites": [
       { "source": "/dashboard/(.*)", "destination": "https://solarbot-dashboard.vercel.app/$1" },
       { "source": "/(.*)", "destination": "/$1" }
     ]
   }
   ```

2. **Deploy your main website to Vercel**

   This configuration will proxy requests to `/dashboard/*` to your dashboard app while keeping your main website at the root.

## Development Setup

### Local Development

1. **Install dependencies**
   ```bash
   cd dashboard
   npm install
   ```

2. **Set up environment variables**
   Create a `.env.local` file based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Testing the API connection**
   Ensure your API server is running locally or you've configured the `.env.local` file to point to a development API server.

## Production Deployment Checklist

Before deploying to production, ensure:

1. API endpoints are correctly configured and secured
2. Environment variables are set properly in Vercel
3. Authentication is properly tested
4. All features work as expected

## Troubleshooting

### API Connection Issues

If the dashboard can't connect to the API:

1. Check that CORS is enabled on your API server
2. Verify the `REACT_APP_API_ENDPOINT` environment variable is set correctly
3. Ensure your API server is running and accessible

### Authentication Problems

If users can't log in:

1. Check the authentication implementation in the API
2. Verify JWT tokens are being properly generated and validated
3. Check browser console for errors

### Build Failures

If the build fails in Vercel:

1. Check the build logs for errors
2. Ensure all dependencies are properly installed
3. Verify that environment variables are correctly set

## Contact

For help with deployment issues, contact support@solarbot.io
