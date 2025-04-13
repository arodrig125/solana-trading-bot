const { TOKENS, TOKEN_PAIRS, TRIANGULAR_PATHS, WHITELISTED_TOKENS, BLACKLISTED_TOKENS } = require('../config/tokens');
const logger = require('./logger');

// Detailed validation result builder
function buildValidationResult(isValid, reason = null, details = {}) {
    return {
        isValid,
        reason,
        details,
        timestamp: new Date().toISOString(),
        severity: isValid ? 'success' : (details.severity || 'error')
    };
}

// Validate token pair for trading
function validateTokenPair(fromToken, toToken) {
    const details = {
        fromToken: fromToken?.symbol || 'unknown',
        toToken: toToken?.symbol || 'unknown',
        checks: []
    };
    // Check if tokens exist
    if (!fromToken || !toToken) {
        details.checks.push({
            name: 'token_existence',
            passed: false,
            message: `Missing token(s): ${!fromToken ? 'from' : ''} ${!toToken ? 'to' : ''}`.trim()
        });
        return buildValidationResult(false, 'Invalid token pair: One or both tokens do not exist', {
            ...details,
            severity: 'error'
        });
    }
    details.checks.push({
        name: 'token_existence',
        passed: true,
        message: 'Both tokens exist'
    });

    // Check if tokens are the same
    if (fromToken.mint === toToken.mint) {
        details.checks.push({
            name: 'token_uniqueness',
            passed: false,
            message: `Cannot trade ${fromToken.symbol} for itself`
        });
        return buildValidationResult(false, 'Invalid token pair: Cannot trade the same token', {
            ...details,
            severity: 'error'
        });
    }
    details.checks.push({
        name: 'token_uniqueness',
        passed: true,
        message: 'Trading different tokens'
    });

    // Check if tokens are blacklisted
    const fromBlacklisted = BLACKLISTED_TOKENS.includes(fromToken.mint);
    const toBlacklisted = BLACKLISTED_TOKENS.includes(toToken.mint);
    if (fromBlacklisted || toBlacklisted) {
        details.checks.push({
            name: 'blacklist',
            passed: false,
            message: `Blacklisted token(s): ${fromBlacklisted ? fromToken.symbol : ''} ${toBlacklisted ? toToken.symbol : ''}`.trim()
        });
        return buildValidationResult(false, 'Invalid token pair: One or both tokens are blacklisted', {
            ...details,
            severity: 'error'
        });
    }
    details.checks.push({
        name: 'blacklist',
        passed: true,
        message: 'No blacklisted tokens'
    });

    // Check if tokens are whitelisted (if whitelist is active)
    if (WHITELISTED_TOKENS.length > 0) {
        const fromWhitelisted = WHITELISTED_TOKENS.includes(fromToken.mint);
        const toWhitelisted = WHITELISTED_TOKENS.includes(toToken.mint);
        if (!fromWhitelisted || !toWhitelisted) {
            details.checks.push({
                name: 'whitelist',
                passed: false,
                message: `Non-whitelisted token(s): ${!fromWhitelisted ? fromToken.symbol : ''} ${!toWhitelisted ? toToken.symbol : ''}`.trim()
            });
            return buildValidationResult(false, 'Invalid token pair: One or both tokens are not whitelisted', {
                ...details,
                severity: 'error'
            });
        }
        details.checks.push({
            name: 'whitelist',
            passed: true,
            message: 'Both tokens are whitelisted'
        });
    }

    // Check if pair exists in configured pairs and get configuration
    const pairConfig = TOKEN_PAIRS.find(
        pair => (pair.inputMint === fromToken.mint && pair.outputMint === toToken.mint) ||
                (pair.inputMint === toToken.mint && pair.outputMint === fromToken.mint)
    );

    if (!pairConfig) {
        details.checks.push({
            name: 'pair_configuration',
            passed: false,
            message: `Pair ${fromToken.symbol}-${toToken.symbol} is not configured for trading`
        });
        return buildValidationResult(false, 
            `Invalid token pair: ${fromToken.symbol}-${toToken.symbol} is not a configured trading pair`, {
                ...details,
                severity: 'error'
            });
    }

    details.checks.push({
        name: 'pair_configuration',
        passed: true,
        message: `Valid trading pair with ${pairConfig.minProfitPercent}% min profit and ${pairConfig.maxSlippagePercent}% max slippage`
    });

    return buildValidationResult(true, null, {
        ...details,
        pairConfig,
        severity: 'success'
    });
}

