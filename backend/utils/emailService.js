import nodemailer from 'nodemailer';
import SystemSettings from '../models/SystemSettings.js';

const normalizeLanguage = (language) => (language === 'ar' ? 'ar' : 'en');

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const dedupeRecipients = (...values) => {
  const seen = new Set();
  const result = [];

  values
    .flat()
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
    .forEach((value) => {
      if (seen.has(value)) return;
      seen.add(value);
      result.push(value);
    });

  return result;
};

const interpolateTemplate = (template, variables = {}) => String(template || '').replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => {
  const value = variables?.[key];
  return value === null || value === undefined ? '' : String(value);
});

const getGlobalSettings = async () => {
  const settings = await SystemSettings.findOne({ key: 'global' });
  if (settings) return settings;
  return new SystemSettings({ key: 'global', website: {}, email: {} });
};

const resolveEmailConfig = (settings) => {
  const email = settings?.email?.toObject?.() || settings?.email || {};
  const website = settings?.website?.toObject?.() || settings?.website || {};
  const smtpPort = Number(email.smtpPort || process.env.SMTP_PORT || 587);

  return {
    enabled: email.enabled === true || Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    host: String(email.smtpHost || process.env.SMTP_HOST || '').trim(),
    port: Number.isFinite(smtpPort) ? smtpPort : 587,
    secure: email.smtpSecure === true,
    user: String(email.smtpUser || process.env.SMTP_USER || '').trim(),
    pass: String(email.smtpPass || process.env.SMTP_PASS || '').trim(),
    fromName: String(email.fromName || website.brandName || 'Maqder ERP').trim(),
    fromEmail: String(email.fromEmail || email.smtpUser || process.env.SMTP_USER || '').trim(),
    replyTo: String(email.replyTo || website.contactEmail || '').trim(),
    templates: email.templates || {},
    brandName: String(website.brandName || 'Maqder ERP').trim(),
    website,
  };
};

const ensureEmailConfigured = (config) => {
  if (!config?.enabled) {
    throw new Error('Email delivery is disabled');
  }

  if (!config.host || !config.user || !config.pass || !config.fromEmail) {
    throw new Error('Email SMTP settings are incomplete');
  }
};

const buildTransporter = (config) => nodemailer.createTransport({
  host: config.host,
  port: config.port,
  secure: config.secure,
  auth: {
    user: config.user,
    pass: config.pass,
  },
});

const buildEmailShell = ({ brandName, title, body, secondaryLines = [], dir = 'ltr' }) => {
  const bodyHtml = escapeHtml(body).replace(/\r?\n/g, '<br />');
  const secondaryHtml = secondaryLines
    .filter(Boolean)
    .map((line) => `<p style="margin:0;color:#475569;font-size:13px;line-height:1.8;">${escapeHtml(line)}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 20px 45px -35px rgba(15,23,42,0.35);">
    <div style="background:linear-gradient(135deg,#1a3d28 0%,#2d5a3f 100%);padding:28px 32px;color:#ffffff;">
      <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.78;">${escapeHtml(brandName)}</div>
      <h1 style="margin:12px 0 0;font-size:24px;line-height:1.35;font-weight:700;">${escapeHtml(title)}</h1>
    </div>
    <div style="padding:32px;">
      <div style="font-size:15px;line-height:1.95;color:#1e293b;">${bodyHtml}</div>
      ${secondaryHtml ? `<div style="margin-top:24px;padding:20px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;display:grid;gap:8px;">${secondaryHtml}</div>` : ''}
    </div>
  </div>
</body>
</html>`;
};

const pickLocalizedValue = (source, language, fieldBase) => {
  const normalized = normalizeLanguage(language);
  if (normalized === 'ar') return String(source?.[`${fieldBase}Ar`] || '').trim();
  return String(source?.[`${fieldBase}En`] || '').trim();
};

const formatInvoiceTotal = (invoice) => {
  const amount = Number(invoice?.grandTotal || 0);
  const currency = String(invoice?.currency || 'SAR').trim() || 'SAR';
  if (!Number.isFinite(amount)) return `0.00 ${currency}`;
  return `${amount.toFixed(2)} ${currency}`;
};

const formatInvoiceDate = (invoice, language) => {
  const value = invoice?.issueDate ? new Date(invoice.issueDate) : new Date();
  const locale = normalizeLanguage(language) === 'ar' ? 'ar-SA' : 'en-GB';
  return Number.isNaN(value.getTime()) ? '' : value.toLocaleDateString(locale);
};

export const hasEmailAutomationAddon = (tenant) => {
  const features = Array.isArray(tenant?.subscription?.features) ? tenant.subscription.features : [];
  return features.includes('email_automation');
};

export const sendEmailMessage = async ({ to, subject, html, replyTo }) => {
  const settings = await getGlobalSettings();
  const config = resolveEmailConfig(settings);
  ensureEmailConfigured(config);

  const recipients = dedupeRecipients(to);
  if (recipients.length === 0) {
    throw new Error('Email recipient is required');
  }

  const transporter = buildTransporter(config);
  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: recipients.join(', '),
    replyTo: String(replyTo || config.replyTo || '').trim() || undefined,
    subject: String(subject || '').trim(),
    html,
  });

  return { to: recipients, from: config.fromEmail };
};

