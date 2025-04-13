# SolarBot VPS Deployment Guide

This guide provides step-by-step instructions for deploying the SolarBot arbitrage trading bot to a Virtual Private Server (VPS).

## Prerequisites

Before you begin, make sure you have:

1. A SolarBot subscription (Basic, Advanced, Professional, or Enterprise)
2. A VPS with at least the following specifications:
   - 1 CPU core
   - 2GB RAM
   - 20GB SSD storage
   - Ubuntu 20.04 LTS or later
3. SSH access to your VPS
4. A Solana wallet with SOL for transaction fees
5. USDC or WSOL tokens for trading
6. A Telegram bot token (obtained from @BotFather)

## Recommended VPS Providers

We recommend the following VPS providers:

- [DigitalOcean](https://www.digitalocean.com/) - $5-10/month droplet
- [AWS Lightsail](https://aws.amazon.com/lightsail/) - $5-10/month instance
- [Linode](https://www.linode.com/) - $5-10/month Linode
- [Vultr](https://www.vultr.com/) - $5-10/month instance

## Deployment Steps

### 1. Set Up Your VPS

1. Create an account with your chosen VPS provider
2. Create a new VPS instance with Ubuntu 20.04 LTS
3. Set up SSH access to your VPS
4. Connect to your VPS via SSH:
   ```bash
   ssh username@your-vps-ip
   ```

### 2. Automatic Deployment (Recommended)

We provide an automatic deployment script that handles all the necessary setup steps:

1. Download the deployment script:
   ```bash
   wget https://solarbot.io/deploy-vps.sh
   ```

2. Make the script executable:
   ```bash
   chmod +x deploy-vps.sh
   ```

3. Run the script with sudo:
   ```bash
   sudo ./deploy-vps.sh
   ```

4. Follow the on-screen instructions to complete the setup.

### 3. Manual Deployment

If you prefer to set up the bot manually, follow these steps:

#### 3.1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

#### 3.2. Install Dependencies

```bash
sudo apt install -y curl git build-essential
```

#### 3.3. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify the installation:
```bash
node -v
npm -v
```

#### 3.4. Create a User for the Bot

```bash
sudo adduser --disabled-password --gecos "" solarbot
```

#### 3.5. Clone the Repository

```bash
cd /home/solarbot
sudo git clone https://github.com/arodrig125/solana-telegram-arb-bot.git
sudo chown -R solarbot:solarbot solana-telegram-arb-bot
```

#### 3.6. Install Bot Dependencies

```bash
sudo -u solarbot bash -c "cd /home/solarbot/solana-telegram-arb-bot && npm install"
```

#### 3.7. Configure the Bot

Create a `.env` file:
```bash
sudo -u solarbot bash -c "cd /home/solarbot/solana-telegram-arb-bot && cp .env.example .env"
```

Edit the `.env` file with your credentials:
```bash
sudo nano /home/solarbot/solana-telegram-arb-bot/.env
```

Add the following information:
```
# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Solana Wallet Configuration
PRIVATE_KEY=[your_wallet_private_key_array]

# Google Sheets Configuration (Optional)
SHEET_ID=your_google_sheet_id

# Bot Operation Mode
SIMULATION=true  # Set to false for live trading (Advanced and Professional plans only)

# RPC Endpoint (Optional)
RPC_ENDPOINT=https://api.mainnet-beta.solana.com
```

#### 3.8. Install PM2 for Process Management

```bash
sudo npm install -g pm2
```

#### 3.9. Start the Bot with PM2

```bash
sudo -u solarbot bash -c "cd /home/solarbot/solana-telegram-arb-bot && pm2 start server.js --name solarbot"
```

#### 3.10. Configure PM2 to Start on Boot

```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u solarbot --hp /home/solarbot
sudo -u solarbot bash -c "pm2 save"
```

## Post-Deployment Steps

### 1. Get Your Chat ID

1. Start a chat with your Telegram bot
2. Send any message to the bot
3. Send the command `/chatid` to your bot
4. The bot will respond with your Chat ID
5. Update your `.env` file with your Chat ID:
   ```bash
   sudo nano /home/solarbot/solana-telegram-arb-bot/.env
   ```
   Update the `TELEGRAM_CHAT_ID` value
6. Restart the bot:
   ```bash
   sudo -u solarbot bash -c "pm2 restart solarbot"
   ```

### 2. Monitor the Bot

You can monitor the bot using PM2:

```bash
# View logs
sudo -u solarbot bash -c "pm2 logs solarbot"

# Monitor process
sudo -u solarbot bash -c "pm2 monit"

# Restart the bot
sudo -u solarbot bash -c "pm2 restart solarbot"

# Stop the bot
sudo -u solarbot bash -c "pm2 stop solarbot"
```

### 3. Configure Bot Settings

You can customize the bot's behavior by editing the files in the `config` directory:

```bash
sudo nano /home/solarbot/solana-telegram-arb-bot/config/settings.js
sudo nano /home/solarbot/solana-telegram-arb-bot/config/tokens.js
```

After making changes, restart the bot:
```bash
sudo -u solarbot bash -c "pm2 restart solarbot"
```

## Troubleshooting

### Bot Not Starting

Check the logs for errors:
```bash
sudo -u solarbot bash -c "pm2 logs solarbot"
```

### Connection Issues

If the bot is having trouble connecting to the Solana network, try using a different RPC endpoint in your `.env` file.

### Telegram Bot Not Responding

1. Make sure your `TELEGRAM_BOT_TOKEN` is correct
2. Ensure your bot is not blocked or stopped
3. Check that your `TELEGRAM_CHAT_ID` is correct

### Out of Memory Errors

If you're experiencing out of memory errors, consider upgrading your VPS to a higher tier with more RAM.

## Security Recommendations

1. **Firewall**: Set up a firewall to restrict access to your VPS:
   ```bash
   sudo ufw allow ssh
   sudo ufw enable
   ```

2. **SSH Key Authentication**: Disable password authentication and use SSH keys only:
   ```bash
   sudo nano /etc/ssh/sshd_config
   ```
   Set `PasswordAuthentication no` and `PubkeyAuthentication yes`
   ```bash
   sudo systemctl restart sshd
   ```

3. **Regular Updates**: Keep your system updated:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. **Separate Wallet**: Use a dedicated wallet for the bot with only the necessary funds.

## Support

If you encounter any issues during deployment, please contact our support team:

- Email: support@solarbot.io
- Telegram: [SolarBot Community](https://t.me/solarbotcommunity)

Professional and Enterprise tier subscribers receive priority support and dedicated VPS setup assistance.
