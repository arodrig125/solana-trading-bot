const TOKEN_CONFIG = {
    solana: {
        SOL: {
            mint: 'So11111111111111111111111111111111111111112',
            decimals: 9
        },
        USDC: {
            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            decimals: 6
        },
        USDT: {
            mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
            decimals: 6
        },
        USDT: {
            mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
            decimals: 6
        },
        BTC: {
            mint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
            decimals: 6
        },
        ETH: {
            mint: '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk',
            decimals: 6
        }
    },
    ethereum: {
        ETH: {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18
        },
        USDC: {
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            decimals: 6
        },
        USDT: {
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            decimals: 6
        },
        WBTC: {
            address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            decimals: 8
        },
        WETH: {
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            decimals: 18
        }
    },
    bsc: {
        BNB: {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18
        },
        USDC: {
            address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
            decimals: 6
        },
        USDT: {
            address: '0x55d398326f99059fF775485246999027B3197955',
            decimals: 6
        },
        BTCB: {
            address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
            decimals: 8
        },
        WBNB: {
            address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
            decimals: 18
        }
    },
    polygon: {
        MATIC: {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18
        },
        USDC: {
            address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
            decimals: 6
        },
        USDT: {
            address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
            decimals: 6
        },
        WETH: {
            address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
            decimals: 18
        }
    },
    avalanche: {
        AVAX: {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18
        },
        USDC: {
            address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
            decimals: 6
        },
        USDT: {
            address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
            decimals: 6
        },
        WAVAX: {
            address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
            decimals: 18
        }
    },
    fantom: {
        FTM: {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18
        },
        USDC: {
            address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
            decimals: 6
        },
        USDT: {
            address: '0x049d68029688eAbF473097a2fC38ef61633A3C7A',
            decimals: 6
        },
        WFTM: {
            address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
            decimals: 18
        }
    },
    arbitrum: {
        ETH: {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18
        },
        USDC: {
            address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
            decimals: 6
        },
        USDT: {
            address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            decimals: 6
        },
        WETH: {
            address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            decimals: 18
        }
    },
    optimism: {
        ETH: {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18
        },
        USDC: {
            address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
            decimals: 6
        },
        USDT: {
            address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
            decimals: 6
        },
        WETH: {
            address: '0x4200000000000000000000000000000000000006',
            decimals: 18
        }
    },
    cronos: {
        CRO: {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18
        },
        USDC: {
            address: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
            decimals: 6
        },
        USDT: {
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            decimals: 6
        },
        WCRO: {
            address: '0x593C9eB45015f73dfCc4C02805e7C40252D57531',
            decimals: 18
        }
    },
    harmony: {
        ONE: {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18
        },
        USDC: {
            address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            decimals: 6
        },
        USDT: {
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            decimals: 6
        },
        WONE: {
            address: '0x4200000000000000000000000000000000000006',
            decimals: 18
        }
    },
    klaytn: {
        KLAY: {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18
        },
        USDC: {
            address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            decimals: 6
        },
        USDT: {
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            decimals: 6
        },
        WKLAY: {
            address: '0x4200000000000000000000000000000000000006',
            decimals: 18
        }
    },
    celo: {
        CELO: {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18
        },
        cUSD: {
            address: '0x765De81FbE2fdCE8dA8c89a142fAa5591D96a9eD',
            decimals: 18
        },
        cEUR: {
            address: '0xD8763CBa5260Ee6d4BfA807010197c1686492016',
            decimals: 18
        }
    },
    boba: {
        ETH: {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18
        },
        USDC: {
            address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            decimals: 6
        },
        USDT: {
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            decimals: 6
        }
    },
    metis: {
        ETH: {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18
        },
        USDC: {
            address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            decimals: 6
        },
        USDT: {
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            decimals: 6
        }
    },
    aurora: {
        ETH: {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18
        },
        USDC: {
            address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            decimals: 6
        },
        USDT: {
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            decimals: 6
        }
    }
};

module.exports = TOKEN_CONFIG;
