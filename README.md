# SolarBot – Solana Trading Bot & REST API

[![Vercel](https://img.shields.io/badge/Vercel-Deployed-brightgreen)](https://vercel.com)

An advanced Solana arbitrage trading bot featuring:
- RESTful API with authentication, wallet management, trading, analytics, and admin endpoints
- Telegram command interface
- Google Sheets logging
- Jupiter Swap API integration
- Robust error handling and security (rate limiting, Sentry, security headers)
- Professional onboarding and documentation

---

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Generating Secrets](#generating-secrets)
- [Running the Server](#running-the-server)
- [API Usage](#api-usage)
- [Admin Features](#admin-features)
- [Error Handling](#error-handling)
- [Deployment (Digital Ocean)](#deployment-digital-ocean)
- [Website Deployment](#website-deployment)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)
- [Support](#support)

---

## Features
- 🔍 **Arbitrage & Trading**: Triangular/cross-exchange, customizable thresholds
- 🤖 **Telegram Bot**: Real-time alerts, command control, summaries
- 📊 **Analytics**: Google Sheets integration, performance tracking
- ⚙️ **REST API**: Wallet, trade, analytics, admin, 2FA endpoints
- 🔒 **Security**: JWT, rate limiting, Sentry, security headers, tiered access

---

## Architecture
```
+---------------------+
|   Telegram Client   |
+---------------------+
           |
           v
+---------------------+      +--------------------+
|   Express.js API    |<---->|   MongoDB Atlas    |
+---------------------+      +--------------------+
           |
           v
+---------------------+
|   Trading Engine    |
+---------------------+
           |
           v
+---------------------+
|  Solana Blockchain  |
+---------------------+
```

---

## Prerequisites
- Node.js (v18+ recommended)
- npm
- MongoDB Atlas or local MongoDB
- Telegram Bot Token (from @BotFather)
- Solana wallet private key (array format)
- Google Sheets API credentials (optional)
- Digital Ocean (for production deployment)

---

## Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/arodrig125/solana-trading-bot.git
   cd solana-trading-bot
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Copy and edit the .env file:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials (see next section)
   ```

---

## Environment Variables
Below are the required `.env` variables with descriptions:

| Name                  | Description                                      |
|-----------------------|--------------------------------------------------|
| TELEGRAM_BOT_TOKEN    | Telegram bot token from @BotFather               |
| TELEGRAM_CHAT_ID      | Your Telegram chat ID                            |
| PRIVATE_KEY           | Solana wallet private key (array format)         |
| SHEET_ID              | Google Sheet ID for analytics                    |
| SIMULATION            | true/false for simulation mode                   |
| RPC_ENDPOINT          | Solana RPC endpoint                              |
| MONGODB_URI           | MongoDB Atlas connection string                  |
| ADMIN_USERNAME        | Username for admin API access                    |
| ADMIN_PASSWORD_HASH   | Bcrypt hash of admin password                    |
| JWT_SECRET            | Secret for JWT signing                           |
| PORT                  | Port to run the Express server                   |
| SENTRY_DSN            | Sentry DSN for error tracking                    |

**Example:**
```
TELEGRAM_BOT_TOKEN=1234:abcd
TELEGRAM_CHAT_ID=5678
PRIVATE_KEY=[1,2,3,...]
SHEET_ID=your-google-sheet-id
SIMULATION=true
RPC_ENDPOINT=https://api.mainnet-beta.solana.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$EFL/xpij.70fDbA.EySTweOlxx.Fri5WCUVLUooiFSjQLWoQp2blq
JWT_SECRET=supersecretjwtkey
PORT=3005
SENTRY_DSN=https://xxxxxxx@sentry.io/xxxxxx
```

---

## Generating Secrets
- **Admin Password Hash (bcrypt):**
  Run in Node.js REPL:
  ```js
  const bcrypt = require('bcrypt');
  bcrypt.hash('your_admin_password', 10).then(console.log);
  ```
  Use the output as `ADMIN_PASSWORD_HASH` in your `.env`.

- **JWT Secret:**
  Use a long, random string (e.g., from `openssl rand -hex 32`).

---

## Running the Server
- **Development:**
  ```bash
  npm run dev
  ```
- **Production:**
  ```bash
  npm start
  ```
- The API will be available at `http://localhost:<PORT>`

---

## API Usage
### Authentication
- Register and login endpoints return a JWT for authenticated requests.
- Pass JWT as `Authorization: Bearer <token>` header.

### Example: Register
```bash
curl -X POST http://localhost:3005/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"user1","password":"mypassword"}'
```

### Example: Login
```bash
curl -X POST http://localhost:3005/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"user1","password":"mypassword"}'
```

### Example: Get Wallets
```bash
curl http://localhost:3005/api/wallet \
  -H 'Authorization: Bearer <your_jwt>'
```

### Error Handling
All errors are returned as JSON:
```
{
  "error": "Human-readable error message"
}
```
Status codes are standardized:
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `409` Conflict
- `500` Internal Server Error

---

## Admin Features
- Admin endpoints require valid JWT from admin login.
- Example: List all users
```bash
curl http://localhost:3005/admin/api/users \
  -H 'Authorization: Bearer <admin_jwt>'
```
- Admin actions include user management, API key management, and analytics.

---

## Deployment (Digital Ocean)
- Provision a Droplet (Ubuntu recommended)
- Clone repo, set up Node.js, and MongoDB credentials
- Set up `.env` as above
- Use `pm2` or similar to run in production
- Set up firewall/security groups
- (Optional) Use Nginx as reverse proxy and for HTTPS

---

## Website Deployment

The SolarBot website is automatically deployed to Vercel when changes are pushed to the `website` branch.

### Automatic Deployments
- Push changes to the `website` branch to trigger automatic deployment
- GitHub Actions will build and deploy the website to Vercel
- Monitor deployment status in the GitHub Actions tab

### Manual Deployment
- Run the deployment script: `./scripts/deploy-vercel.sh`
- Or use cURL to trigger the deployment hook directly

### Deployment Configuration
- Deployment is configured via GitHub Actions workflows in `.github/workflows/`
- Secure deployment uses GitHub Secrets for the Vercel deployment hook
- See `DEPLOYMENT.md` for detailed deployment instructions

---

## Troubleshooting
- **Missing env vars:** Check `.env` and ensure all required variables are set
- **MongoDB connection errors:** Verify URI, network access, and credentials
- **Sentry errors:** Ensure `SENTRY_DSN` is correct or remove Sentry integration if unused
- **Server crashes:** Check logs for variable redeclarations or import issues
- **API returns 401/403:** Ensure JWT is sent in `Authorization` header

---

## Security Best Practices
- Never commit `.env` or secrets to version control
- Use strong, unique secrets for JWT and admin password
- Restrict MongoDB and server access with firewalls
- Always use HTTPS in production
- Keep dependencies up to date

---

## Support
- For issues, open an issue on GitHub or contact the maintainer
- Contributions welcome via pull requests!

---

## License
MIT
