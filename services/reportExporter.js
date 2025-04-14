const PDFDocument = require('pdfkit');
const json2csv = require('json2csv').parse;
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

class ReportExporter {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.exportDir = path.join(projectRoot, 'exports');
    }

    async exportBatch(reports, format) {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const zipFilename = `security-reports-${timestamp}.zip`;
        const zipPath = path.join(this.exportDir, zipFilename);
        
        await fs.mkdir(this.exportDir, { recursive: true });
        
        // Create write stream for zip
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        // Listen for errors
        archive.on('error', err => {
            throw err;
        });
        
        // Pipe archive to file
        await pipeline(archive, output);
        
        try {
            for (const [index, report] of reports.entries()) {
                const reportDate = new Date(report.timestamp).toISOString().split('T')[0];
                const filePrefix = `report-${reportDate}-${index + 1}`;
                
                switch (format) {
                    case 'pdf': {
                        const pdfBuffer = await this.generatePDFBuffer(report);
                        archive.append(pdfBuffer, { name: `${filePrefix}.pdf` });
                        break;
                    }
                    case 'csv': {
                        const csvData = await this.generateCSV(report);
                        archive.append(csvData, { name: `${filePrefix}.csv` });
                        break;
                    }
                    case 'json': {
                        const jsonData = JSON.stringify(report, null, 2);
                        archive.append(jsonData, { name: `${filePrefix}.json` });
                        break;
                    }
                    case 'all': {
                        const pdfBuffer = await this.generatePDFBuffer(report);
                        const csvData = await this.generateCSV(report);
                        const jsonData = JSON.stringify(report, null, 2);
                        
                        archive.append(pdfBuffer, { name: `${filePrefix}.pdf` });
                        archive.append(csvData, { name: `${filePrefix}.csv` });
                        archive.append(jsonData, { name: `${filePrefix}.json` });
                        break;
                    }
                }
            }
            
            // Add a summary file
            const summary = this.generateSummary(reports);
            archive.append(JSON.stringify(summary, null, 2), { name: 'summary.json' });
            
            // Finalize the archive
            await archive.finalize();
            
            return zipPath;
        } catch (error) {
            // Clean up the zip file if there's an error
            try {
                await fs.unlink(zipPath);
            } catch (unlinkError) {
                console.error('Error cleaning up zip file:', unlinkError);
            }
            throw error;
        }
    }
    
    async generatePDFBuffer(report) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            const doc = new PDFDocument();
            
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            
            // Title
            doc.fontSize(24).text('Security Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Generated: ${new Date(report.timestamp).toLocaleString()}`, { align: 'center' });
            doc.moveDown();
            
            // Security Score
            doc.fontSize(18).text('Security Score');
            doc.fontSize(14).text(`Current Score: ${report.score}`);
            doc.moveDown();
            
            // Rest of the PDF generation...
            // [Previous PDF generation code]
            
            doc.end();
        });
    }
    
    async generateCSV(report) {
        const rows = report.recommendations.map(rec => ({
            Type: this.formatIssueType(rec.type),
            Priority: rec.priority,
            Description: rec.description,
            Occurrences: rec.count,
            Examples: rec.examples ? rec.examples.map(ex => `${ex.file}:${ex.line}`).join('; ') : '',
            SuggestedFix: rec.suggestedFix ? 
                `Before: ${rec.suggestedFix.before}; After: ${rec.suggestedFix.after}` : ''
        }));
        
        return json2csv(rows);
    }
    
    generateSummary(reports) {
        const summary = {
            totalReports: reports.length,
            dateRange: {
                start: new Date(Math.min(...reports.map(r => new Date(r.timestamp)))).toISOString(),
                end: new Date(Math.max(...reports.map(r => new Date(r.timestamp)))).toISOString()
            },
            scoreStats: {
                average: 0,
                min: 100,
                max: 0,
                trend: []
            },
            issueStats: {
                total: 0,
                byRisk: { high: 0, moderate: 0, low: 0 },
                mostCommon: {}
            }
        };
        
        // Calculate statistics
        reports.forEach(report => {
            // Score stats
            summary.scoreStats.average += report.score;
            summary.scoreStats.min = Math.min(summary.scoreStats.min, report.score);
            summary.scoreStats.max = Math.max(summary.scoreStats.max, report.score);
            summary.scoreStats.trend.push({
                date: report.timestamp,
                score: report.score
            });
            
            // Issue stats
            if (report.summary) {
                summary.issueStats.total += report.summary.total;
                summary.issueStats.byRisk.high += report.summary.high;
                summary.issueStats.byRisk.moderate += report.summary.moderate;
                summary.issueStats.byRisk.low += report.summary.low;
            }
            
            // Track issue types
            report.recommendations.forEach(rec => {
                summary.issueStats.mostCommon[rec.type] = 
                    (summary.issueStats.mostCommon[rec.type] || 0) + rec.count;
            });
        });
        
        // Calculate average score
        summary.scoreStats.average /= reports.length;
        
        // Sort most common issues
        summary.issueStats.mostCommon = Object.entries(summary.issueStats.mostCommon)
            .sort((a, b) => b[1] - a[1])
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {});
        
        return summary;
    }

    async exportToPDF(report) {
        const doc = new PDFDocument();
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const filename = `security-report-${timestamp}.pdf`;
        const filePath = path.join(this.exportDir, filename);

        await fs.mkdir(this.exportDir, { recursive: true });
        const stream = fs.createWriteStream(filePath);

        return new Promise((resolve, reject) => {
            doc.pipe(stream);

            // Title
            doc.fontSize(24).text('Security Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
            doc.moveDown();

            // Security Score
            doc.fontSize(18).text('Security Score');
            doc.fontSize(14).text(`Current Score: ${report.score}`);
            doc.moveDown();

            // Issue Summary
            doc.fontSize(18).text('Issue Summary');
            doc.fontSize(12).text(`Total Issues: ${report.summary.total}`);
            doc.text(`High Risk: ${report.summary.high}`);
            doc.text(`Moderate Risk: ${report.summary.moderate}`);
            doc.text(`Low Risk: ${report.summary.low}`);
            doc.moveDown();

            // Trends
            if (report.trends) {
                doc.fontSize(18).text('Trends');
                doc.fontSize(12).text(`Resolved Issues: ${report.trends.resolvedIssues}`);
                doc.text(`New Issues: ${report.trends.newIssues}`);
                doc.moveDown();
            }

            // Recommendations
            doc.fontSize(18).text('Recommendations');
            doc.moveDown();

            report.recommendations.forEach((rec, index) => {
                doc.fontSize(14).text(`${index + 1}. ${this.formatIssueType(rec.type)}`);
                doc.fontSize(12).text(`Priority: ${rec.priority}`);
                doc.text(`Description: ${rec.description}`);
                doc.text(`Occurrences: ${rec.count}`);

                if (rec.examples && rec.examples.length > 0) {
                    doc.text('Examples:');
                    rec.examples.forEach(ex => {
                        doc.fontSize(10)
                           .text(`File: ${ex.file}:${ex.line}`)
                           .text(`Code: ${ex.snippet}`, { width: 500 });
                    });
                }

                if (rec.suggestedFix) {
                    doc.fontSize(12).text('Suggested Fix:');
                    doc.fontSize(10)
                       .text(`Before: ${rec.suggestedFix.before}`)
                       .text(`After: ${rec.suggestedFix.after}`);
                }

                doc.moveDown();
            });

            doc.end();

            stream.on('finish', () => resolve(filePath));
            stream.on('error', reject);
        });
    }

    async exportToCSV(report) {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const filename = `security-report-${timestamp}.csv`;
        const filePath = path.join(this.exportDir, filename);

        await fs.mkdir(this.exportDir, { recursive: true });

        // Flatten recommendations for CSV format
        const rows = report.recommendations.map(rec => ({
            Type: this.formatIssueType(rec.type),
            Priority: rec.priority,
            Description: rec.description,
            Occurrences: rec.count,
            Examples: rec.examples ? rec.examples.map(ex => `${ex.file}:${ex.line}`).join('; ') : '',
            SuggestedFix: rec.suggestedFix ? 
                `Before: ${rec.suggestedFix.before}; After: ${rec.suggestedFix.after}` : ''
        }));

        const csv = json2csv(rows);
        await fs.writeFile(filePath, csv);
        return filePath;
    }

    async exportToJSON(report) {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const filename = `security-report-${timestamp}.json`;
        const filePath = path.join(this.exportDir, filename);

        await fs.mkdir(this.exportDir, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(report, null, 2));
        return filePath;
    }

    formatIssueType(type) {
        return type
            .split(/(?=[A-Z])|_/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    async exportBatch(reports, format) {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const zipFilename = `security-reports-${timestamp}.zip`;
        const zipPath = path.join(this.exportDir, zipFilename);
        
        await fs.mkdir(this.exportDir, { recursive: true });
        
        // Create write stream for zip
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        // Listen for errors
        archive.on('error', err => {
            throw err;
        });
        
        // Pipe archive to file
        await pipeline(archive, output);
        
        try {
            for (const [index, report] of reports.entries()) {
                const reportDate = new Date(report.timestamp).toISOString().split('T')[0];
                const filePrefix = `report-${reportDate}-${index + 1}`;
                
                switch (format) {
                    case 'pdf': {
                        const pdfBuffer = await this.generatePDFBuffer(report);
                        archive.append(pdfBuffer, { name: `${filePrefix}.pdf` });
                        break;
                    }
                    case 'csv': {
                        const csvData = await this.generateCSV(report);
                        archive.append(csvData, { name: `${filePrefix}.csv` });
                        break;
                    }
                    case 'json': {
                        const jsonData = JSON.stringify(report, null, 2);
                        archive.append(jsonData, { name: `${filePrefix}.json` });
                        break;
                    }
                    case 'all': {
                        const pdfBuffer = await this.generatePDFBuffer(report);
                        const csvData = await this.generateCSV(report);
                        const jsonData = JSON.stringify(report, null, 2);
                        
                        archive.append(pdfBuffer, { name: `${filePrefix}.pdf` });
                        archive.append(csvData, { name: `${filePrefix}.csv` });
                        archive.append(jsonData, { name: `${filePrefix}.json` });
                        break;
                    }
                }
            }
            
            // Add a summary file
            const summary = this.generateSummary(reports);
            archive.append(JSON.stringify(summary, null, 2), { name: 'summary.json' });
            
            // Finalize the archive
            await archive.finalize();
            
            return zipPath;
        } catch (error) {
            // Clean up the zip file if there's an error
            try {
                await fs.unlink(zipPath);
            } catch (unlinkError) {
                console.error('Error cleaning up zip file:', unlinkError);
            }
            throw error;
        }
    }
    
    async generatePDFBuffer(report) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            const doc = new PDFDocument();
            
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            
            // Title
            doc.fontSize(24).text('Security Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Generated: ${new Date(report.timestamp).toLocaleString()}`, { align: 'center' });
            doc.moveDown();
            
            // Security Score
            doc.fontSize(18).text('Security Score');
            doc.fontSize(14).text(`Current Score: ${report.score}`);
            doc.moveDown();
            
            // Rest of the PDF generation...
            // [Previous PDF generation code]
            
            doc.end();
        });
    }
    
    async generateCSV(report) {
        const rows = report.recommendations.map(rec => ({
            Type: this.formatIssueType(rec.type),
            Priority: rec.priority,
            Description: rec.description,
            Occurrences: rec.count,
            Examples: rec.examples ? rec.examples.map(ex => `${ex.file}:${ex.line}`).join('; ') : '',
            SuggestedFix: rec.suggestedFix ? 
                `Before: ${rec.suggestedFix.before}; After: ${rec.suggestedFix.after}` : ''
        }));
        
        return json2csv(rows);
    }
    
    generateSummary(reports) {
        const summary = {
            totalReports: reports.length,
            dateRange: {
                start: new Date(Math.min(...reports.map(r => new Date(r.timestamp)))).toISOString(),
                end: new Date(Math.max(...reports.map(r => new Date(r.timestamp)))).toISOString()
            },
            scoreStats: {
                average: 0,
                min: 100,
                max: 0,
                trend: []
            },
            issueStats: {
                total: 0,
                byRisk: { high: 0, moderate: 0, low: 0 },
                mostCommon: {}
            }
        };
        
        // Calculate statistics
        reports.forEach(report => {
            // Score stats
            summary.scoreStats.average += report.score;
            summary.scoreStats.min = Math.min(summary.scoreStats.min, report.score);
            summary.scoreStats.max = Math.max(summary.scoreStats.max, report.score);
            summary.scoreStats.trend.push({
                date: report.timestamp,
                score: report.score
            });
            
            // Issue stats
            if (report.summary) {
                summary.issueStats.total += report.summary.total;
                summary.issueStats.byRisk.high += report.summary.high;
                summary.issueStats.byRisk.moderate += report.summary.moderate;
                summary.issueStats.byRisk.low += report.summary.low;
            }
            
            // Track issue types
            report.recommendations.forEach(rec => {
                summary.issueStats.mostCommon[rec.type] = 
                    (summary.issueStats.mostCommon[rec.type] || 0) + rec.count;
            });
        });
        
        // Calculate average score
        summary.scoreStats.average /= reports.length;
        
        // Sort most common issues
        summary.issueStats.mostCommon = Object.entries(summary.issueStats.mostCommon)
            .sort((a, b) => b[1] - a[1])
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {});
        
        return summary;
    }

}

module.exports = ReportExporter;
