const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const path = require('path');
const fs = require('fs').promises;
const securityPatterns = require('./securityPatterns');

class SecurityScanner {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }

    async runNpmAudit() {
        try {
            const { stdout } = await execAsync('npm audit --json', {
                cwd: this.projectRoot
            });
            return JSON.parse(stdout);
        } catch (error) {
            // npm audit returns exit code 1 if vulnerabilities are found
            if (error.stdout) {
                return JSON.parse(error.stdout);
            }
            throw error;
        }
    }

    async scanDependencies() {
        const auditResults = await this.runNpmAudit();
        return this.formatAuditResults(auditResults);
    }

    async scanCode() {
        const issues = [];
        const files = await this.findJavaScriptFiles();

        for (const file of files) {
            const content = await fs.readFile(file, 'utf8');
            const fileIssues = await this.analyzeFileContent(content, file);
            issues.push(...fileIssues);
        }

        return issues;
    }

    async findJavaScriptFiles() {
        const exclude = ['node_modules', '.git', 'dist', 'build'];
        
        async function walk(dir) {
            const files = [];
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (!exclude.includes(entry.name)) {
                        files.push(...await walk(fullPath));
                    }
                } else if (entry.name.endsWith('.js')) {
                    files.push(fullPath);
                }
            }
            
            return files;
        }

        return walk(this.projectRoot);
    }

    async analyzeFileContent(content, filePath) {
        const issues = [];
        const patterns = {
            hardcodedSecrets: {
                pattern: /(password|secret|key|token|auth).*?['"](.*?)['"]|private_key.*?\[(.*?)\]/gi,
                risk: 'high',
                description: 'Possible hardcoded secret detected'
            },
            unsafeEval: {
                pattern: /eval\(|new Function\(|setTimeout\(['"]/g,
                risk: 'high',
                description: 'Unsafe code execution detected'
            },
            sqlInjection: {
                pattern: /execute\s*\(\s*['"`].*?\$\{.*?\}/g,
                risk: 'high',
                description: 'Potential SQL injection vulnerability'
            },
            unsafeRegex: {
                pattern: /\/.*?\*.*?\//g,
                risk: 'medium',
                description: 'Potentially unsafe regular expression'
            },
            consoleLog: {
                pattern: /console\.(log|debug|info|warn|error)\(/g,
                risk: 'low',
                description: 'Console logging detected in production code'
            }
        };

        const relativePath = path.relative(this.projectRoot, filePath);

        for (const [type, config] of Object.entries(patterns)) {
            const matches = [...content.matchAll(config.pattern)];
            for (const match of matches) {
                issues.push({
                    type,
                    risk: config.risk,
                    description: config.description,
                    file: relativePath,
                    line: this.findLineNumber(content, match.index),
                    snippet: this.getCodeSnippet(content, match.index)
                });
            }
        }

        return issues;
    }

    findLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }

    getCodeSnippet(content, index) {
        const lines = content.split('\n');
        const lineNumber = this.findLineNumber(content, index);
        const start = Math.max(0, lineNumber - 2);
        const end = Math.min(lines.length, lineNumber + 1);
        return lines.slice(start, end).join('\n');
    }

    formatAuditResults(results) {
        const formatted = [];
        
        if (results.vulnerabilities) {
            for (const [name, vuln] of Object.entries(results.vulnerabilities)) {
                formatted.push({
                    type: 'dependency',
                    risk: vuln.severity,
                    description: vuln.title,
                    package: name,
                    version: vuln.range,
                    recommendation: vuln.recommendation || 'Update to latest version'
                });
            }
        }

        return formatted;
    }

    async getSecurityScore() {
        const depIssues = await this.scanDependencies();
        const codeIssues = await this.scanCode();
        
        const issues = [...depIssues, ...codeIssues];
        
        // Enhanced scoring system
        const weights = {
            high: 10,
            moderate: 5,
            low: 1
        };

        // Category multipliers for trading bot
        const categoryMultipliers = {
            // Critical Security (2.0x)
            unsafeWalletAccess: 2.0,
            missingSignatureVerification: 2.0,
            unsafePDADerivation: 2.0,
            missingOwnerCheck: 2.0,
            unsafeTokenApproval: 2.0,

            // Transaction Safety (1.8x)
            insufficientSlippage: 1.8,
            unsafePoolInteraction: 1.8,
            unsafeOrderSize: 1.8,
            missingPriceValidation: 1.8,
            missingPreflightChecks: 1.8,
            missingPriorityFees: 1.8,

            // Financial Accuracy (1.5x)
            unsafeAmountCalculation: 1.5,
            unsafeComputeLimit: 1.5,
            hardcodedSecrets: 1.5,

            // Program Safety (1.3x)
            unsafeAccountDeserialize: 1.3,
            missingVersionCheck: 1.3,
            unsafeRentExemption: 1.3,

            // Reliability (1.2x)
            missingRetryLogic: 1.2,
            unsafeInstructionOrder: 1.2,

            default: 1.0
        };

        const score = 100 - Math.min(100, issues.reduce((acc, issue) => {
            const baseWeight = weights[issue.risk] || 1;
            const multiplier = categoryMultipliers[issue.type] || categoryMultipliers.default;
            return acc + (baseWeight * multiplier);
        }, 0));

        return {
            score,
            issues,
            summary: {
                total: issues.length,
                high: issues.filter(i => i.risk === 'high').length,
                moderate: issues.filter(i => i.risk === 'moderate').length,
                low: issues.filter(i => i.risk === 'low').length
            }
        };
    }
}

module.exports = SecurityScanner;
