import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode';

class WhatsAppService {
  constructor() {
    this.clients = new Map();
    this.qrCodes = new Map();
    this.status = new Map();
  }

  getStatus(tenantId) {
    return {
      status: this.status.get(tenantId) || 'DISCONNECTED',
      qrCode: this.qrCodes.get(tenantId) || null,
    };
  }

  async initClient(tenantId) {
    if (this.clients.has(tenantId)) {
      return this.getStatus(tenantId);
    }

    this.status.set(tenantId, 'INITIALIZING');
    
    // Use LocalAuth to persist session per tenant
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: `tenant-${tenantId}` }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    this.clients.set(tenantId, client);

    client.on('qr', async (qr) => {
      this.status.set(tenantId, 'QR_READY');
      try {
        const qrDataUrl = await qrcode.toDataURL(qr);
        this.qrCodes.set(tenantId, qrDataUrl);
      } catch (err) {
        console.error(`QR generation error for tenant ${tenantId}:`, err);
      }
    });

    client.on('ready', () => {
      console.log(`WhatsApp Client is ready for tenant ${tenantId}!`);
      this.status.set(tenantId, 'READY');
      this.qrCodes.delete(tenantId);
    });

    client.on('authenticated', () => {
      console.log(`WhatsApp Authenticated for tenant ${tenantId}`);
      this.status.set(tenantId, 'CONNECTED');
    });

    client.on('auth_failure', msg => {
      console.error(`WhatsApp Auth failure for tenant ${tenantId}:`, msg);
      this.status.set(tenantId, 'DISCONNECTED');
      this.qrCodes.delete(tenantId);
      this.clients.delete(tenantId);
    });

    client.on('disconnected', (reason) => {
      console.log(`WhatsApp Client was disconnected for tenant ${tenantId}:`, reason);
      this.status.set(tenantId, 'DISCONNECTED');
      this.qrCodes.delete(tenantId);
      this.clients.delete(tenantId);
    });

    client.initialize().catch(err => {
      console.error(`WhatsApp Client initialization error for tenant ${tenantId}:`, err);
      this.status.set(tenantId, 'DISCONNECTED');
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
        console.error(`Error logging out tenant ${tenantId}`, e);
      }
      this.clients.delete(tenantId);
      this.qrCodes.delete(tenantId);
      this.status.set(tenantId, 'DISCONNECTED');
    }
  }

  async sendPdf(tenantId, phoneNumber, pdfBuffer, fileName = 'Invoice.pdf', caption = '') {
    const client = this.clients.get(tenantId);
    if (!client || this.status.get(tenantId) !== 'READY') {
      throw new Error('WhatsApp client is not ready. Please connect WhatsApp first.');
    }

    // Format phone number to WhatsApp format (e.g., 966xxxxxxxxx@c.us)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.endsWith('@c.us')) {
      formattedPhone = `${formattedPhone}@c.us`;
    }

    const media = new MessageMedia('application/pdf', pdfBuffer.toString('base64'), fileName);
    return await client.sendMessage(formattedPhone, media, { caption });
  }

  async sendText(tenantId, phoneNumber, text) {
    const client = this.clients.get(tenantId);
    if (!client || this.status.get(tenantId) !== 'READY') {
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
