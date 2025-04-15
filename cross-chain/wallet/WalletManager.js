const { web3 } = require('@project-serum/anchor');
const { Connection } = require('@solana/web3.js');
const { ethers } = require('ethers');
const logger = require('../../utils/logger');
const { encrypt, decrypt } = require('../../utils/encryption');

class WalletManager {
    constructor() {
        this.wallets = new Map();
        this.providers = new Map();
        this.balances = new Map();
        this.pendingTransactions = new Map();
        this.healthChecks = new Map();
    }

    // Initialize wallet for a specific chain
    async initializeWallet(chain, privateKey, config = {}) {
        try {
            let wallet;
            let provider;

            switch (chain) {
                case 'solana':
                    const connection = new Connection(config.rpcUrl || 'https://api.mainnet-beta.solana.com');
                    wallet = web3.Keypair.fromSecretKey(
                        Buffer.from(privateKey, 'hex')
                    );
                    provider = connection;
                    break;

                case 'ethereum':
                case 'bsc':
                case 'polygon':
                case 'avalanche':
                    provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
                    wallet = new ethers.Wallet(privateKey, provider);
                    break;

                default:
                    throw new Error(`Unsupported chain: ${chain}`);
            }

            // Store encrypted private key
            const encryptedKey = await encrypt(privateKey);
            this.wallets.set(chain, {
                wallet,
                encryptedKey,
                lastActivity: Date.now(),
                status: 'active'
            });

            this.providers.set(chain, provider);
            
            // Start health check for this wallet
            this.startWalletHealthCheck(chain);
            
            logger.info(`Wallet initialized for ${chain}`);
            return wallet;

        } catch (error) {
            logger.error(`Failed to initialize wallet for ${chain}: ${error.message}`);
            throw error;
        }
    }

    // Get wallet for a specific chain
    async getWallet(chain) {
        const walletInfo = this.wallets.get(chain);
        if (!walletInfo) {
            throw new Error(`No wallet found for chain: ${chain}`);
        }

        // Check wallet health
        if (walletInfo.status !== 'active') {
            await this.recoverWallet(chain);
        }

        return walletInfo.wallet;
    }

    // Start periodic health check for a wallet
    startWalletHealthCheck(chain) {
        const healthCheck = setInterval(async () => {
            try {
                const walletInfo = this.wallets.get(chain);
                if (!walletInfo) return;

                // Check if wallet is responsive
                const isHealthy = await this.checkWalletHealth(chain);
                
                if (!isHealthy) {
                    walletInfo.status = 'unhealthy';
                    await this.recoverWallet(chain);
                }

                // Update balances
                await this.updateBalances(chain);

                // Clean up old pending transactions
                await this.cleanupPendingTransactions(chain);

            } catch (error) {
                logger.error(`Health check failed for ${chain}: ${error.message}`);
            }
        }, 60000); // Check every minute

        this.healthChecks.set(chain, healthCheck);
    }

    // Check wallet health
    async checkWalletHealth(chain) {
        try {
            const wallet = await this.getWallet(chain);
            const provider = this.providers.get(chain);

            switch (chain) {
                case 'solana':
                    const solBalance = await provider.getBalance(wallet.publicKey);
                    return solBalance !== undefined;

                case 'ethereum':
                case 'bsc':
                case 'polygon':
                case 'avalanche':
                    const ethBalance = await wallet.getBalance();
                    return ethBalance !== undefined;

                default:
                    return false;
            }
        } catch (error) {
            logger.error(`Health check failed for ${chain}: ${error.message}`);
            return false;
        }
    }

    // Update balances for a chain
    async updateBalances(chain) {
        try {
            const wallet = await this.getWallet(chain);
            const provider = this.providers.get(chain);
            let balance;

            switch (chain) {
                case 'solana':
                    balance = await provider.getBalance(wallet.publicKey);
                    break;

                case 'ethereum':
                case 'bsc':
                case 'polygon':
                case 'avalanche':
                    balance = await wallet.getBalance();
                    break;
            }

            this.balances.set(chain, {
                amount: balance.toString(),
                timestamp: Date.now()
            });

        } catch (error) {
            logger.error(`Failed to update balance for ${chain}: ${error.message}`);
        }
    }

    // Track a pending transaction
    async trackTransaction(chain, txHash, details) {
        const chainTxs = this.pendingTransactions.get(chain) || new Map();
        chainTxs.set(txHash, {
            ...details,
            timestamp: Date.now(),
            status: 'pending',
            retries: 0
        });
        this.pendingTransactions.set(chain, chainTxs);

        // Start monitoring this transaction
        this.monitorTransaction(chain, txHash);
    }