// Validate triangular arbitrage path
function validateTriangularPath(path) {
    if (!path || !Array.isArray(path) || path.length !== 3) {
        return {
            isValid: false,
            reason: 'Invalid path: Must contain exactly 3 steps'
        };
    }

    const tokens = path.map(step => {
        const token = Object.values(TOKENS).find(t => t.symbol === step.from);
        return token;
    });

    // Check if all tokens exist
    if (tokens.some(token => !token)) {
        return {
            isValid: false,
            reason: 'Invalid path: One or more tokens do not exist'
        };
    }

    // Check if path forms a cycle (last token should match first token)
    const lastStep = path[path.length - 1];
    if (lastStep.to !== path[0].from) {
        return {
            isValid: false,
            reason: 'Invalid path: Path does not form a cycle'
        };
    }

    // Validate each step in the path
    for (let i = 0; i < path.length; i++) {
        const currentToken = tokens[i];
        const nextToken = Object.values(TOKENS).find(t => t.symbol === path[i].to);
        
        const stepValidation = validateTokenPair(currentToken, nextToken);
        if (!stepValidation.isValid) {
            return {
                isValid: false,
                reason: `Invalid path at step ${i + 1}: ${stepValidation.reason}`
            };
        }
    }

    // Check if path exists in configured triangular paths
    const pathExists = TRIANGULAR_PATHS.some(configPath => 
        configPath.a === tokens[0].mint && 
        configPath.b === tokens[1].mint && 
        configPath.c === tokens[2].mint
    );

    if (!pathExists) {
        return {
            isValid: false,
            reason: 'Invalid path: Path is not configured for triangular arbitrage'
        };
    }

    return {
        isValid: true
    };
}

// Validate trade amount
function validateTradeAmount(amount, token, settings) {
    const details = {
        token: token?.symbol || 'unknown',
        amount: amount,
        checks: []
    };

    const numAmount = parseFloat(amount);
    
    // Check if amount is valid number
    if (isNaN(numAmount) || numAmount <= 0) {
        details.checks.push({
            name: 'amount_validity',
            passed: false,
            message: `Invalid amount: ${amount} (must be a positive number)`
        });
        return buildValidationResult(false, 'Invalid amount: Must be a positive number', {
            ...details,
            severity: 'error'
        });
    }
    details.checks.push({
        name: 'amount_validity',
        passed: true,
        message: `Valid amount: ${numAmount}`
    });

    // Check minimum trade amount
    const minAmount = settings.trading.minTradeAmount;
    if (numAmount < minAmount) {
        details.checks.push({
            name: 'min_amount',
            passed: false,
            message: `Amount ${numAmount} is below minimum ${minAmount} ${token.symbol}`
        });
        return buildValidationResult(false, 
            `Amount ${numAmount} is below minimum trade amount ${minAmount} ${token.symbol}`, {
                ...details,
                severity: 'error'
            });
    }
    details.checks.push({
        name: 'min_amount',
        passed: true,
        message: `Amount exceeds minimum ${minAmount} ${token.symbol}`
    });

    // Check maximum trade amount
    const maxAmount = settings.trading.maxTradeAmount;
    if (numAmount > maxAmount) {
        details.checks.push({
            name: 'max_amount',
            passed: false,
            message: `Amount ${numAmount} exceeds maximum ${maxAmount} ${token.symbol}`
        });
        return buildValidationResult(false, 
            `Amount ${numAmount} exceeds maximum trade amount ${maxAmount} ${token.symbol}`, {
                ...details,
                severity: 'error'
            });
    }
    details.checks.push({
        name: 'max_amount',
        passed: true,
        message: `Amount within maximum ${maxAmount} ${token.symbol}`
    });

    // Check token decimals
    const decimals = Math.log10(numAmount) - Math.floor(Math.log10(numAmount));
    if (decimals > token.decimals) {
        details.checks.push({
            name: 'decimals',
            passed: false,
            message: `Amount has ${decimals} decimals (max ${token.decimals} for ${token.symbol})`
        });
        return buildValidationResult(false, 
            `Amount has more decimal places than allowed for ${token.symbol} (max ${token.decimals})`, {
                ...details,
                severity: 'error'
            });
    }
    details.checks.push({
        name: 'decimals',
        passed: true,
        message: `Amount has valid decimal places for ${token.symbol}`
    });

    return buildValidationResult(true, null, {
        ...details,
        severity: 'success'
    });
}

