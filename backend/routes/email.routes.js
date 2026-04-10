import express from 'express';
import mongoose from 'mongoose';
import Tenant from '../models/Tenant.js';
import EmailMessage from '../models/EmailMessage.js';
import { protect, tenantFilter, authorize, checkEmailAddon } from '../middleware/auth.js';
import { listEmailMessages, createDraftMessage, sendTenantEmail, serializeTenantEmailSettings } from '../utils/tenantEmailService.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);
router.use(checkEmailAddon);

router.get('/settings', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({ email: serializeTenantEmailSettings(tenant) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings', authorize('admin'), async (req, res) => {
  return res.status(403).json({ error: 'Tenant email settings can only be updated from the super admin panel' });
});

router.get('/messages', async (req, res) => {
  try {
    const result = await listEmailMessages({
      tenantId: new mongoose.Types.ObjectId(req.user.tenantId),
      folder: req.query.folder,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/messages/:id', async (req, res) => {
  try {
    const message = await EmailMessage.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!message) {
      return res.status(404).json({ error: 'Email message not found' });
    }

    if (!message.isRead && message.type === 'inbox') {
      message.isRead = true;
      await message.save();
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/messages/:id/read', async (req, res) => {
  try {
    const message = await EmailMessage.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!message) {
      return res.status(404).json({ error: 'Email message not found' });
    }

    message.isRead = req.body?.isRead !== false;
    await message.save();
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/send', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const payload = req.body || {};
    if (payload.saveAsDraft === true) {
      const draft = await createDraftMessage({
        tenantId: tenant._id,
        payload: {
          ...payload,
          from: payload.from || tenant.settings?.communication?.email?.fromEmail || tenant.settings?.communication?.email?.requestedSenderEmail || tenant.business?.contactEmail || '',
          metadata: { purpose: 'manual_compose' },
        },
      });
      return res.status(201).json({ success: true, draft });
    }

    const delivery = await sendTenantEmail({
      tenant,
      to: payload.to,
      cc: payload.cc,
      bcc: payload.bcc,
      subject: payload.subject,
      html: payload.bodyHtml,
      text: payload.bodyText,
      attachments: payload.attachments || [],
      metadata: { purpose: 'manual_compose' },
    });

    res.status(201).json({ success: true, delivery });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
