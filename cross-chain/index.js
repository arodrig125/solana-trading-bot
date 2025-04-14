const { ArbitrageExecutor } = require('./arbitrageExecutor');

async function main() {
    try {
        const executor = new ArbitrageExecutor();
        await executor.start();
        console.log('Cross-chain arbitrage system started successfully');
    } catch (error) {
        console.error('Failed to start cross-chain arbitrage system:', error);
        process.exit(1);
    }
}

main();
