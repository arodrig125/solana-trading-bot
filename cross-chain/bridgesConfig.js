const BRIDGE_CONFIG = {
    wormhole: {
        solana: {
            programId: '2ZnJgqYXq6e4mJZk35p9RqUv9zQKqZ25p4kA3X9s9X9K',
            tokenBridge: 'TokenBridge1111111111111111111111111111111111111111111111111111111111111111',
            supportedChains: ['ethereum', 'bsc', 'polygon', 'avalanche', 'fantom', 'cronos']
        },
        ethereum: {
            contractAddress: '0x123...456', // Replace with actual Wormhole contract address
            supportedChains: ['solana', 'bsc', 'polygon', 'avalanche', 'fantom', 'cronos']
        },
        bsc: {
            contractAddress: '0x123...456', // Replace with actual Wormhole contract address
            supportedChains: ['solana', 'ethereum', 'polygon', 'avalanche', 'fantom', 'cronos']
        }
    },
    multichain: {
        solana: {
            routerAddress: '0x123...456', // Replace with actual Multichain router address
            supportedChains: ['ethereum', 'bsc', 'polygon', 'avalanche', 'fantom', 'cronos', 'harmony', 'klaytn']
        },
        ethereum: {
            routerAddress: '0x123...456', // Replace with actual Multichain router address
            supportedChains: ['solana', 'bsc', 'polygon', 'avalanche', 'fantom', 'cronos', 'harmony', 'klaytn']
        },
        bsc: {
            routerAddress: '0x123...456', // Replace with actual Multichain router address
            supportedChains: ['solana', 'ethereum', 'polygon', 'avalanche', 'fantom', 'cronos', 'harmony', 'klaytn']
        }
    },
    anyswap: {
        solana: {
            routerAddress: '0x123...456', // Replace with actual Anyswap router address
            supportedChains: ['ethereum', 'bsc', 'polygon', 'avalanche', 'fantom', 'cronos', 'harmony', 'klaytn']
        },
        ethereum: {
            routerAddress: '0x123...456', // Replace with actual Anyswap router address
            supportedChains: ['solana', 'bsc', 'polygon', 'avalanche', 'fantom', 'cronos', 'harmony', 'klaytn']
        },
        bsc: {
            routerAddress: '0x123...456', // Replace with actual Anyswap router address
            supportedChains: ['solana', 'ethereum', 'polygon', 'avalanche', 'fantom', 'cronos', 'harmony', 'klaytn']
        }
    },
    axelar: {
        solana: {
            gatewayAddress: '0x123...456', // Replace with actual Axelar gateway address
            supportedChains: ['ethereum', 'bsc', 'polygon', 'avalanche', 'fantom', 'cronos', 'harmony', 'klaytn', 'celo', 'boba', 'metis', 'aurora']
        },
        ethereum: {
            gatewayAddress: '0x123...456', // Replace with actual Axelar gateway address
            supportedChains: ['solana', 'bsc', 'polygon', 'avalanche', 'fantom', 'cronos', 'harmony', 'klaytn', 'celo', 'boba', 'metis', 'aurora']
        },
        bsc: {
            gatewayAddress: '0x123...456', // Replace with actual Axelar gateway address
            supportedChains: ['solana', 'ethereum', 'polygon', 'avalanche', 'fantom', 'cronos', 'harmony', 'klaytn', 'celo', 'boba', 'metis', 'aurora']
        },
        celo: {
            gatewayAddress: '0x123...456', // Replace with actual Axelar gateway address
            supportedChains: ['solana', 'ethereum', 'bsc', 'polygon', 'avalanche', 'fantom', 'cronos', 'harmony', 'klaytn', 'boba', 'metis', 'aurora']
        },
        boba: {
            gatewayAddress: '0x123...456', // Replace with actual Axelar gateway address
            supportedChains: ['solana', 'ethereum', 'bsc', 'polygon', 'avalanche', 'fantom', 'cronos', 'harmony', 'klaytn', 'celo', 'metis', 'aurora']
        },
        metis: {
            gatewayAddress: '0x123...456', // Replace with actual Axelar gateway address
            supportedChains: ['solana', 'ethereum', 'bsc', 'polygon', 'avalanche', 'fantom', 'cronos', 'harmony', 'klaytn', 'celo', 'boba', 'aurora']
        },
        aurora: {
            gatewayAddress: '0x123...456', // Replace with actual Axelar gateway address
            supportedChains: ['solana', 'ethereum', 'bsc', 'polygon', 'avalanche', 'fantom', 'cronos', 'harmony', 'klaytn', 'celo', 'boba', 'metis']
        }
    }
};

// Bridge fee configuration
const BRIDGE_FEE_CONFIG = {
    wormhole: {
        baseFee: {
            solana: 0.0004, // SOL
            ethereum: 0.0005, // ETH
            bsc: 0.0003, // BNB
            polygon: 0.0002, // MATIC
            avalanche: 0.0004, // AVAX
            fantom: 0.0003, // FTM
            cronos: 0.0002, // CRO
            harmony: 0.0002, // ONE
            klaytn: 0.0003 // KLAY
        },
        tokenSpecificFees: {
            USDC: 0.0001,
            USDT: 0.0001,
            ETH: 0.0005,
            BTC: 0.0006
        }
    },
    multichain: {
        baseFee: {
            solana: 0.0003,
            ethereum: 0.0004,
            bsc: 0.0002,
            polygon: 0.0001,
            avalanche: 0.0003,
            fantom: 0.0002,
            cronos: 0.0001,
            harmony: 0.0001,
            klaytn: 0.0002
        }
    },
    anyswap: {
        baseFee: {
            solana: 0.0002,
            ethereum: 0.0003,
            bsc: 0.0001,
            polygon: 0.0001,
            avalanche: 0.0002,
            fantom: 0.0001,
            cronos: 0.0001,
            harmony: 0.0001,
            klaytn: 0.0001
        }
    },
    axelar: {
        baseFee: {
            solana: 0.0003,
            ethereum: 0.0004,
            bsc: 0.0002,
            polygon: 0.0001,
            avalanche: 0.0003,
            fantom: 0.0002,
            cronos: 0.0001,
            harmony: 0.0001,
            klaytn: 0.0002
        }
    }
};

module.exports = {
    BRIDGE_CONFIG,
    BRIDGE_FEE_CONFIG
};
