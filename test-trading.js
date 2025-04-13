const { initJupiterClient, getSolanaConnection, executeTrade } = require('./utils/jupiter');
const { initWallet, getWalletBalance, getTokenBalance } = require('./utils/wallet');
const logger = require('./utils/logger');
const { TOKENS } = require('./config/tokens');
require('dotenv').config();

async function testTrade() {
    try {
        // Initialize components
        const jupiterClient = await initJupiterClient();
        const connection = getSolanaConnection();
        const wallet = initWallet(process.env.PRIVATE_KEY);

        if (!wallet) {
            throw new Error('Wallet initialization failed. Check your PRIVATE_KEY in .env');
        }

        // Check wallet balances
        const { sol } = await getWalletBalance(connection, wallet);
        logger.info('Current wallet balances:');
        logger.info(`SOL: ${sol.toFixed(6)} SOL`);

        // Check USDC balance
        const usdcToken = Object.values(TOKENS).find(t => t.symbol === 'USDC');
        if (usdcToken) {
            const usdcCheck = await getTokenBalance(connection, wallet, usdcToken.mint);
            logger.info(`USDC: ${usdcCheck.balance} USDC`);
        }

        // Create a test opportunity (USDC -> SOL -> USDC)
        const testOpportunity = {
            type: 'triangular',
            path: [
                {
                    from: 'USDC',
                    to: 'SOL',
                    fromAmount: '10000000' // 10 USDC (6 decimals)
                },
                {
                    from: 'SOL',
                    to: 'USDC'
                }
            ],
            startAmount: '10000000', // 10 USDC
            startToken: 'USDC',
            endToken: 'USDC',
            profitAmount: '0.1',
            profitPercent: 1.0
        };

        // Test in simulation mode first
        logger.info('\n🔄 Testing trade validation and simulation...');
        const simResult = await executeTrade(jupiterClient, connection, wallet, testOpportunity, true);
        
        // Display validation results
        if (simResult.validationChecks) {
            logger.info('\n📋 Validation Results:');
            for (const check of simResult.validationChecks.checks || []) {
                const icon = check.passed ? '✅' : '❌';
                logger.info(`${icon} ${check.name}: ${check.message}`);
            }
        }

        if (!simResult.success) {
            logger.error(`\n❌ Simulation failed: ${simResult.error}`);
            return;
        }

        logger.info('\n✅ Simulation successful, proceeding with live trade test...');
        
        // Modify opportunity for minimal live test
        const liveTestOpportunity = {
            ...testOpportunity,
            path: testOpportunity.path.map(step => ({
                ...step,
                fromAmount: step.fromAmount ? '100000' : undefined // 0.1 USDC
            })),
            startAmount: '100000' // 0.1 USDC
        };

        const liveResult = await executeTrade(jupiterClient, connection, wallet, liveTestOpportunity, false);
        
        // Display live trade validation and results
        logger.info('\n📊 Trade Validation:');
        if (liveResult.validationChecks) {
            for (const check of liveResult.validationChecks.checks || []) {
                const icon = check.passed ? '✅' : '❌';
                logger.info(`${icon} ${check.name}: ${check.message}`);
            }
        }

        if (liveResult.balanceCheck) {
            logger.info('\n💰 Balance Check Results:');
            // SOL Balance Check
            if (liveResult.balanceCheck.sol) {
                const { balance, required, isEnough } = liveResult.balanceCheck.sol;
                logger.info(`${isEnough ? '✅' : '❌'} SOL Balance:`);
                logger.info(`  Current: ${balance.toFixed(6)} SOL`);
                logger.info(`  Required: ${required} SOL`);
            }

            // Token Balance Check
            if (liveResult.balanceCheck.token) {
                const { symbol, balance, required, isEnough } = liveResult.balanceCheck.token;
                logger.info(`\n${isEnough ? '✅' : '❌'} ${symbol} Balance:`);
                logger.info(`  Current: ${balance}`);
                logger.info(`  Required: ${required}`);
            }

            // Risk Management
            if (liveResult.balanceCheck.riskManagement) {
                const { passed, details } = liveResult.balanceCheck.riskManagement;
                logger.info(`\n${passed ? '✅' : '⚠️'} Risk Management:`);
                logger.info(`  ${details}`);
            }
        }

        logger.info('\n📝 Trade Result:', JSON.stringify(liveResult.trades || liveResult.error, null, 2));

    } catch (error) {
        logger.error('Test failed:', error);
    }
}

// Run the test
testTrade().then(() => {
    logger.info('Test completed');
    process.exit(0);
}).catch(error => {
    logger.error('Test failed:', error);
    process.exit(1);
});
