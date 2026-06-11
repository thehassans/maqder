import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import os from 'os';

class WhatsAppService {
  constructor() {
    this.clients = new Map();
    this.qrCodes = new Map();
    this.status = new Map();
  }

  get _chromePath() {
    return this._findChrome();
  }

  _findChrome() {
    // 1. Explicit env var (set in Plesk custom environment variables)
    const envPath = process.env.CHROME_EXECUTABLE_PATH;
    if (envPath && existsSync(envPath)) {
      console.log('[WhatsApp] Chrome from env var:', envPath);
      return envPath;
    }

    // 2. Linux system paths
    const linuxPaths = [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    ];
    for (const p of linuxPaths) {
      if (existsSync(p)) {
        console.log('[WhatsApp] Chrome found at:', p);
        return p;
      }
    }

    // 3. Windows: scan puppeteer cache
    if (os.platform() === 'win32') {
      const cacheDir = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome');
      if (existsSync(cacheDir)) {
        try {
          const out = execSync(`dir "${cacheDir}" /b /s /a-d chrome.exe 2>nul`, { encoding: 'utf8', timeout: 5000 });
          const found = out.trim().split('\n').map(l => l.trim()).filter(l => l && existsSync(l))[0];
          if (found) { console.log('[WhatsApp] Chrome via scan:', found); return found; }
        } catch (_) {}
      }
    }

    // 4. Try which command (Linux)
    try {
      const found = execSync('which google-chrome-stable 2>/dev/null || which chromium-browser 2>/dev/null || echo ""', { encoding: 'utf8', timeout: 3000 }).trim();
      if (found && existsSync(found)) { console.log('[WhatsApp] Chrome via which:', found); return found; }
    } catch (_) {}

    console.warn('[WhatsApp] No Chrome found. Set CHROME_EXECUTABLE_PATH env var in Plesk.');
    return null;
  }

  getStatus(tenantId) {
    return {
      status: this.status.get(tenantId)?.state || 'DISCONNECTED',
      qrCode: this.qrCodes.get(tenantId) || null,
      error: this.status.get(tenantId)?.error || null,
    };
  }

  async initClient(tenantId) {
    if (this.clients.has(tenantId)) {
      return this.getStatus(tenantId);
    }

    this.status.set(tenantId, { state: 'INITIALIZING', error: null });

    const chromePath = this._findChrome();
    if (!chromePath) {
      const errMsg = 'No Chrome/Chromium found. Set CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome-stable in Plesk environment variables.';
      console.error('[WhatsApp]', errMsg);
      this.status.set(tenantId, { state: 'DISCONNECTED', error: errMsg });
      return this.getStatus(tenantId);
    }

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: `tenant-${tenantId}` }),
      puppeteer: {
        headless: true,
        executablePath: chromePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
    });

    this.clients.set(tenantId, client);

    client.on('qr', async (qr) => {
      console.log(`[WhatsApp] QR received for tenant ${tenantId}`);
      this.status.set(tenantId, { state: 'QR_READY', error: null });
      try {
        const qrDataUrl = await qrcode.toDataURL(qr);
        this.qrCodes.set(tenantId, qrDataUrl);
      } catch (err) {
        console.error(`[WhatsApp] QR generation error:`, err);
      }
    });

    client.on('ready', () => {
      console.log(`[WhatsApp] Ready for tenant ${tenantId}`);
      this.status.set(tenantId, { state: 'READY', error: null });
      this.qrCodes.delete(tenantId);
    });

    client.on('authenticated', () => {
      console.log(`[WhatsApp] Authenticated for tenant ${tenantId}`);
      this.status.set(tenantId, { state: 'CONNECTED', error: null });
    });

    client.on('auth_failure', (msg) => {
      console.error(`[WhatsApp] Auth failure:`, msg);
      this.status.set(tenantId, { state: 'DISCONNECTED', error: String(msg) });
      this.qrCodes.delete(tenantId);
      this.clients.delete(tenantId);
    });

    client.on('disconnected', (reason) => {
      console.log(`[WhatsApp] Disconnected:`, reason);
      this.status.set(tenantId, { state: 'DISCONNECTED', error: String(reason) });
      this.qrCodes.delete(tenantId);
      this.clients.delete(tenantId);
    });

    client.initialize().catch((err) => {
      console.error(`[WhatsApp] Init error for tenant ${tenantId}:`, err);
      const msg = err?.stack || err?.message || String(err);
      this.status.set(tenantId, { state: 'DISCONNECTED', error: msg });
      this.clients.delete(tenantId);
    });

    return this.getStatus(tenantId);
  }

  async logout(tenantId) {
    const client = this.clients.get(tenantId);
    if (client) {
      try { await client.logout(); } catch (_) {}
      this.clients.delete(tenantId);
    }
    this.qrCodes.delete(tenantId);
    this.status.set(tenantId, { state: 'DISCONNECTED', error: null });
  }

  async sendPdf(tenantId, phoneNumber, pdfBuffer, fileName = 'Invoice.pdf', caption = '') {
    const client = this.clients.get(tenantId);
    if (!client || this.status.get(tenantId)?.state !== 'READY') {
      throw new Error('WhatsApp client is not ready. Please connect first.');
    }
    let phone = phoneNumber.replace(/\D/g, '');
    if (!phone.endsWith('@c.us')) phone = `${phone}@c.us`;
    const media = new MessageMedia('application/pdf', pdfBuffer.toString('base64'), fileName);
    return await client.sendMessage(phone, media, { caption });
  }

  async sendText(tenantId, phoneNumber, text) {
    const client = this.clients.get(tenantId);
    if (!client || this.status.get(tenantId)?.state !== 'READY') {
      throw new Error('WhatsApp client is not ready. Please connect first.');
    }
    let phone = phoneNumber.replace(/\D/g, '');
    if (!phone.endsWith('@c.us')) phone = `${phone}@c.us`;
    return await client.sendMessage(phone, text);
  }
}

export default new WhatsAppService();
