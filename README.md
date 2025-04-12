# SolarBot - Solana Trading Bot

An advanced Solana arbitrage trading bot with Telegram command control, Google Sheets logging, Jupiter Swap API integration, and a professional website.

## Features

- 🔍 **Advanced Arbitrage Detection**
  - Triangular arbitrage (e.g., USDC → SOL → BTC → USDC)
  - Cross-exchange arbitrage
  - Customizable profit thresholds

- 🤖 **Telegram Bot Interface**
  - Real-time notifications
  - Command-based control
  - Performance reports
  - Trade summaries

- 📊 **Analytics & Reporting**
  - Google Sheets integration
  - Performance tracking
  - Daily summaries
  - Trade history

- ⚙️ **Advanced Configuration**
  - Token whitelist/blacklist
  - Risk management settings
  - Customizable scanning intervals
  - Profit thresholds

- 🔒 **Risk Management**
  - Circuit breaker (stops after consecutive losses)
  - Daily volume limits
  - Maximum trade limits
  - Minimum wallet balance requirements

## Setup

### Prerequisites

1. Node.js (v18 or higher)
2. Telegram Bot Token (from @BotFather)
3. Solana Wallet Private Key
4. Google Sheets API credentials (optional)

### Installation

1. Clone this repository
   ```bash
   git clone https://github.com/arodrig125/solana-trading-bot.git
   cd solana-trading-bot
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your credentials
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_telegram_chat_id
   PRIVATE_KEY=[your_wallet_private_key_array]
   SHEET_ID=your_google_sheet_id
   SIMULATION=true
   ```

5. Start the bot
   ```bash
   npm start
   ```

### Google Sheets Setup (Optional)

1. Create a Google Cloud project
2. Enable the Google Sheets API
3. Create a service account and download the credentials.json file
4. Place the credentials.json file in the root directory
5. Create a Google Sheet and share it with the service account email
6. Add the Sheet ID to your .env file

## Telegram Commands

- `/start` - Start the bot and show available commands
- `/ping` - Check if the bot is running
- `/chatid` - Get your chat ID
- `/live` - Enable live trading mode
- `/simulate` - Enable simulation mode
- `/pause` - Pause background scanning
- `/resume` - Resume background scanning
- `/setprofit <percent>` - Set minimum profit percentage
- `/status` - Get current bot status
- `/summary` - Get performance summary
- `/opportunities` - View recent opportunities
- `/trades` - View recent trades
- `/settings` - View current settings
- `/help` - Show help message

## Deployment

### Website Deployment

The website is deployed on Vercel from the `main` branch. The website files are located in the `website/` directory.

### Bot Deployment

#### Deploying on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `node index.js`
4. Add all environment variables from your .env file

#### Deploying on a VPS

See the [VPS Deployment Guide](VPS_DEPLOYMENT_GUIDE.md) for detailed instructions on deploying the bot on a Virtual Private Server.

## Configuration

You can customize the bot's behavior by editing the files in the `config` directory:

- `tokens.js` - Token addresses and pairs to monitor
- `settings.js` - Bot settings (scanning interval, profit thresholds, etc.)

## License

MIT
