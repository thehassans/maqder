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
    this._chromePath = undefined; // undefined = not yet detected
  }

  async _getChromePath() {
    // Return cached result
    if (this._chromePath !== undefined) return this._chromePath;

    // 1. Allow explicit override via environment variable
    if (process.env.CHROME_EXECUTABLE_PATH && existsSync(process.env.CHROME_EXECUTABLE_PATH)) {
      console.log('[WhatsApp] Using CHROME_EXECUTABLE_PATH env:', process.env.CHROME_EXECUTABLE_PATH);
      this._chromePath = process.env.CHROME_EXECUTABLE_PATH;
      return this._chromePath;
    }

    // 2. Try puppeteer's bundled chrome (most reliable on any OS)
    try {
      const { default: puppeteer } = await import('puppeteer');
      const ep = puppeteer?.executablePath?.();
      if (ep && existsSync(ep)) {
        console.log('[WhatsApp] Using puppeteer bundled Chrome:', ep);
        this._chromePath = ep;
        return this._chromePath;
      }
    } catch (_) {}

    // 3. Windows: scan puppeteer cache directory
    if (os.platform() === 'win32') {
      const cacheDir = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome');
      if (existsSync(cacheDir)) {
        try {
          const result = execSync(`dir "${cacheDir}" /b /s /a-d chrome.exe 2>nul`, {
            encoding: 'utf8',
            timeout: 5000,
          });
          const found = result.trim().split('\n').map(l => l.trim()).filter(l => l && existsSync(l))[0];
          if (found) {
            console.log('[WhatsApp] Found Chrome via dir scan:', found);
            this._chromePath = found;
            return this._chromePath;
          }
        } catch (_) {}
      }

      // Windows system installs
      const systemPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      ];
      for (const p of systemPaths) {
        if (existsSync(p)) {
          console.log('[WhatsApp] Found system Chrome (Windows):', p);
          this._chromePath = p;
          return this._chromePath;
        }
      }
    }

    // 4. Linux system paths
    const linuxPaths = [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    ];
    for (const p of linuxPaths) {
      if (existsSync(p)) {
        console.log('[WhatsApp] Found system Chrome (Linux):', p);
        this._chromePath = p;
        return this._chromePath;
      }
    }

    console.warn('[WhatsApp] Could not find Chrome. Will let puppeteer-core use its default.');
    this._chromePath = null;
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

    const chromePath = await this._getChromePath();

    const puppeteerConfig = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    };

    if (chromePath) {
      puppeteerConfig.executablePath = chromePath;
    }

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: `tenant-${tenantId}` }),
      puppeteer: puppeteerConfig,
    });

    this.clients.set(tenantId, client);

    client.on('qr', async (qr) => {
      this.status.set(tenantId, { state: 'QR_READY', error: null });
      try {
        const qrDataUrl = await qrcode.toDataURL(qr);
        this.qrCodes.set(tenantId, qrDataUrl);
        console.log(`[WhatsApp] QR ready for tenant ${tenantId}`);
      } catch (err) {
        console.error(`[WhatsApp] QR generation error for tenant ${tenantId}:`, err);
      }
    });

    client.on('ready', () => {
      console.log(`[WhatsApp] Client ready for tenant ${tenantId}`);
      this.status.set(tenantId, { state: 'READY', error: null });
      this.qrCodes.delete(tenantId);
    });

    client.on('authenticated', () => {
      console.log(`[WhatsApp] Authenticated for tenant ${tenantId}`);
      this.status.set(tenantId, { state: 'CONNECTED', error: null });
    });

    client.on('auth_failure', (msg) => {
      console.error(`[WhatsApp] Auth failure for tenant ${tenantId}:`, msg);
      this.status.set(tenantId, { state: 'DISCONNECTED', error: String(msg) });
      this.qrCodes.delete(tenantId);
      this.clients.delete(tenantId);
    });

    client.on('disconnected', (reason) => {
      console.log(`[WhatsApp] Disconnected for tenant ${tenantId}:`, reason);
      this.status.set(tenantId, { state: 'DISCONNECTED', error: String(reason) });
      this.qrCodes.delete(tenantId);
      this.clients.delete(tenantId);
    });

    client.initialize().catch((err) => {
      console.error(`[WhatsApp] Initialization error for tenant ${tenantId}:`, err);
      const errorString =
        err?.message ||
        (typeof err === 'object'
          ? JSON.stringify(err, Object.getOwnPropertyNames(err))
          : String(err));
      this.status.set(tenantId, { state: 'DISCONNECTED', error: errorString || 'Unknown initialization error' });
      this.clients.delete(tenantId);
    });

    return this.getStatus(tenantId);
  }

  async logout(tenantId) {
    const client = this.clients.get(tenantId);
    if (client) {
      try {
        await client.logout();
      } catch (e) {
        console.error(`[WhatsApp] Error logging out tenant ${tenantId}`, e);
      }
      this.clients.delete(tenantId);
      this.qrCodes.delete(tenantId);
      this.status.set(tenantId, { state: 'DISCONNECTED', error: null });
    }
  }

  async sendPdf(tenantId, phoneNumber, pdfBuffer, fileName = 'Invoice.pdf', caption = '') {
    const client = this.clients.get(tenantId);
    if (!client || this.status.get(tenantId)?.state !== 'READY') {
      throw new Error('WhatsApp client is not ready. Please connect WhatsApp first.');
    }

    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.endsWith('@c.us')) {
      formattedPhone = `${formattedPhone}@c.us`;
    }

    const media = new MessageMedia('application/pdf', pdfBuffer.toString('base64'), fileName);
    return await client.sendMessage(formattedPhone, media, { caption });
  }

  async sendText(tenantId, phoneNumber, text) {
    const client = this.clients.get(tenantId);
    if (!client || this.status.get(tenantId)?.state !== 'READY') {
      throw new Error('WhatsApp client is not ready. Please connect WhatsApp first.');
    }

    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.endsWith('@c.us')) {
      formattedPhone = `${formattedPhone}@c.us`;
    }

    return await client.sendMessage(formattedPhone, text);
  }
}

export default new WhatsAppService();
