/**
 * WhatsApp Service using @whiskeysockets/baileys
 * Pure Node.js - No Chrome / Puppeteer needed!
 */
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import qrcode from 'qrcode';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import pino from 'pino';

const AUTH_DIR = path.resolve('./whatsapp-sessions');

class WhatsAppService {
  constructor() {
    this.sockets = new Map();   // tenantId -> socket
    this.qrCodes = new Map();   // tenantId -> qrDataUrl
    this.status = new Map();    // tenantId -> { state, error }
    this.retryCount = new Map();// tenantId -> count
  }

  getStatus(tenantId) {
    return {
      status: this.status.get(tenantId)?.state || 'DISCONNECTED',
      qrCode: this.qrCodes.get(tenantId) || null,
      error: this.status.get(tenantId)?.error || null,
    };
  }

  async initClient(tenantId) {
    if (this.sockets.has(tenantId)) {
      return this.getStatus(tenantId);
    }

    this.status.set(tenantId, { state: 'INITIALIZING', error: null });
    this.qrCodes.delete(tenantId);

    try {
      await this._connect(tenantId);
    } catch (err) {
      console.error(`[WhatsApp] Init error for tenant ${tenantId}:`, err.message || err);
      this.status.set(tenantId, { state: 'DISCONNECTED', error: err.message || String(err) });
    }

    return this.getStatus(tenantId);
  }

  async _connect(tenantId) {
    const sessionDir = path.join(AUTH_DIR, String(tenantId));
    if (!existsSync(sessionDir)) mkdirSync(sessionDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['Maqder ERP', 'Chrome', '1.0.0'],
      generateHighQualityLinkPreview: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
    });

    this.sockets.set(tenantId, sock);

    // Persist credentials on update
    sock.ev.on('creds.update', saveCreds);

    // Connection events
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // New QR code received
        try {
          const qrDataUrl = await qrcode.toDataURL(qr);
          this.qrCodes.set(tenantId, qrDataUrl);
          this.status.set(tenantId, { state: 'QR_READY', error: null });
          console.log(`[WhatsApp] QR ready for tenant ${tenantId}`);
        } catch (err) {
          console.error(`[WhatsApp] QR generation error for tenant ${tenantId}:`, err);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[WhatsApp] Connection closed for tenant ${tenantId}, code: ${statusCode}, reconnect: ${shouldReconnect}`);

        this.sockets.delete(tenantId);
        this.qrCodes.delete(tenantId);

        if (shouldReconnect) {
          const retries = (this.retryCount.get(tenantId) || 0) + 1;
          this.retryCount.set(tenantId, retries);

          if (retries <= 3) {
            console.log(`[WhatsApp] Reconnecting tenant ${tenantId} (attempt ${retries})...`);
            this.status.set(tenantId, { state: 'INITIALIZING', error: null });
            setTimeout(() => this._connect(tenantId).catch(console.error), 3000);
          } else {
            this.status.set(tenantId, { state: 'DISCONNECTED', error: 'Connection lost after multiple retries.' });
            this.retryCount.delete(tenantId);
          }
        } else {
          // Logged out
          this.status.set(tenantId, { state: 'DISCONNECTED', error: null });
          this.retryCount.delete(tenantId);
        }
      }

      if (connection === 'open') {
        console.log(`[WhatsApp] Connected for tenant ${tenantId}`);
        this.status.set(tenantId, { state: 'READY', error: null });
        this.qrCodes.delete(tenantId);
        this.retryCount.delete(tenantId);
      }
    });
  }

  async logout(tenantId) {
    const sock = this.sockets.get(tenantId);
    if (sock) {
      try {
        await sock.logout();
      } catch (e) {
        console.error(`[WhatsApp] Logout error for tenant ${tenantId}:`, e.message);
      }
      this.sockets.delete(tenantId);
    }
    this.qrCodes.delete(tenantId);
    this.status.set(tenantId, { state: 'DISCONNECTED', error: null });
    this.retryCount.delete(tenantId);

    // Remove session directory
    try {
      const { rm } = await import('fs/promises');
      const sessionDir = path.join(AUTH_DIR, String(tenantId));
      if (existsSync(sessionDir)) {
        await rm(sessionDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.error(`[WhatsApp] Error removing session for tenant ${tenantId}:`, e.message);
    }
  }

  async sendPdf(tenantId, phoneNumber, pdfBuffer, fileName = 'Invoice.pdf', caption = '') {
    const sock = this.sockets.get(tenantId);
    if (!sock || this.status.get(tenantId)?.state !== 'READY') {
      throw new Error('WhatsApp is not connected. Please scan the QR code first.');
    }

    const jid = this._formatJid(phoneNumber);
    await sock.sendMessage(jid, {
      document: pdfBuffer,
      fileName,
      mimetype: 'application/pdf',
      caption,
    });
    return { success: true };
  }

  async sendText(tenantId, phoneNumber, text) {
    const sock = this.sockets.get(tenantId);
    if (!sock || this.status.get(tenantId)?.state !== 'READY') {
      throw new Error('WhatsApp is not connected. Please scan the QR code first.');
    }

    const jid = this._formatJid(phoneNumber);
    await sock.sendMessage(jid, { text });
    return { success: true };
  }

  _formatJid(phoneNumber) {
    const clean = phoneNumber.replace(/\D/g, '');
    return clean.endsWith('@s.whatsapp.net') ? clean : `${clean}@s.whatsapp.net`;
  }
}

export default new WhatsAppService();