    // Monitor a specific transaction
    async monitorTransaction(chain, txHash) {
        const provider = this.providers.get(chain);
        const chainTxs = this.pendingTransactions.get(chain);
        const txInfo = chainTxs.get(txHash);

        try {
            let receipt;
            switch (chain) {
                case 'solana':
                    receipt = await provider.confirmTransaction(txHash);
                    break;

                case 'ethereum':
                case 'bsc':
                case 'polygon':
                case 'avalanche':
                    receipt = await provider.waitForTransaction(txHash);
                    break;
            }

            if (receipt && receipt.status === 1) {
                txInfo.status = 'confirmed';
                logger.info(`Transaction ${txHash} confirmed on ${chain}`);
            } else {
                txInfo.status = 'failed';
                await this.handleFailedTransaction(chain, txHash, txInfo);
            }

        } catch (error) {
            logger.error(`Transaction monitoring failed for ${txHash}: ${error.message}`);
            txInfo.status = 'error';
            await this.handleFailedTransaction(chain, txHash, txInfo);
        }

        chainTxs.set(txHash, txInfo);
    }

    // Handle failed transactions
    async handleFailedTransaction(chain, txHash, txInfo) {
        if (txInfo.retries >= 3) {
            logger.error(`Transaction ${txHash} failed permanently after ${txInfo.retries} retries`);
            return;
        }

        try {
            // Attempt to speed up transaction if possible
            switch (chain) {
                case 'ethereum':
                case 'bsc':
                case 'polygon':
                case 'avalanche':
                    const wallet = await this.getWallet(chain);
                    const newGasPrice = txInfo.gasPrice * 1.2; // Increase gas price by 20%
                    
                    // Replace transaction with higher gas price
                    const newTx = await wallet.sendTransaction({
                        to: txInfo.to,
                        value: txInfo.value,
                        nonce: txInfo.nonce,
                        gasPrice: newGasPrice
                    });

                    logger.info(`Replaced transaction ${txHash} with ${newTx.hash}`);
                    
                    // Track new transaction
                    await this.trackTransaction(chain, newTx.hash, {
                        ...txInfo,
                        gasPrice: newGasPrice,
                        retries: txInfo.retries + 1
                    });
                    break;

                case 'solana':
                    // Implement Solana-specific retry logic
                    break;
            }
        } catch (error) {
            logger.error(`Failed to handle failed transaction ${txHash}: ${error.message}`);
        }
    }

    // Clean up old pending transactions
    async cleanupPendingTransactions(chain) {
        const chainTxs = this.pendingTransactions.get(chain);
        if (!chainTxs) return;

        const now = Date.now();
        for (const [txHash, txInfo] of chainTxs.entries()) {
            // Remove confirmed transactions after 1 hour
            if (txInfo.status === 'confirmed' && now - txInfo.timestamp > 3600000) {
                chainTxs.delete(txHash);
            }
            // Remove failed transactions after 24 hours
            if (txInfo.status === 'failed' && now - txInfo.timestamp > 86400000) {
                chainTxs.delete(txHash);
            }
        }
    }

    // Recover a wallet
    async recoverWallet(chain) {
        try {
            const walletInfo = this.wallets.get(chain);
            if (!walletInfo) {
                throw new Error(`No wallet found for chain: ${chain}`);
            }

            // Decrypt private key
            const privateKey = await decrypt(walletInfo.encryptedKey);
            
            // Re-initialize wallet
            await this.initializeWallet(chain, privateKey);
            
            logger.info(`Successfully recovered wallet for ${chain}`);
        } catch (error) {
            logger.error(`Failed to recover wallet for ${chain}: ${error.message}`);
            throw error;
        }
    }

    // Get all balances
    async getAllBalances() {
        const balances = {};
        for (const [chain, balance] of this.balances.entries()) {
            balances[chain] = balance;
        }
        return balances;
    }

    // Get pending transactions
    getPendingTransactions(chain) {
        const chainTxs = this.pendingTransactions.get(chain);
        return chainTxs ? Array.from(chainTxs.values()) : [];
    }

    // Clean up resources
    cleanup() {
        for (const [chain, interval] of this.healthChecks.entries()) {
            clearInterval(interval);
        }
    }
}

module.exports = WalletManager;
