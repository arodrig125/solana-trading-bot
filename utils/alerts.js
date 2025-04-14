const TelegramBot = require('node-telegram-bot-api');
const os = require('os');
const { setTimeout } = require('timers/promises');
require('dotenv').config();

// Escalation levels and timeouts
const ESCALATION_LEVELS = {
  LOW: {
    timeout: 30 * 60 * 1000, // 30 minutes
    retries: 1
  },
  MEDIUM: {
    timeout: 15 * 60 * 1000, // 15 minutes
    retries: 2
  },
  HIGH: {
    timeout: 5 * 60 * 1000, // 5 minutes
    retries: 3
  },
  CRITICAL: {
    timeout: 1 * 60 * 1000, // 1 minute
    retries: 5
  }
};

// Alert categories and their emojis
const ALERT_TYPES = {
  // System Alerts
  SYSTEM: '🖥️',
  MEMORY: '🧠',
  CPU: '⚙️',
  DISK: '💿',
  
  // Trading Alerts
  TRADING: '📊',
  ARBITRAGE: '💹',
  LIQUIDITY: '💧',
  SLIPPAGE: '📉',
  PROFIT: '💰',
  LOSS: '📛',
  
  // Market Alerts
  MARKET: '📈',
  VOLATILITY: '🌊',
  SPREAD: '↔️',
  VOLUME: '📊',
  PRICE: '💲',
  
  // Token Alerts
  TOKEN: '🪙',
  MINT: '🏭',
  BURN: '🔥',
  SUPPLY: '📦',
  
  // Wallet & Transaction Alerts
  WALLET: '👛',
  BALANCE: '💵',
  TRANSACTION: '🔄',
  GAS: '⛽',
  
  // DEX Alerts
  DEX: '🏦',
  POOL: '🌊',
  SWAP: '🔄',
  ROUTE: '🛣️',
  
  // Network Alerts
  NETWORK: '🌐',
  LATENCY: '⏱️',
  RPC: '🔌',
  BLOCK: '🧊',
  
  // Security Alerts
  SECURITY: '🔒',
  AUTH: '🔑',
  RISK: '⚠️',
  FRAUD: '🚨',
  
  // Performance Alerts
  PERFORMANCE: '⚡',
  SPEED: '🏃',
  QUEUE: '📋',
  CACHE: '📥',
  
  // Error & Status Alerts
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  SUCCESS: '✅'
};

class AlertManager {
  constructor() {
    // Initialize multiple notification channels
    this.notificationChannels = {
      primary: {
        chatId: process.env.ADMIN_CHAT_ID,
        active: true
      },
      backup: {
        chatId: process.env.BACKUP_ADMIN_CHAT_ID,
        active: true
      },
      emergency: {
        chatId: process.env.EMERGENCY_CHAT_ID,
        active: true
      }
    };

    // Track unacknowledged alerts
    this.pendingAlerts = new Map();
    this.escalationTimers = new Map();
    this.alertHistory = [];
    this.maxHistorySize = 100;
    this.alertCooldowns = new Map(); // Prevent alert spam
    this.defaultCooldown = 5 * 60 * 1000; // 5 minutes
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
    this.adminChatId = process.env.ADMIN_CHAT_ID;
    this.alertThresholds = {
      memoryUsagePercent: 85,
      cpuUsagePercent: 80,
      errorRatePerMinute: 5,
      tradeFailureRate: 0.2, // 20% failure rate
      profitThreshold: -0.05 // -5% profit change
    };
    
    this.errorCount = 0;
    this.lastErrorReset = Date.now();
    this.lastTradeStats = {
      success: 0,
      failure: 0
    };
  }

  async sendAlert(type, message, severity = 'warning', category = 'SYSTEM', escalationLevel = 'LOW') {
    const alertId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create alert object
    const alert = {
      id: alertId,
      type,
      message,
      severity,
      category,
      escalationLevel,
      createdAt: Date.now(),
      retryCount: 0,
      acknowledged: false
    };

    // Store alert in pending
    this.pendingAlerts.set(alertId, alert);

    // Start escalation process
    await this._startEscalation(alert);

    return alertId;
    // Check cooldown
    const cooldownKey = `${category}:${type}`;
    const lastAlert = this.alertCooldowns.get(cooldownKey);
    const now = Date.now();
    
    if (lastAlert && (now - lastAlert < this.defaultCooldown)) {
      return; // Skip if in cooldown
    }
    
    // Update cooldown
    this.alertCooldowns.set(cooldownKey, now);

    // Get category emoji
    const emoji = ALERT_TYPES[category] || '❗';
    if (!this.adminChatId) {
      console.error('Admin chat ID not configured for alerts');
      return;
    }

    const hostname = os.hostname();
    const timestamp = new Date().toISOString();
    const severityEmoji = this._getSeverityEmoji(severity);
    const categoryEmoji = ALERT_TYPES[category] || '❗';
    
    const formattedMessage = `
${categoryEmoji} ${severityEmoji} *ALERT: ${type}*
*Category:* ${category}
*Host:* ${hostname}
*Time:* ${timestamp}
*Severity:* ${severity}
*Details:* ${message}
    `.trim();



    // Store in history
    this.alertHistory.unshift({
      type,
      category,
      message,
      severity,
      timestamp: now
    });

    // Trim history if needed
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory.pop();
    }

