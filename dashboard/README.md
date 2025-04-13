# SolarBot.io Dashboard

A comprehensive React-based dashboard for the SolarBot Solana trading bot.

## Features

- **Responsive Design**: Built with Chakra UI for a modern, responsive interface
- **Trade Management**: Monitor and execute trades directly from the dashboard
- **Multi-Wallet Support**: Manage multiple wallets for different trading strategies
- **Real-time Analytics**: Track performance with interactive charts and metrics
- **Secure Authentication**: JWT-based authentication system
- **API Integration**: Connect directly to the SolarBot trading API

## Getting Started

### Local Development

1. Install dependencies:
   ```bash
   cd dashboard
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Vercel Integration Guide

Follow these steps to integrate the dashboard with your solarbot.io website on Vercel:

### Option 1: Deploy as a Subdirectory

If you want to host the dashboard as part of your main website (e.g., solarbot.io/dashboard):

1. In your website repository, create a directory structure that includes both your main website and the dashboard:
   ```
   /website         # Your existing website code
   /dashboard       # The dashboard code from this repo
   ```

2. Configure your Vercel project to recognize both applications. Create a `vercel.json` file in the root:
   ```json
   {
     "buildCommand": "cd website && npm run build && cd ../dashboard && npm run build",
     "outputDirectory": "website/build",
     "rewrites": [
       { "source": "/dashboard/(.*)", "destination": "/dashboard/$1" },
       { "source": "/(.*)", "destination": "/website/$1" }
     ]
   }
   ```

### Option 2: Deploy as a Subdomain

For a cleaner separation, you can deploy the dashboard on a subdomain (e.g., dashboard.solarbot.io):

1. Push this dashboard code to your GitHub repository (either as a new repo or in a branch named `dashboard`).

2. Create a new project in Vercel and link it to your repository/branch.

3. In the Vercel project settings, set the domain to `dashboard.solarbot.io`.

4. Configure your build settings:
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

## Connecting to Your Trading Bot API

The dashboard is designed to connect to your SolarBot trading API. Follow these steps to configure the connection:

1. Create a `.env` file in the dashboard directory with your API endpoint:
   ```
   REACT_APP_API_ENDPOINT=https://api.solarbot.io
   # Or for local development
   # REACT_APP_API_ENDPOINT=http://localhost:3000
   ```

2. If you're using environment variables in Vercel, add the API endpoint in your project settings.

3. For local development, ensure your API server has CORS enabled to accept requests from the dashboard.

## API Service Configuration

To connect the dashboard to your trading bot API, create an API service file:

```bash
# Create the API service file
mkdir -p src/services
touch src/services/api.js
```

Edit the `api.js` file to include methods for communicating with your trading bot API:

```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to inject auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('solarbot_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth methods
export const login = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};

// Wallet methods
export const getWallets = async () => {
  const response = await api.get('/api/wallets');
  return response.data;
};

export const addWallet = async (walletData) => {
  const response = await api.post('/api/wallets', walletData);
  return response.data;
};

// Trading methods
export const getOpportunities = async (minProfit) => {
  const response = await api.get('/api/opportunities', {
    params: { minProfit },
  });
  return response.data;
};

export const executeTrade = async (opportunity, simulationMode = true) => {
  const response = await api.post('/api/execute-trade', { opportunity, simulationMode });
  return response.data;
};

// Dashboard data
export const getDashboardStats = async () => {
  const response = await api.get('/api/dashboard/stats');
  return response.data;
};

export const getRecentTrades = async () => {
  const response = await api.get('/api/trades/recent');
  return response.data;
};

// Settings
export const getSettings = async () => {
  const response = await api.get('/api/settings');
  return response.data;
};

export const updateSettings = async (settings) => {
  const response = await api.put('/api/settings', settings);
  return response.data;
};

export default {
  login,
  getWallets,
  addWallet,
  getOpportunities,
  executeTrade,
  getDashboardStats,
  getRecentTrades,
  getSettings,
  updateSettings,
};
```

## Security Considerations

1. The dashboard includes JWT authentication - make sure your API validates tokens properly
2. Use HTTPS for all API communications, especially for wallet management
3. Consider adding rate limiting to prevent abuse
4. Implement IP whitelisting for additional security

## Customization

You can customize the dashboard to match your brand by editing the theme in `src/theme.js` (you'll need to create this file).

## License

This dashboard is proprietary software and is intended for use only with SolarBot.io.
