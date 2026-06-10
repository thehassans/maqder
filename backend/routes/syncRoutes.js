import express from 'express';
import { ingestSyncItem } from '../controllers/syncController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All sync endpoints require authentication
router.use(protect);

// Ingest an offline-generated item
router.post('/ingest', ingestSyncItem);

export default router;