    try {
      await this.bot.sendMessage(this.adminChatId, formattedMessage, {
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  async _startEscalation(alert) {
    const escalationConfig = ESCALATION_LEVELS[alert.escalationLevel];
    if (!escalationConfig) return;

    // Try primary channel first
    const sent = await this._sendToChannel('primary', alert);
    if (!sent) {
      // If primary fails, try backup immediately
      const backupSent = await this._sendToChannel('backup', alert);
      if (!backupSent && alert.escalationLevel === 'CRITICAL') {
        // For critical alerts, try emergency channel
        await this._sendToChannel('emergency', alert);
      }
    }

    // Set up escalation timer if alert wasn't acknowledged
    if (!this.pendingAlerts.get(alert.id)?.acknowledged) {
      this.escalationTimers.set(alert.id, setTimeout(escalationConfig.timeout, async () => {
        await this._escalateAlert(alert);
      }));
    }
  }

  async _escalateAlert(alert) {
    if (!this.pendingAlerts.has(alert.id) || this.pendingAlerts.get(alert.id).acknowledged) {
      return;
    }

    alert.retryCount++;
    const escalationConfig = ESCALATION_LEVELS[alert.escalationLevel];

    if (alert.retryCount >= escalationConfig.retries) {
      // Move to next escalation level
      switch (alert.escalationLevel) {
        case 'LOW':
          alert.escalationLevel = 'MEDIUM';
          break;
        case 'MEDIUM':
          alert.escalationLevel = 'HIGH';
          break;
        case 'HIGH':
          alert.escalationLevel = 'CRITICAL';
          break;
        default:
          // For CRITICAL, keep retrying emergency channel
          await this._sendToChannel('emergency', alert);
          return;
      }
      alert.retryCount = 0;
    }

    // Update alert in pending
    this.pendingAlerts.set(alert.id, alert);

    // Start new escalation process
    await this._startEscalation(alert);
  }

  async _sendToChannel(channel, alert) {
    if (!this.notificationChannels[channel].active) return false;

    const chatId = this.notificationChannels[channel].chatId;
    if (!chatId) return false;

    try {
      const message = this._formatAlertMessage(alert, channel);
      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            {
              text: '✅ Acknowledge',
              callback_data: `ack:${alert.id}`
            }
          ]]
        }
      });
      return true;
    } catch (error) {
      console.error(`Failed to send alert to ${channel} channel:`, error);
      return false;
    }
  }

  _formatAlertMessage(alert, channel) {
    const hostname = os.hostname();
    const timestamp = new Date().toISOString();
    const severityEmoji = this._getSeverityEmoji(alert.severity);
    const categoryEmoji = ALERT_TYPES[alert.category] || '❗';
    
    return `
${categoryEmoji} ${severityEmoji} *ALERT: ${alert.type}*
*ID:* ${alert.id}
*Category:* ${alert.category}
*Channel:* ${channel.toUpperCase()}
*Host:* ${hostname}
*Time:* ${timestamp}
*Severity:* ${alert.severity}
*Escalation:* ${alert.escalationLevel}
*Details:* ${alert.message}
    `.trim();
  }

  async acknowledgeAlert(alertId) {
    const alert = this.pendingAlerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    this.pendingAlerts.set(alertId, alert);

    // Clear escalation timer
    const timer = this.escalationTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(alertId);
    }

    // Move to alert history
    this.alertHistory.unshift(alert);
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory.pop();
    }

    // Remove from pending
    this.pendingAlerts.delete(alertId);

    return true;
  }

  _getSeverityEmoji(severity) {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❗';
    }
  }

  async getAlertHistory(category = null, limit = 10) {
    return this.alertHistory
      .filter(alert => !category || alert.category === category)
      .slice(0, limit);
  }

  async checkSystemMetrics() {
    // Check disk usage
    const { available, total } = await this._getDiskSpace();
    const diskUsage = ((total - available) / total) * 100;
    if (diskUsage > this.alertThresholds.diskUsagePercent) {
      await this.sendAlert(
        'High Disk Usage',
        `Disk usage at ${diskUsage.toFixed(2)}%`,
        'warning',
        'SYSTEM'
      );
    }

    // Check system load
    const loadAvg = os.loadavg()[0];
    if (loadAvg > this.alertThresholds.highLoadAvg) {
      await this.sendAlert(
        'High System Load',
        `Load average at ${loadAvg.toFixed(2)}`,
        'warning',
        'SYSTEM'
      );
    }

    // Check memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

    if (memoryUsage > this.alertThresholds.memoryUsagePercent) {
      await this.sendAlert(
        'High Memory Usage',
        `Memory usage at ${memoryUsage.toFixed(2)}%`,
        'critical'
      );
    }

    // Check CPU usage
    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    if (cpuUsage > this.alertThresholds.cpuUsagePercent) {
      await this.sendAlert(
        'High CPU Usage',
        `CPU usage at ${cpuUsage.toFixed(2)}%`,
        'critical'
      );
    }
  }

  async trackError(error) {
    this.errorCount++;
    
    // Reset error count every minute
    const now = Date.now();
    if (now - this.lastErrorReset >= 60000) {
      const errorRate = this.errorCount;
      if (errorRate >= this.alertThresholds.errorRatePerMinute) {
        await this.sendAlert(
          'High Error Rate',
          `${errorRate} errors in the last minute`,
          'critical'
        );
      }
      this.errorCount = 0;
      this.lastErrorReset = now;
    }

    // Always alert for critical errors
    if (error.critical) {
      await this.sendAlert(
        'Critical Error',
        error.message,
        'critical'
      );
    }
  }

  async _getDiskSpace() {
    return new Promise((resolve) => {
      require('child_process').exec('df -k /', (error, stdout) => {
        if (error) {
          resolve({ available: 0, total: 0 });
          return;
        }
        const lines = stdout.trim().split('\n');
        const stats = lines[1].split(/\s+/);
        resolve({
          available: parseInt(stats[3]) * 1024,
          total: parseInt(stats[1]) * 1024
        });
      });
    });
  }

  async checkNetworkHealth() {
    try {
      const startTime = Date.now();
      await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth'
        })
      });
      const latency = Date.now() - startTime;

      if (latency > this.alertThresholds.networkLatencyMs) {
        await this.sendAlert(
          'High Network Latency',
          `Solana API latency: ${latency}ms`,
          'warning',
          'NETWORK'
        );
      }
    } catch (error) {
      await this.sendAlert(
        'Network Connection Issue',
        `Failed to connect to Solana API: ${error.message}`,
        'critical',
        'NETWORK'
      );
    }
  }

  async checkWalletHealth(connection, wallet) {
    try {
      const balance = await connection.getBalance(wallet.publicKey);
      const solBalance = balance / 1e9; // Convert to SOL

      if (solBalance < this.alertThresholds.walletBalanceLow) {
        await this.sendAlert(
          'Low Wallet Balance',
          `Wallet balance: ${solBalance.toFixed(3)} SOL`,
          'critical',
          'WALLET'
        );
      }
    } catch (error) {
      await this.sendAlert(
        'Wallet Check Failed',
        `Failed to check wallet balance: ${error.message}`,
        'warning',
        'WALLET'
      );
    }
  }

  async trackTrade(success, profitChange = null, metrics = {}) {
    const {
      slippage = 0,
      executionTime = 0,
      gasUsed = 0
    } = metrics;

    if (success) {
      this.lastTradeStats.success++;
      
      // Check for high slippage
      if (slippage > this.alertThresholds.slippagePercent) {
        await this.sendAlert(
          'High Trade Slippage',
          `Slippage: ${slippage.toFixed(2)}%`,
          'warning',
          'TRADING'
        );
      }

      // Check execution time
      if (executionTime > this.alertThresholds.apiLatencyMs) {
        await this.sendAlert(
          'Slow Trade Execution',
          `Execution time: ${executionTime}ms`,
          'warning',
          'PERFORMANCE'
        );
      }
    } else {
      this.lastTradeStats.failure++;
    }

    const totalTrades = this.lastTradeStats.success + this.lastTradeStats.failure;
    if (totalTrades >= 10) { // Check after every 10 trades
      const failureRate = this.lastTradeStats.failure / totalTrades;
      
      if (failureRate > this.alertThresholds.tradeFailureRate) {
        await this.sendAlert(
          'High Trade Failure Rate',
          `Failure rate at ${(failureRate * 100).toFixed(2)}% over last ${totalTrades} trades`,
          'critical'
        );
      }

      // Reset stats
      this.lastTradeStats.success = 0;
      this.lastTradeStats.failure = 0;
    }

    // Check profit threshold
    if (profitChange !== null && profitChange < this.alertThresholds.profitThreshold) {
      await this.sendAlert(
        'Significant Profit Drop',
        `Profit change of ${(profitChange * 100).toFixed(2)}% detected`,
        'warning'
      );
    }
  }

  setAlertThresholds(newThresholds) {
    this.alertThresholds = {
      ...this.alertThresholds,
      ...newThresholds
    };
  }
}

module.exports = new AlertManager();
