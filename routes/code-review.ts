import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { verifyToken, checkPermission } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(verifyToken as any);

export default router;
