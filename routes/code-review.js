const express = require('express');
const router = express.Router();
const { verifyToken, checkPermission } = require('../middleware/auth');
const path = require('path');
const fs = require('fs').promises;

// Apply authentication to all routes
router.use(verifyToken);

/**
 * @swagger
 * /api/code-review/files:
 *   get:
 *     summary: Get list of reviewable files
 *     tags: [CodeReview]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of files
 *       403:
 *         description: Not authorized
 */
// Get list of reviewable files
router.get('/files', checkPermission('view_code'), async (req, res) => {
    try {
        const excludedDirs = ['.git', 'node_modules', '.env'];
        const excludedFiles = ['.env', 'credentials.json', 'private-key.json'];
        
        async function getFiles(dir) {
            const files = await fs.readdir(dir, { withFileTypes: true });
            const paths = [];
            
            for (const file of files) {
                if (excludedDirs.includes(file.name)) continue;
                if (excludedFiles.includes(file.name)) continue;
                
                const fullPath = path.join(dir, file.name);
                if (file.isDirectory()) {
                    paths.push(...await getFiles(fullPath));
                } else if (file.name.endsWith('.js') || file.name.endsWith('.json')) {
                    paths.push(fullPath);
                }
            }
            return paths;
        }
        
        const files = await getFiles(path.join(__dirname, '..'));
        res.json({ files });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/code-review/file/{filepath}:
 *   get:
 *     summary: Get file content (with sensitive data masked)
 *     tags: [CodeReview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filepath
 *         required: true
 *         schema:
 *           type: string
 *         description: File path (relative to project root)
 *     responses:
 *       200:
 *         description: File content (masked if code reviewer)
 *       403:
 *         description: Not authorized
 */
// Get file content (with sensitive data masked)
router.get('/file/:filepath(*)', checkPermission('view_code'), async (req, res) => {
    try {
        const filePath = path.join(__dirname, '..', req.params.filepath);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Mask sensitive data if user is code reviewer
        let maskedContent = content;
        if (req.user.role === 'code_reviewer') {
            maskedContent = content
                .replace(/private_key\s*=\s*["'][^"']+["']/gi, 'private_key="[MASKED]"')
                .replace(/password\s*=\s*["'][^"']+["']/gi, 'password="[MASKED]"')
                .replace(/secret\s*=\s*["'][^"']+["']/gi, 'secret="[MASKED]"')
                .replace(/(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b)/g, '[EMAIL_MASKED]')
                .replace(/\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g, '[WALLET_MASKED]'); // Bitcoin address format
        }
        
        res.json({ content: maskedContent });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/code-review/fix:
 *   post:
 *     summary: Submit a code fix proposal
 *     tags: [CodeReview]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filePath
 *               - description
 *               - suggestedFix
 *             properties:
 *               filePath:
 *                 type: string
 *               description:
 *                 type: string
 *               suggestedFix:
 *                 type: string
 *               lineNumbers:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Code fix proposal submitted
 *       403:
 *         description: Not authorized
 */
// Submit a code fix
router.post('/fix', checkPermission('submit_fixes'), async (req, res) => {
    try {
        const { filePath, description, suggestedFix, lineNumbers } = req.body;
        
        // Create a code fix proposal instead of directly modifying the code
        const fix = {
            filePath,
            description,
            suggestedFix,
            lineNumbers,
            submittedBy: req.user._id,
            status: 'pending',
            createdAt: new Date()
        };
        
        // Store in database (you'll need to create a CodeFix model)
        // await CodeFix.create(fix);
        
        // Notify admins
        // await notifyAdmins('New code fix proposal', fix);
        
        res.json({ message: 'Code fix proposal submitted successfully', fix });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/code-review/errors:
 *   get:
 *     summary: Get error reports (with sensitive data masked)
 *     tags: [CodeReview]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of error reports (masked)
 *       403:
 *         description: Not authorized
 */
// Get error reports
router.get('/errors', checkPermission('view_error_reports'), async (req, res) => {
    try {
        // Get error logs but mask sensitive data
        const logs = await readErrorLogs();
        const maskedLogs = logs.map(log => ({
            ...log,
            details: maskSensitiveData(log.details)
        }));
        
        res.json({ errors: maskedLogs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper function to mask sensitive data
function maskSensitiveData(text) {
    return text
        .replace(/\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g, '[WALLET_MASKED]')
        .replace(/(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b)/g, '[EMAIL_MASKED]')
        .replace(/(password|secret|key|token)[\s:=]+["'][^"']+["']/gi, '$1="[MASKED]"');
}

module.exports = router;