export const sendTenantWelcomeEmail = async ({ tenant, adminUser }) => {
  const settings = await getGlobalSettings();
  const config = resolveEmailConfig(settings);
  ensureEmailConfigured(config);

  const recipients = dedupeRecipients(tenant?.business?.contactEmail, adminUser?.email);
  if (recipients.length === 0) {
    return { sent: false, reason: 'missing_recipient' };
  }

  const language = normalizeLanguage(tenant?.settings?.language);
  const template = config.templates?.tenantCreated || {};
  const variables = {
    brandName: config.brandName,
    companyName: tenant?.business?.legalNameEn || tenant?.business?.legalNameAr || tenant?.name || config.brandName,
    contactName: adminUser?.firstName || tenant?.name || 'Customer',
    loginEmail: adminUser?.email || tenant?.business?.contactEmail || '',
    tenantSlug: tenant?.slug || '',
  };
  const subjectTemplate = pickLocalizedValue(template, language, 'subject') || 'Welcome to {{brandName}}';
  const bodyTemplate = pickLocalizedValue(template, language, 'body') || 'Your panel is ready.';
  const subject = interpolateTemplate(subjectTemplate, variables);
  const body = interpolateTemplate(bodyTemplate, variables);
  const html = buildEmailShell({
    brandName: config.brandName,
    title: subject,
    body,
    secondaryLines: [
      variables.loginEmail ? `${language === 'ar' ? 'البريد للدخول' : 'Login email'}: ${variables.loginEmail}` : '',
      variables.tenantSlug ? `${language === 'ar' ? 'رمز الشركة' : 'Tenant slug'}: ${variables.tenantSlug}` : '',
    ],
    dir: language === 'ar' ? 'rtl' : 'ltr',
  });

  await sendEmailMessage({ to: recipients, subject, html, replyTo: config.replyTo });
  return { sent: true, to: recipients };
};

export const sendInvoiceEmail = async ({ tenant, invoice, recipient, customerName, language }) => {
  const settings = await getGlobalSettings();
  const config = resolveEmailConfig(settings);
  ensureEmailConfigured(config);

  const tenantEmailSettings = tenant?.settings?.communication?.email || {};
  const recipients = dedupeRecipients(recipient, invoice?.buyer?.contactEmail);
  if (recipients.length === 0) {
    throw new Error('Customer email is missing');
  }

  const preferredLanguage = normalizeLanguage(language || tenant?.settings?.language);
  const systemTemplate = config.templates?.invoice || {};
  const variables = {
    brandName: config.brandName,
    companyName: tenant?.business?.legalNameEn || tenant?.business?.legalNameAr || tenant?.name || config.brandName,
    customerName: customerName || invoice?.buyer?.name || invoice?.buyer?.nameAr || 'Customer',
    invoiceNumber: invoice?.invoiceNumber || '',
    invoiceDate: formatInvoiceDate(invoice, preferredLanguage),
    invoiceTotal: formatInvoiceTotal(invoice),
    invoiceStatus: invoice?.status || '',
    transactionType: invoice?.transactionType || '',
  };

  const subjectTemplate = (preferredLanguage === 'ar'
    ? String(tenantEmailSettings.subjectAr || '').trim()
    : String(tenantEmailSettings.subjectEn || '').trim()) || pickLocalizedValue(systemTemplate, preferredLanguage, 'subject') || 'Invoice {{invoiceNumber}}';
  const bodyTemplate = (preferredLanguage === 'ar'
    ? String(tenantEmailSettings.bodyAr || '').trim()
    : String(tenantEmailSettings.bodyEn || '').trim()) || pickLocalizedValue(systemTemplate, preferredLanguage, 'body') || 'Please find your invoice.';
  const subject = interpolateTemplate(subjectTemplate, variables);
  const body = interpolateTemplate(bodyTemplate, variables);
  const senderName = String(tenantEmailSettings.senderName || config.fromName || '').trim() || config.brandName;
  const html = buildEmailShell({
    brandName: senderName,
    title: subject,
    body,
    secondaryLines: [
      `${preferredLanguage === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}: ${variables.invoiceNumber}`,
      `${preferredLanguage === 'ar' ? 'التاريخ' : 'Date'}: ${variables.invoiceDate}`,
      `${preferredLanguage === 'ar' ? 'الإجمالي' : 'Total'}: ${variables.invoiceTotal}`,
    ],
    dir: preferredLanguage === 'ar' ? 'rtl' : 'ltr',
  });

  await sendEmailMessage({
    to: recipients,
    subject,
    html,
    replyTo: String(tenantEmailSettings.replyTo || config.replyTo || '').trim() || undefined,
  });

  return { sent: true, to: recipients, language: preferredLanguage };
};

export const maskEmailSecret = (value) => {
  if (!value) return '';
  const text = String(value);
  if (text.length <= 4) return '****';
  return `${text.slice(0, 2)}***${text.slice(-2)}`;
};
