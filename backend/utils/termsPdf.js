import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import os from 'os';

function findChrome() {
  const envPath = process.env.CHROME_EXECUTABLE_PATH;
  if (envPath && existsSync(envPath)) return envPath;

  const linuxPaths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
  ];
  for (const p of linuxPaths) if (existsSync(p)) return p;

  if (os.platform() === 'win32') {
    const winPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    for (const p of winPaths) if (existsSync(p)) return p;
    
    const cacheDir = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome');
    if (existsSync(cacheDir)) {
      try {
        const out = execSync(`dir "${cacheDir}" /b /s /a-d chrome.exe 2>nul`, { encoding: 'utf8', timeout: 5000 });
        const found = out.trim().split('\n').map(l => l.trim()).filter(l => l && existsSync(l))[0];
        if (found) return found;
      } catch (_) {}
    }
  }
  
  try {
    const found = execSync('which google-chrome-stable 2>/dev/null || which chromium-browser 2>/dev/null || echo ""', { encoding: 'utf8', timeout: 3000 }).trim();
    if (found && existsSync(found)) return found;
  } catch (_) {}

  return null;
}

export const generateTermsPdf = async ({ tenantName, billingCleared }) => {
  // Load Logo as Base64
  let logoBase64 = '';
  try {
    const logoPath = path.join(process.cwd(), '../frontend/public/maqderlogolandingpage.png');
    if (existsSync(logoPath)) {
      const logoBuf = await fs.readFile(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuf.toString('base64')}`;
    }
  } catch (err) {
    console.error('Failed to load logo for PDF:', err);
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #0f172a;
          line-height: 1.5;
          margin: 0;
          padding: 40px;
        }
        .header { text-align: center; margin-bottom: 20px; }
        .logo { height: 140px; margin-bottom: 10px; object-fit: contain; }
        .title { font-size: 22px; font-weight: bold; color: #1a3d28; margin: 0; }
        .subtitle { font-size: 16px; color: #475569; margin-top: 5px; }
        
        .meta { display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
        
        .status-box { padding: 12px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 15px; margin-bottom: 30px; letter-spacing: 0.5px; }
        .cleared { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .pending { background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        
        .section { margin-bottom: 24px; }
        .section-title { font-size: 18px; color: #1a3d28; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 12px; font-weight: bold; }
        
        .grid { display: flex; gap: 16px; margin-bottom: 16px; }
        .card { flex: 1; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .card h4 { margin: 0 0 8px 0; color: #1e293b; font-size: 15px; }
        .card p { margin: 0; font-size: 13px; color: #475569; }
        .ar-text { font-family: 'Arial', sans-serif; direction: rtl; display: block; color: #64748b; font-size: 12px; margin-top: 4px; }
        
        .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-bottom: 8px; }
        .badge-green { background: #10b981; color: white; }
        .badge-blue { background: #3b82f6; color: white; }
        
        ul { margin-top: 8px; margin-bottom: 8px; padding-left: 20px; font-size: 13px; color: #334155; }
        li { margin-bottom: 4px; }
        
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : `<h1 class="title">Maqder ERP</h1>`}
        <h2 class="title" style="margin-top: 10px;">Terms and Conditions</h2>
        <div class="subtitle">Annual Subscription Agreement</div>
      </div>

      <div class="meta">
        <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
        <div><strong>Tenant:</strong> ${tenantName || 'Customer'}</div>
      </div>

      <div class="status-box ${billingCleared ? 'cleared' : 'pending'}">
        BILLING STATUS: ${billingCleared ? 'CLEARED ✅' : 'PENDING ⏳'}
      </div>

      <div class="section">
        <div class="section-title">Saudi Regulatory Compliance 🇸🇦</div>
        <p style="font-size: 13px; color: #334155;">Built from the ground up for the Kingdom's regulatory, data sovereignty, and cybersecurity requirements. All data is securely stored within Saudi Arabia.</p>
        
        <div class="grid">
          <div class="card">
            <span class="badge badge-green">Active</span>
            <h4>PDPL</h4>
            <span class="ar-text">قانون حماية البيانات الشخصية</span>
            <ul>
              <li>All user/customer data stored in KSA</li>
              <li>Primary DB and backups within borders</li>
              <li>Encrypted at rest — AES-256</li>
            </ul>
          </div>
          <div class="card">
            <span class="badge badge-green">Phase 1 & 2 Ready</span>
            <h4>ZATCA</h4>
            <span class="ar-text">نظام الفوترة الإلكترونية (فاتورة)</span>
            <ul>
              <li>Encrypted XML invoice format</li>
              <li>Cryptographic stamps (QR / ECDSA)</li>
              <li>Real-time clearance via API</li>
            </ul>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <span class="badge badge-blue">ECC-1:2018</span>
            <h4>NCA Cybersecurity</h4>
            <span class="ar-text">الهيئة الوطنية للأمن السيبراني</span>
            <ul>
              <li>Data in transit: TLS 1.3</li>
              <li>IAM protocols — role-based access</li>
              <li>Full access logging & audit trails</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Cloud Infrastructure</div>
        <p style="font-size: 13px; color: #334155;">All infrastructure deployed within the Kingdom of Saudi Arabia. No customer data leaves the Kingdom.</p>
        <ul style="font-size: 13px;">
          <li><strong>Primary Application (GCP Dammam):</strong> Ultra-low latency for operations.</li>
          <li><strong>Disaster Recovery (AWS Riyadh):</strong> Secondary cross-region replication for continuity.</li>
          <li><strong>Core Database (MongoDB):</strong> VPC Peered in GCP Dammam for dynamic storage.</li>
        </ul>
      </div>

      <div class="footer">
        This is a computer-generated document and requires no physical signature.<br>
        Maqder ERP - Kingdom of Saudi Arabia
      </div>
    </body>
    </html>
  `;

  const chromePath = findChrome();
  const browser = await puppeteer.launch({
    headless: 'new',
    ...(chromePath ? { executablePath: chromePath } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
};
