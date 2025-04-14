const { Connection } = require('@solana/web3.js');
const { ethers } = require('ethers');
const { BscConnection } = require('@binance-chain/bsc-connector');
const { TOKEN_CONFIG } = require('./tokenConfig');
const { ExchangeManager } = require('./exchanges');

// Price monitoring configuration
const MONITOR_CONFIG = {
    refreshInterval: 30000, // 30 seconds
    chains: {
        solana: {
            exchanges: ['serum', 'raydium'],
            tokens: Object.keys(TOKEN_CONFIG.solana)
        },
        ethereum: {
            exchanges: ['uniswap', 'sushiswap'],
            tokens: Object.keys(TOKEN_CONFIG.ethereum)
        },
        bsc: {
            exchanges: ['pancakeswap'],
            tokens: Object.keys(TOKEN_CONFIG.bsc)
        }
    },
    priceAggregation: {
        method: 'weightedAverage', // or 'median'
        weightByVolume: true
    }
};

class PriceMonitor {
    constructor() {
        this.prices = {
            solana: {},
            ethereum: {},
            bsc: {}
        };
        this.lastUpdate = {};
    }

    async updatePrices() {
        await Promise.all([
            this.updateSolanaPrices(),
            this.updateEthereumPrices(),
            this.updateBSCPrices()
        ]);
    }

    async updateSolanaPrices() {
        const tokens = MONITOR_CONFIG.chains.solana.tokens;
        const exchanges = MONITOR_CONFIG.chains.solana.exchanges;
        
        for (const token of tokens) {
            const prices = await Promise.all(
                exchanges.map(exchange => this.getSolanaPrice(token, exchange))
            );
            
            const aggregatedPrice = this.aggregatePrices(prices);
            this.prices.solana[token] = aggregatedPrice;
            this.lastUpdate[token] = Date.now();
        }
    }

    async updateEthereumPrices() {
        const tokens = MONITOR_CONFIG.chains.ethereum.tokens;
        const exchanges = MONITOR_CONFIG.chains.ethereum.exchanges;
        
        for (const token of tokens) {
            const prices = await Promise.all(
                exchanges.map(exchange => this.getEthereumPrice(token, exchange))
            );
            
            const aggregatedPrice = this.aggregatePrices(prices);
            this.prices.ethereum[token] = aggregatedPrice;
            this.lastUpdate[token] = Date.now();
        }
    }

    async updateBSCPrices() {
        const tokens = MONITOR_CONFIG.chains.bsc.tokens;
        const exchanges = MONITOR_CONFIG.chains.bsc.exchanges;
        
        for (const token of tokens) {
            const prices = await Promise.all(
                exchanges.map(exchange => this.getBSCPrice(token, exchange))
            );
            
            const aggregatedPrice = this.aggregatePrices(prices);
            this.prices.bsc[token] = aggregatedPrice;
            this.lastUpdate[token] = Date.now();
        }
    }

    async getSolanaPrice(token, exchange) {
        const exchangeManager = new ExchangeManager();
        return exchangeManager.getSolanaPrice(token, exchange);
    }

    async getEthereumPrice(token, exchange) {
        const exchangeManager = new ExchangeManager();
        return exchangeManager.getEthereumPrice(token, exchange);
    }

    async getBSCPrice(token, exchange) {
        const exchangeManager = new ExchangeManager();
        return exchangeManager.getBSCPrice(token, exchange);
    }

    aggregatePrices(prices) {
        // Filter out null prices
        const validPrices = prices.filter(price => price !== null);
        
        if (validPrices.length === 0) return null;

        // Calculate weighted average
        const sum = validPrices.reduce((acc, price) => acc + price, 0);
        return sum / validPrices.length;
    }

    getArbitrageOpportunities() {
        const opportunities = [];
        
        // Check Solana ↔ Ethereum opportunities
        for (const token of MONITOR_CONFIG.chains.solana.tokens) {
            if (this.prices.solana[token] && this.prices.ethereum[token]) {
                const priceDiff = Math.abs(this.prices.solana[token] - this.prices.ethereum[token]);
                if (priceDiff > 0.01) { // 1% price difference
                    opportunities.push({
                        token,
                        from: 'solana',
                        to: 'ethereum',
                        priceDiff,
                        solanaPrice: this.prices.solana[token],
                        ethereumPrice: this.prices.ethereum[token]
                    });
                }
            }
        }

        // Check Solana ↔ BSC opportunities
        for (const token of MONITOR_CONFIG.chains.solana.tokens) {
            if (this.prices.solana[token] && this.prices.bsc[token]) {
                const priceDiff = Math.abs(this.prices.solana[token] - this.prices.bsc[token]);
                if (priceDiff > 0.01) { // 1% price difference
                    opportunities.push({
                        token,
                        from: 'solana',
                        to: 'bsc',
                        priceDiff,
                        solanaPrice: this.prices.solana[token],
                        bscPrice: this.prices.bsc[token]
                    });
                }
            }
        }

        return opportunities;
    }
}

module.exports = PriceMonitor;
