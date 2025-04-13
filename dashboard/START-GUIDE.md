# SolarBot Dashboard - Getting Started Guide

This guide will walk you through the process of running the SolarBot dashboard locally for development and testing, as well as deploying it to your solarbot.io website.

## Local Development

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- API server running (locally or remotely)

### Setup and Run

1. **Install dependencies**

   ```bash
   cd dashboard
   npm install
   ```

2. **Configure environment variables**

   Create a `.env.local` file in the dashboard root directory with the following content:

   ```
   REACT_APP_API_ENDPOINT=http://localhost:3000
   ```

   Update the API endpoint to point to your running API server. If your API is running on a different port, adjust accordingly.

3. **Start the development server**

   ```bash
   npm start
   ```

   This will start the React development server and open the dashboard in your browser at http://localhost:3000.

## Testing the Dashboard

### Demo Credentials

For testing purposes, you can use the following credentials:

- **Email**: demo@solarbot.io
- **Password**: demo123

### Test Workflow

1. **Login Page:** Start by testing the login functionality with the demo credentials
2. **Dashboard:** Check that the overview metrics and charts load correctly
3. **Trading Page:** Test the trading interface, opportunity discovery, and trade simulation
4. **Wallets Page:** Verify wallet management functionality
5. **Analytics Page:** Confirm that performance metrics and charts display properly
6. **Settings Page:** Test configuration options

## Deploying to Vercel for solarbot.io

The dashboard is configured for easy deployment to Vercel, which will make it available at your solarbot.io domain.

### Deployment Options

1. **As a Subdomain (Recommended)**

   Deploy to dashboard.solarbot.io

   ```bash
   # Push your code to GitHub first
   npm run build
   vercel --prod
   ```

   Follow the Vercel CLI prompts or use the Vercel web interface to configure your deployment.

2. **As part of your main website**

   To integrate with your existing solarbot.io website, follow the instructions in `deploy.md`.

### Production Environment Variables

For production deployment, set the following environment variables in Vercel:

```
REACT_APP_API_ENDPOINT=https://api.solarbot.io
```

## Integration with the Trading Bot API

The dashboard is designed to connect seamlessly with your SolarBot trading API. Key integration points:

1. **Authentication**: The dashboard uses JWT-based authentication to secure access to your API
2. **API Client**: The `api.js` service is pre-configured to connect to your API endpoints
3. **Wallet Management**: Integration with the multi-wallet functionality you've implemented
4. **Trading Operations**: Connected to your arbitrage discovery and trade execution endpoints

## Next Steps

1. **Customize the dashboard**: Update branding elements, colors, and themes in `theme.js`
2. **Add more features**: Consider implementing notifications, alerts, or additional analytics
3. **Connect to real data**: Ensure API endpoints match those defined in the dashboard's API service
4. **Setup monitoring**: Add error tracking and performance monitoring

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check that your API server is running
   - Verify CORS settings on your API server
   - Confirm the API endpoint in `.env.local` or Vercel environment variables

2. **Build Errors**
   - Run `npm install` to ensure all dependencies are installed
   - Clear your browser cache and local storage
   - Check for errors in the console

3. **Authentication Issues**
   - Verify that your API is correctly validating JWT tokens
   - Check that token expiration settings match between frontend and backend

## Support

For any questions or issues, please contact support@solarbot.io or create an issue in the GitHub repository.
