// Security patterns for Solana trading bot
module.exports = {
    // General Security
    hardcodedSecrets: {
        pattern: /(password|secret|key|token|auth).*?['"](.*?)['"]|private_key.*?\[(.*?)\]/gi,
        risk: 'high',
        description: 'Possible hardcoded secret detected',
        recommendation: 'Move to environment variables'
    },
    unsafeEval: {
        pattern: /eval\(|new Function\(|setTimeout\(['"]/g,
        risk: 'high',
        description: 'Unsafe code execution detected',
        recommendation: 'Use safer alternatives'
    },

    // Blockchain Security
    unsafeWalletAccess: {
        pattern: /wallet\.(sign|sendTransaction|transfer)(?![^)]*confirm:\s*true)/g,
        risk: 'high',
        description: 'Transaction without confirmation',
        recommendation: 'Add confirmation parameter'
    },
    insufficientSlippage: {
        pattern: /slippage[^=]*=[^;]*(0\.0*[0-9]|0)/g,
        risk: 'high',
        description: 'Unsafe slippage tolerance',
        recommendation: 'Set proper slippage tolerance'
    },
    unsafeAmountCalculation: {
        pattern: /\b\d+\s*\*\s*10\s*\*{2}\s*\d+\b/g,
        risk: 'high',
        description: 'Unsafe decimal calculation',
        recommendation: 'Use BigNumber or LAMPORTS_PER_SOL'
    },

    // Trading Security
    unsafeOrderSize: {
        pattern: /(orderSize|amount)\s*=\s*[^;]*(?<!maxSize|maxAmount)/g,
        risk: 'high',
        description: 'No maximum order size check',
        recommendation: 'Add size limits'
    },
    missingPriceValidation: {
        pattern: /price\s*=\s*[^;]*(?<!validatePrice|checkPrice)/g,
        risk: 'high',
        description: 'Price without validation',
        recommendation: 'Add price validation'
    },
    unsafeAssetAddress: {
        pattern: /new\s+PublicKey\(['"].*?['"]\)/g,
        risk: 'medium',
        description: 'Hardcoded token address',
        recommendation: 'Use config file'
    },

    // API Security
    missingRateLimit: {
        pattern: /app\.(get|post|put|delete)\([^{]*{(?![^}]*rateLimiter)/g,
        risk: 'medium',
        description: 'No rate limiting',
        recommendation: 'Add rate limiting'
    },
    missingInputValidation: {
        pattern: /req\.body\.[a-zA-Z_]+(?![^;]*validate)/g,
        risk: 'high',
        description: 'No input validation',
        recommendation: 'Add schema validation'
    },

    // Solana-specific
    unsafeInstructionOrder: {
        pattern: /Transaction\(\)(?![^;]*recentBlockhash)/g,
        risk: 'high',
        description: 'Missing recent blockhash',
        recommendation: 'Add recentBlockhash'
    },
    missingSignatureVerification: {
        pattern: /verify(?![^;]*signature)/g,
        risk: 'high',
        description: 'Missing signature verification',
        recommendation: 'Add signature verification'
    },
    unsafeAccountDeserialize: {
        pattern: /account\.data(?![^;]*deserialize)/g,
        risk: 'medium',
        description: 'Raw account data access',
        recommendation: 'Use proper deserialization'
    },
    // Additional Solana-specific checks
    missingPriorityFees: {
        pattern: /computeUnitPrice[^=]*=[^;]*(undefined|null|0)/g,
        risk: 'high',
        description: 'Missing or zero compute unit price',
        recommendation: 'Set appropriate computeUnitPrice for priority fees'
    },
    unsafeComputeLimit: {
        pattern: /computeBudgetInstruction(?![^;]*setComputeUnitLimit)/g,
        risk: 'high',
        description: 'No compute unit limit set',
        recommendation: 'Set appropriate compute unit limit'
    },
    missingPreflightChecks: {
        pattern: /sendTransaction[^{]*{(?![^}]*skipPreflight:\s*false)/g,
        risk: 'high',
        description: 'Preflight checks disabled',
        recommendation: 'Enable preflight checks'
    },
    unsafePoolInteraction: {
        pattern: /(swap|addLiquidity|removeLiquidity)(?![^;]*slippageTolerance)/g,
        risk: 'high',
        description: 'Pool interaction without slippage protection',
        recommendation: 'Add slippage tolerance'
    },
    missingRetryLogic: {
        pattern: /catch\s*\([^)]*\)\s*{(?![^}]*retry)/g,
        risk: 'medium',
        description: 'Missing transaction retry logic',
        recommendation: 'Implement retry with backoff'
    },
    unsafePDADerivation: {
        pattern: /PublicKey\.findProgramAddress(?![^;]*verify)/g,
        risk: 'high',
        description: 'PDA derivation without verification',
        recommendation: 'Verify PDA derivation'
    },
    missingOwnerCheck: {
        pattern: /getAccountInfo(?![^;]*(owner|programId))/g,
        risk: 'high',
        description: 'Missing account owner check',
        recommendation: 'Verify account owner'
    },
    unsafeTokenApproval: {
        pattern: /approve(?![^;]*amount:\s*0)/g,
        risk: 'high',
        description: 'Unlimited token approval',
        recommendation: 'Set specific approval amount'
    },
    missingVersionCheck: {
        pattern: /programId(?![^;]*version)/g,
        risk: 'medium',
        description: 'Missing program version check',
        recommendation: 'Verify program version'
    },
    unsafeRentExemption: {
        pattern: /createAccount(?![^;]*rentExempt)/g,
        risk: 'medium',
        description: 'Account creation without rent exemption',
        recommendation: 'Add rent exemption'
    }
};
