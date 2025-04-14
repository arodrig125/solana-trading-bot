const fs = require('fs').promises;
const path = require('path');

class SecurityReporter {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.reportsDir = path.join(projectRoot, 'security-reports');
    }

    async generateReport(scanResults) {
        const timestamp = new Date().toISOString();
        const report = {
            timestamp,
            score: scanResults.score,
            summary: scanResults.summary,
            issues: this.categorizeIssues(scanResults.issues),
            trends: await this.analyzeTrends(scanResults),
            recommendations: this.generateRecommendations(scanResults.issues)
        };

        await this.saveReport(report);
        return report;
    }

    categorizeIssues(issues) {
        const categories = {
            criticalSecurity: [],
            transactionSafety: [],
            financialAccuracy: [],
            programSafety: [],
            reliability: [],
            other: []
        };

        const categoryMap = {
            // Critical Security
            unsafeWalletAccess: 'criticalSecurity',
            missingSignatureVerification: 'criticalSecurity',
            unsafePDADerivation: 'criticalSecurity',
            missingOwnerCheck: 'criticalSecurity',
            unsafeTokenApproval: 'criticalSecurity',

            // Transaction Safety
            insufficientSlippage: 'transactionSafety',
            unsafePoolInteraction: 'transactionSafety',
            unsafeOrderSize: 'transactionSafety',
            missingPriceValidation: 'transactionSafety',
            missingPreflightChecks: 'transactionSafety',
            missingPriorityFees: 'transactionSafety',

            // Financial Accuracy
            unsafeAmountCalculation: 'financialAccuracy',
            unsafeComputeLimit: 'financialAccuracy',
            hardcodedSecrets: 'financialAccuracy',

            // Program Safety
            unsafeAccountDeserialize: 'programSafety',
            missingVersionCheck: 'programSafety',
            unsafeRentExemption: 'programSafety',

            // Reliability
            missingRetryLogic: 'reliability',
            unsafeInstructionOrder: 'reliability'
        };

        issues.forEach(issue => {
            const category = categoryMap[issue.type] || 'other';
            categories[category].push(issue);
        });

        return categories;
    }

    async analyzeTrends(currentResults) {
        const reports = await this.getPreviousReports(5);
        const trends = {
            scoreHistory: [],
            issueCountHistory: [],
            resolvedIssues: 0,
            newIssues: 0,
            mostFrequentIssues: []
        };

        if (reports.length > 0) {
            // Calculate score and issue count history
            trends.scoreHistory = reports.map(r => ({
                timestamp: r.timestamp,
                score: r.score
            }));

            // Track issue counts over time
            trends.issueCountHistory = reports.map(r => ({
                timestamp: r.timestamp,
                total: r.summary.total,
                high: r.summary.high,
                moderate: r.summary.moderate,
                low: r.summary.low
            }));

            // Compare with last report
            const lastReport = reports[reports.length - 1];
            const lastIssues = new Set(lastReport.issues.flat().map(i => this.getIssueFingerprint(i)));
            const currentIssues = new Set(currentResults.issues.map(i => this.getIssueFingerprint(i)));

            trends.resolvedIssues = [...lastIssues].filter(i => !currentIssues.has(i)).length;
            trends.newIssues = [...currentIssues].filter(i => !lastIssues.has(i)).length;

            // Analyze most frequent issues
            const issueFrequency = {};
            reports.forEach(report => {
                report.issues.flat().forEach(issue => {
                    const type = issue.type;
                    issueFrequency[type] = (issueFrequency[type] || 0) + 1;
                });
            });

            trends.mostFrequentIssues = Object.entries(issueFrequency)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => ({ type, count }));
        }

        return trends;
    }

    generateRecommendations(issues) {
        const recommendations = [];

        // Group similar issues
        const issueGroups = {};
        issues.forEach(issue => {
            if (!issueGroups[issue.type]) {
                issueGroups[issue.type] = [];
            }
            issueGroups[issue.type].push(issue);
        });

        // Generate prioritized recommendations
        Object.entries(issueGroups).forEach(([type, groupIssues]) => {
            const recommendation = {
                type,
                priority: this.getIssuePriority(type),
                count: groupIssues.length,
                description: this.getRecommendationDescription(type),
                examples: groupIssues.slice(0, 3).map(issue => ({
                    file: issue.file,
                    line: issue.line,
                    snippet: issue.snippet
                })),
                suggestedFix: this.getSuggestedFix(type)
            };
            recommendations.push(recommendation);
        });

        // Sort by priority and count
        return recommendations.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            return b.count - a.count;
        });
    }

    getIssuePriority(type) {
        const priorities = {
            criticalSecurity: 5,
            transactionSafety: 4,
            financialAccuracy: 3,
            programSafety: 2,
            reliability: 1
        };
        return priorities[type] || 0;
    }

    getRecommendationDescription(type) {
        const descriptions = {
            unsafeWalletAccess: 'Add confirmation checks to all wallet transactions',
            insufficientSlippage: 'Implement proper slippage tolerance checks',
            unsafeAmountCalculation: 'Use BigNumber for all amount calculations',
            // Add more descriptions...
        };
        return descriptions[type] || 'Fix the identified security issue';
    }

    getSuggestedFix(type) {
        const fixes = {
            unsafeWalletAccess: {
                before: 'wallet.sendTransaction(tx)',
                after: 'wallet.sendTransaction(tx, { confirmation: true })'
            },
            insufficientSlippage: {
                before: 'slippage = 0',
                after: 'slippage = new Percentage(0.5)'
            },
            // Add more fixes...
        };
        return fixes[type] || null;
    }

    getIssueFingerprint(issue) {
        return `${issue.type}:${issue.file}:${issue.line}`;
    }

    async getPreviousReports(limit = 5) {
        try {
            await fs.mkdir(this.reportsDir, { recursive: true });
            const files = await fs.readdir(this.reportsDir);
            const reports = [];

            for (const file of files.slice(-limit)) {
                const content = await fs.readFile(
                    path.join(this.reportsDir, file),
                    'utf8'
                );
                reports.push(JSON.parse(content));
            }

            return reports.sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp)
            );
        } catch (error) {
            console.error('Error reading previous reports:', error);
            return [];
        }
    }

    async saveReport(report) {
        try {
            await fs.mkdir(this.reportsDir, { recursive: true });
            const filename = `security-report-${report.timestamp.replace(/:/g, '-')}.json`;
            await fs.writeFile(
                path.join(this.reportsDir, filename),
                JSON.stringify(report, null, 2)
            );
        } catch (error) {
            console.error('Error saving report:', error);
            throw error;
        }
    }
}

module.exports = SecurityReporter;