// Validate trade opportunity
function validateTradeOpportunity(opportunity, settings) {
    const checks = {
        structure: null,
        tokens: null,
        amounts: null,
        profitability: null
    };

    // Check opportunity structure
    if (!opportunity || !opportunity.type || !opportunity.startAmount) {
        checks.structure = {
            passed: false,
            reason: 'Invalid opportunity structure'
        };
        return { isValid: false, reason: 'Invalid opportunity structure', checks };
    }

    // Validate based on opportunity type
    if (opportunity.type === 'triangular') {
        if (!opportunity.path || !Array.isArray(opportunity.path) || opportunity.path.length !== 3) {
            checks.structure = {
                passed: false,
                reason: 'Invalid triangular path structure'
            };
            return { isValid: false, reason: 'Invalid triangular path structure', checks };
        }

        const pathValidation = validateTriangularPath(opportunity.path);
        checks.tokens = {
            passed: pathValidation.isValid,
            reason: pathValidation.reason
        };

        if (!pathValidation.isValid) {
            return { isValid: false, reason: pathValidation.reason, checks };
        }
    } else {
        // Simple trade validation
        if (!opportunity.startToken || !opportunity.endToken) {
            checks.structure = {
                passed: false,
                reason: 'Missing start or end token'
            };
            return { isValid: false, reason: 'Missing start or end token', checks };
        }

        const startToken = Object.values(TOKENS).find(t => t.symbol === opportunity.startToken);
        const endToken = Object.values(TOKENS).find(t => t.symbol === opportunity.endToken);
        
        const pairValidation = validateTokenPair(startToken, endToken);
        checks.tokens = {
            passed: pairValidation.isValid,
            reason: pairValidation.reason
        };

        if (!pairValidation.isValid) {
            return { isValid: false, reason: pairValidation.reason, checks };
        }
    }

    // Validate amounts
    const startToken = Object.values(TOKENS).find(t => 
        t.symbol === (opportunity.type === 'triangular' ? opportunity.path[0].from : opportunity.startToken)
    );
    
    const amountValidation = validateTradeAmount(opportunity.startAmount, startToken, settings);
    checks.amounts = {
        passed: amountValidation.isValid,
        reason: amountValidation.reason
    };

    if (!amountValidation.isValid) {
        return { isValid: false, reason: amountValidation.reason, checks };
    }

    // Validate profitability
    const minProfit = opportunity.type === 'triangular' 
        ? TRIANGULAR_PATHS.find(p => p.name === opportunity.path.map(s => s.from).join('-'))?.minProfitPercent
        : TOKEN_PAIRS.find(p => p.name === `${opportunity.startToken}-${opportunity.endToken}`)?.minProfitPercent;

    if (!minProfit || opportunity.profitPercent < minProfit) {
        const reason = `Profit (${opportunity.profitPercent}%) below minimum threshold (${minProfit}%)`;
        checks.profitability = {
            passed: false,
            reason
        };
        return { isValid: false, reason, checks };
    }

    checks.profitability = {
        passed: true,
        reason: `Profit (${opportunity.profitPercent}%) meets minimum threshold (${minProfit}%)`
    };

    return {
        isValid: true,
        checks
    };
}

module.exports = {
    validateTokenPair,
    validateTriangularPath,
    validateTradeAmount,
    validateTradeOpportunity
};
