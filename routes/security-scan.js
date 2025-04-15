const express = require('express');
const router = express.Router();
const { verifyToken, checkPermission } = require('../middleware/auth');
const SecurityScanner = require('../services/securityScanner');
const SecurityReporter = require('../services/securityReporter');
const ReportExporter = require('../services/reportExporter');
const path = require('path');
const fs = require('fs').promises;

// Apply authentication to all routes
router.use(verifyToken);

/**
 * @swagger
 * /api/security-scan/scan:
 *   get:
 *     summary: Get security scan results
 *     tags: [SecurityScan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security scan results
 *       403:
 *         description: Not authorized
 */
// Get security scan results
router.get('/scan', checkPermission('view_code'), async (req, res) => {
    try {
        const scanner = new SecurityScanner(path.join(__dirname, '..'));
        const results = await scanner.getSecurityScore();
        
        // Mask sensitive data for non-admin users
        if (req.user.role !== 'admin') {
            results.issues = results.issues.map(issue => {
                if (issue.snippet) {
                    issue.snippet = issue.snippet.replace(
                        /(password|secret|key|token|auth).*?['"](.*?)['"]|private_key.*?\[(.*?)\]/gi,
                        '$1="[MASKED]"'
                    );
                }
                return issue;
            });
        }
        
        res.json(results);
    } catch (error) {
        console.error('Security scan error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/security-scan/history:
 *   get:
 *     summary: Get historical scan data
 *     tags: [SecurityScan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of previous security scan reports
 *       403:
 *         description: Not authorized
 */
// Get historical scan data
router.get('/history', checkPermission('view_code'), async (req, res) => {
    try {
        const reporter = new SecurityReporter(path.join(__dirname, '..'));
        const reports = await reporter.getPreviousReports(10);
        
        // Mask sensitive data for non-admin users
        if (req.user.role !== 'admin') {
            reports.forEach(report => {
                if (report.recommendations) {
                    report.recommendations.forEach(rec => {
                        if (rec.examples) {
                            rec.examples.forEach(ex => {
                                if (ex.snippet) {
                                    ex.snippet = ex.snippet.replace(
                                        /(password|secret|key|token|auth).*?['"](.*)['"]/gi,
                                        '$1="[MASKED]"'
                                    );
                                }
                            });
                        }
                    });
                }
            });
        }
        
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/security-scan/schedule:
 *   post:
 *     summary: Schedule an automated security scan
 *     tags: [SecurityScan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - frequency
 *               - time
 *             properties:
 *               frequency:
 *                 type: string
 *                 enum: [daily, weekly, monthly]
 *               time:
 *                 type: string
 *                 description: Time in HH:mm format
 *     responses:
 *       200:
 *         description: Scan scheduled successfully
 *       400:
 *         description: Invalid frequency or time format
 *       403:
 *         description: Not authorized
 */
// Schedule automated scan
router.post('/schedule', checkPermission('manage_settings'), async (req, res) => {
    try {
        const { frequency, time } = req.body; // frequency: daily, weekly, monthly
        
        // Validate frequency
        if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
            return res.status(400).json({ error: 'Invalid frequency' });
        }
        
        // Validate time format (HH:mm)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(time)) {
            return res.status(400).json({ error: 'Invalid time format' });
        }
        
        // TODO: Schedule scan using a job scheduler (e.g., node-cron)
        // For now, just store the schedule in memory
        global.scanSchedule = { frequency, time };
        
        res.json({
            message: 'Scan scheduled successfully',
            schedule: { frequency, time }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/security-scan/schedule:
 *   get:
 *     summary: Get current scan schedule
 *     tags: [SecurityScan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current scan schedule
 *       403:
 *         description: Not authorized
 */
// Get current scan schedule
router.get('/schedule', checkPermission('view_code'), async (req, res) => {
    try {
        res.json(global.scanSchedule || { message: 'No scan scheduled' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/security-scan/export/batch:
 *   post:
 *     summary: Batch export security reports
 *     tags: [SecurityScan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               format:
 *                 type: string
 *                 default: all
 *     responses:
 *       200:
 *         description: Zip file of exported reports
 *       404:
 *         description: No reports found in specified date range
 *       403:
 *         description: Not authorized
 */
// Batch export reports
router.post('/export/batch', checkPermission('view_code'), async (req, res) => {
    try {
        const { startDate, endDate, format = 'all' } = req.body;
        const projectRoot = path.join(__dirname, '..');
        const reporter = new SecurityReporter(projectRoot);
        const exporter = new ReportExporter(projectRoot);

        // Get reports within date range
        let reports = await reporter.getPreviousReports();
        
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            reports = reports.filter(r => {
                const reportDate = new Date(r.timestamp);
                return reportDate >= start && reportDate <= end;
            });
        }

        if (reports.length === 0) {
            return res.status(404).json({ error: 'No reports found in the specified date range' });
        }

        // Export reports
        const zipPath = await exporter.exportBatch(reports, format);

        // Set headers for zip download
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${path.basename(zipPath)}`);

        // Stream the file
        const fileStream = fs.createReadStream(zipPath);
        fileStream.pipe(res);

        // Clean up the file after sending
        fileStream.on('end', async () => {
            try {
                await fs.unlink(zipPath);
            } catch (error) {
                console.error('Error cleaning up zip file:', error);
            }
        });
    } catch (error) {
        console.error('Batch export error:', error);
        res.status(500).json({ error: 'Failed to export reports' });
    }
});

/**
 * @swagger
 * /api/security-scan/export/{format}:
 *   get:
 *     summary: Export latest security report in given format
 *     tags: [SecurityScan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, csv, json]
 *         description: Export format
 *     responses:
 *       200:
 *         description: Exported report file
 *       400:
 *         description: Unsupported format
 *       404:
 *         description: No reports available
 *       403:
 *         description: Not authorized
 */
// Export report in various formats
router.get('/export/:format', checkPermission('view_code'), async (req, res) => {
    try {
        const { format } = req.params;
        const projectRoot = path.join(__dirname, '..');
        const reporter = new SecurityReporter(projectRoot);
        const exporter = new ReportExporter(projectRoot);

        // Get latest report
        const reports = await reporter.getPreviousReports(1);
        if (reports.length === 0) {
            return res.status(404).json({ error: 'No reports available' });
        }

        const report = reports[0];
        let filePath;

        // Export in requested format
        switch (format.toLowerCase()) {
            case 'pdf':
                filePath = await exporter.exportToPDF(report);
                res.setHeader('Content-Type', 'application/pdf');
                break;
            case 'csv':
                filePath = await exporter.exportToCSV(report);
                res.setHeader('Content-Type', 'text/csv');
                break;
            case 'json':
                filePath = await exporter.exportToJSON(report);
                res.setHeader('Content-Type', 'application/json');
                break;
            default:
                return res.status(400).json({ error: 'Unsupported format' });
        }

        // Set download headers
        const filename = path.basename(filePath);
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Clean up the file after sending
        fileStream.on('end', async () => {
            try {
                await fs.unlink(filePath);
            } catch (error) {
                console.error('Error cleaning up export file:', error);
            }
        });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export report' });
    }
});

module.exports = router;
