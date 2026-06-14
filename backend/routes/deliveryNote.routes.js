import express from 'express';
import { protect, tenantFilter, checkPermission } from '../middleware/auth.js';
import { createDeliveryNoteFromPO } from '../controllers/deliveryNoteController.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);

// @route   POST /api/delivery-notes
router.post('/', checkPermission('invoicing', 'create'), createDeliveryNoteFromPO);

export default router;
