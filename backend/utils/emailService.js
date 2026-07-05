import SystemSettings from '../models/SystemSettings.js';
import logger from './logger.js';
import { ensureEmailDeliveryConfig, sendEmailWithConfig } from './emailProviderService.js';
import { generateTermsPdf } from './termsPdf.js';

const normalizeLanguage = (language) => {
  if (language === 'ar') return 'ar';
  if (language === 'en') return 'en';
  return null;
};

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

const resolveEmailConfig = (settings, options = {}) => {
  const { allowEnvFallback = true } = options;
  const email = settings?.email?.toObject?.() || settings?.email || {};
  const website = settings?.website?.toObject?.() || settings?.website || {};
  const smtpPort = Number(email.smtpPort || (allowEnvFallback ? process.env.SMTP_PORT : '') || 587);
  const provider = String(email.provider || (allowEnvFallback ? process.env.EMAIL_PROVIDER : '') || 'smtp').trim().toLowerCase() === 'brevo' ? 'brevo' : 'smtp';
  const brevoApiKey = String(email.brevoApiKey || (allowEnvFallback ? process.env.BREVO_API_KEY : '') || '').trim();
  const hasProviderCredentials = provider === 'brevo'
    ? Boolean(brevoApiKey)
    : Boolean(
        String(email.smtpHost || (allowEnvFallback ? process.env.SMTP_HOST : '') || '').trim()
        && String(email.smtpUser || (allowEnvFallback ? process.env.SMTP_USER : '') || '').trim()
        && String(email.smtpPass || (allowEnvFallback ? process.env.SMTP_PASS : '') || '').trim()
      );

  return {
    enabled: email.enabled === true || (allowEnvFallback && hasProviderCredentials),
    provider,
    host: String(email.smtpHost || (allowEnvFallback ? process.env.SMTP_HOST : '') || '').trim(),
    port: Number.isFinite(smtpPort) ? smtpPort : 587,
    secure: email.smtpSecure === true,
    user: String(email.smtpUser || (allowEnvFallback ? process.env.SMTP_USER : '') || '').trim(),
    pass: String(email.smtpPass || (allowEnvFallback ? process.env.SMTP_PASS : '') || '').trim(),
    brevoApiKey,
    fromName: String(email.fromName || website.brandName || 'Maqder ERP').trim(),
    fromEmail: String(email.fromEmail || email.smtpUser || (allowEnvFallback ? process.env.SMTP_USER : '') || '').trim(),
    replyTo: String(email.replyTo || website.contactEmail || '').trim(),
    templates: email.templates || {},
    brandName: String(website.brandName || 'Maqder ERP').trim(),
    website,
  };
};

const ensureEmailConfigured = (config) => {
  ensureEmailDeliveryConfig(config, { context: 'Email delivery' });
};

const buildSecondaryLinesHtml = (secondaryLines = []) => secondaryLines
  .filter(Boolean)
  .map((line) => `<p style="margin:0;color:#475569;font-size:13px;line-height:1.8;">${escapeHtml(line)}</p>`)
  .join('');

const buildEmailShell = ({ brandName, title, body, secondaryLines = [], dir = 'ltr' }) => {
  const bodyHtml = escapeHtml(body).replace(/\r?\n/g, '<br />');
  const secondaryHtml = buildSecondaryLinesHtml(secondaryLines);

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

const buildBilingualEmailShell = ({ brandName, title, sections = [] }) => {
  const sectionsHtml = sections
    .filter((section) => section?.body)
    .map((section) => {
      const dir = section.dir === 'rtl' ? 'rtl' : 'ltr';
      const align = dir === 'rtl' ? 'right' : 'left';
      const secondaryHtml = buildSecondaryLinesHtml(section.secondaryLines || []);
      return `<section dir="${dir}" style="padding:24px 0;text-align:${align};${dir === 'rtl' ? 'font-family:Tahoma,Arial,sans-serif;' : ''}">
        <h2 style="margin:0 0 12px;font-size:20px;line-height:1.5;color:#0f172a;">${escapeHtml(section.title || '')}</h2>
        <div style="font-size:15px;line-height:1.95;color:#1e293b;">${escapeHtml(section.body).replace(/\r?\n/g, '<br />')}</div>
        ${secondaryHtml ? `<div style="margin-top:20px;padding:18px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;display:grid;gap:8px;">${secondaryHtml}</div>` : ''}
      </section>`;
    })
    .join('<div style="height:1px;background:#e2e8f0;"></div>');

  return `<!DOCTYPE html>
<html dir="ltr">
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
    <div style="padding:0 32px;">${sectionsHtml}</div>
  </div>
</body>
</html>`;
};

const pickLocalizedValue = (source, language, fieldBase) => {
  const normalized = normalizeLanguage(language);
  if (normalized === 'ar') return String(source?.[`${fieldBase}Ar`] || '').trim();
  return String(source?.[`${fieldBase}En`] || '').trim();
};

const uniqueValues = (...values) => {
  const seen = new Set();
  const result = [];

  values
    .flat()
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .forEach((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      result.push(value);
    });

  return result;
};

const resolveLocalizedContactName = (adminUser, tenant, language) => {
  if (language === 'ar') {
    const fullNameAr = `${String(adminUser?.firstNameAr || '').trim()} ${String(adminUser?.lastNameAr || '').trim()}`.trim();
    if (fullNameAr) return fullNameAr;
  }

  const fullNameEn = `${String(adminUser?.firstName || '').trim()} ${String(adminUser?.lastName || '').trim()}`.trim();
  if (fullNameEn) return fullNameEn;

  if (language === 'ar') {
    return String(tenant?.business?.legalNameAr || tenant?.name || 'العميل').trim();
  }

  return String(tenant?.business?.legalNameEn || tenant?.name || 'Customer').trim();
};

const buildTenantWelcomeVariables = ({ tenant, adminUser, brandName, language }) => ({
  brandName: String(brandName || 'Maqder ERP').trim(),
  companyName: language === 'ar'
    ? String(tenant?.business?.legalNameAr || tenant?.business?.legalNameEn || tenant?.name || brandName || 'Maqder ERP').trim()
    : String(tenant?.business?.legalNameEn || tenant?.business?.legalNameAr || tenant?.name || brandName || 'Maqder ERP').trim(),
  contactName: resolveLocalizedContactName(adminUser, tenant, language),
  loginEmail: String(adminUser?.email || tenant?.business?.contactEmail || '').trim(),
  tenantSlug: String(tenant?.slug || '').trim(),
});

const buildTenantWelcomeSecondaryLines = (variables, language) => uniqueValues(
  variables.loginEmail ? `${language === 'ar' ? 'البريد للدخول' : 'Login email'}: ${variables.loginEmail}` : '',
  variables.tenantSlug ? `${language === 'ar' ? 'رمز الشركة' : 'Tenant slug'}: ${variables.tenantSlug}` : ''
);

const buildLocalizedTenantWelcomeMessage = ({ template, brandName, tenant, adminUser, language }) => {
  const normalizedLanguage = normalizeLanguage(language) || 'en';
  const variables = buildTenantWelcomeVariables({ tenant, adminUser, brandName, language: normalizedLanguage });
  const subjectTemplate = pickLocalizedValue(template, normalizedLanguage, 'subject')
    || (normalizedLanguage === 'ar' ? 'مرحباً بك في {{brandName}}' : 'Welcome to {{brandName}}');
  const bodyTemplate = pickLocalizedValue(template, normalizedLanguage, 'body')
    || (normalizedLanguage === 'ar' ? 'لوحتك جاهزة.' : 'Your panel is ready.');
  const subject = interpolateTemplate(subjectTemplate, variables);
  const body = interpolateTemplate(bodyTemplate, variables);

  return {
    subject,
    html: buildEmailShell({
      brandName: variables.brandName,
      title: subject,
      body,
      secondaryLines: buildTenantWelcomeSecondaryLines(variables, normalizedLanguage),
      dir: normalizedLanguage === 'ar' ? 'rtl' : 'ltr',
    }),
    language: normalizedLanguage,
  };
};

const buildBilingualTenantWelcomeMessage = ({ template, brandName, tenant, adminUser }) => {
  const english = buildLocalizedTenantWelcomeMessage({ template, brandName, tenant, adminUser, language: 'en' });
  const arabic = buildLocalizedTenantWelcomeMessage({ template, brandName, tenant, adminUser, language: 'ar' });
  const subject = uniqueValues(english.subject, arabic.subject).join(' | ') || brandName;

  return {
    subject,
    html: buildBilingualEmailShell({
      brandName,
      title: subject,
      sections: [
        {
          title: english.subject,
          body: interpolateTemplate(pickLocalizedValue(template, 'en', 'body') || 'Your panel is ready.', buildTenantWelcomeVariables({ tenant, adminUser, brandName, language: 'en' })),
          secondaryLines: buildTenantWelcomeSecondaryLines(buildTenantWelcomeVariables({ tenant, adminUser, brandName, language: 'en' }), 'en'),
          dir: 'ltr',
        },
        {
          title: arabic.subject,
          body: interpolateTemplate(pickLocalizedValue(template, 'ar', 'body') || 'لوحتك جاهزة.', buildTenantWelcomeVariables({ tenant, adminUser, brandName, language: 'ar' })),
          secondaryLines: buildTenantWelcomeSecondaryLines(buildTenantWelcomeVariables({ tenant, adminUser, brandName, language: 'ar' }), 'ar'),
          dir: 'rtl',
        },
      ],
    }),
    language: 'bilingual',
  };
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
  if (tenant?.subscription?.hasEmailAddon === true) return true;
  const features = Array.isArray(tenant?.subscription?.features) ? tenant.subscription.features : [];
  return features.includes('email_automation');
};

export const sendEmailMessage = async ({ to, subject, html, replyTo, config: providedConfig }) => {
  const settings = providedConfig ? null : await getGlobalSettings();
  const config = providedConfig || resolveEmailConfig(settings);
  ensureEmailConfigured(config);

  const recipients = dedupeRecipients(to);
  if (recipients.length === 0) {
    throw new Error('Email recipient is required');
  }

  const delivery = await sendEmailWithConfig({
    config,
    to: recipients,
    subject,
    html,
    replyTo: String(replyTo || config.replyTo || '').trim() || undefined,
  });

  return { to: recipients, from: config.fromEmail, provider: delivery.provider, providerMessageId: delivery.providerMessageId };
};

export const sendTenantOnboardingEmail = async ({ tenant, adminUser, rawPassword, personalEmail, billingCleared, preferredLanguage } = {}) => {
  try {
    const settings = await getGlobalSettings();
    const config = resolveEmailConfig(settings, { allowEnvFallback: false });

    if (!config.enabled) {
      return { sent: false, reason: 'email_disabled' };
    }

    ensureEmailConfigured(config);

    const recipients = dedupeRecipients(personalEmail, tenant?.business?.contactEmail || '', adminUser?.email || '');
    if (recipients.length === 0) {
      return { sent: false, reason: 'missing_recipient' };
    }

    const brandName = config.brandName;
    const loginUrl = 'https://maqder.com/login';
    const subject = `Welcome to the ${brandName} Family!`;

    const htmlBody = `
      <p>Hello ${adminUser?.firstName || 'Customer'},</p>
      <p>Welcome to <strong>${brandName}</strong>! Your account has been successfully created.</p>
      <p>Here are your login credentials:</p>
      <ul>
        <li><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></li>
        <li><strong>Email:</strong> ${adminUser?.email}</li>
        <li><strong>Password:</strong> ${rawPassword}</li>
      </ul>
      ${billingCleared ? '<p style="color: #16a34a; font-weight: bold; margin-top: 20px;">Your billing amount has been cleared successfully!</p>' : ''}
      <p>If you have any questions, feel free to reply to this email.</p>
    `;

    const fullHtml = buildEmailShell({
      brandName,
      title: subject,
      htmlBody: htmlBody,
      dir: 'ltr'
    });

    let attachments = [];
    if (billingCleared) {
      const pdfBuffer = await generateTermsPdf({ tenantName: tenant.name, billingCleared: true });
      attachments.push({
        filename: 'Terms_and_Conditions.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }

    await sendEmailWithConfig({
      config,
      to: recipients,
      subject,
      html: fullHtml,
      replyTo: config.replyTo,
      attachments
    });

    return { sent: true, to: recipients };
  } catch (error) {
    logger.error(`Failed to send tenant onboarding email: ${error.message}`);
    return { sent: false, reason: 'send_failed', error: error.message };
  }
};

export const sendTenantWelcomeEmail = async ({ tenant, adminUser, preferredLanguage } = {}) => {
  try {
    const settings = await getGlobalSettings();
    const config = resolveEmailConfig(settings, { allowEnvFallback: false });

    if (!config.enabled) {
      return { sent: false, reason: 'email_disabled' };
    }

    ensureEmailConfigured(config);

    const recipients = dedupeRecipients(tenant?.business?.contactEmail || '', adminUser?.email || '');
    if (recipients.length === 0) {
      return { sent: false, reason: 'missing_recipient' };
    }

    const template = config.templates?.tenantCreated || {};
    const explicitLanguage = normalizeLanguage(preferredLanguage);
    const message = explicitLanguage
      ? buildLocalizedTenantWelcomeMessage({ template, brandName: config.brandName, tenant, adminUser, language: explicitLanguage })
      : buildBilingualTenantWelcomeMessage({ template, brandName: config.brandName, tenant, adminUser });

    await sendEmailMessage({
      to: recipients,
      subject: message.subject,
      html: message.html,
      replyTo: config.replyTo,
      config,
    });

    return { sent: true, to: recipients, language: message.language };
  } catch (error) {
    logger.error(`Failed to send tenant welcome email: ${error.message}`);
    return { sent: false, reason: 'send_failed', error: error.message };
  }
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
  const senderEmail = String(tenantEmailSettings.fromEmail || config.fromEmail || '').trim() || config.fromEmail;
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
    config: {
      ...config,
      fromName: senderName,
      fromEmail: senderEmail,
    },
  });

  return { sent: true, to: recipients, language: preferredLanguage };
};

export const sendDemoWelcomeEmail = async ({ email, tenant, businessType, trialEndDate, password, preferredLanguage } = {}) => {
  try {
    const settings = await getGlobalSettings();
    const config = resolveEmailConfig(settings, { allowEnvFallback: false });

    if (!config.enabled) {
      return { sent: false, reason: 'email_disabled' };
    }

    ensureEmailConfigured(config);

    const recipients = dedupeRecipients(email);
    if (recipients.length === 0) {
      return { sent: false, reason: 'missing_recipient' };
    }

    const brandName = config.brandName;
    const salesEmail = String(settings?.email?.salesEmail || config.replyTo || config.fromEmail || '').trim();
    const loginUrl = 'https://maqder.com/login';
    const trialEndStr = trialEndDate
      ? new Date(trialEndDate).toLocaleDateString(preferredLanguage === 'ar' ? 'ar-SA' : 'en-GB')
      : '';

    const subject = preferredLanguage === 'ar'
      ? `مرحباً بك في ${brandName} — تجربتك المجانية جاهزة!`
      : `Welcome to ${brandName} — Your Free Trial is Ready!`;

    const bodyEn = `Hello,

Welcome to ${brandName}! Your 7-day free demo account has been created successfully.

Here are your account details:
• Login URL: ${loginUrl}
• Email: ${email}
• Password: ${password}
• Business Type: ${businessType}
• Trial Expires: ${trialEndStr}

Keep this email safe — you'll need these credentials to log back in.

During your trial, you'll have full access to all features. If you have any questions, our sales team is here to help — just reply to this email.

Ready to upgrade? Click "Get Full Version" in your dashboard header to continue your journey with ${brandName}.

Best regards,
The ${brandName} Sales Team`;

    const bodyAr = `مرحباً بك،

تم إنشاء حسابك التجريبي المجاني لمدة 7 أيام في ${brandName} بنجاح.

تفاصيل حسابك:
• رابط الدخول: ${loginUrl}
• البريد الإلكتروني: ${email}
• كلمة المرور: ${password}
• نوع النشاط: ${businessType}
• تنتهي التجربة في: ${trialEndStr}

احتفظ بهذا البريد — ستحتاج هذه البيانات لتسجيل الدخول مرة أخرى.

خلال فترة التجربة، سيكون لديك وصول كامل لجميع الميزات. إذا كان لديك أي أسئلة، فريق المبيعات لدينا جاهز لمساعدتك — فقط قم بالرد على هذا البريد.

جاهز للترقية؟ اضغط على "احصل على النسخة الكاملة" في رأس لوحة التحكم لمتابعة رحلتك مع ${brandName}.

مع تحيات،
فريق مبيعات ${brandName}`;

    const html = buildBilingualEmailShell({
      brandName,
      title: subject,
      sections: [
        {
          title: `Welcome to ${brandName}`,
          body: bodyEn,
          dir: 'ltr',
        },
        {
          title: `مرحباً بك في ${brandName}`,
          body: bodyAr,
          dir: 'rtl',
        },
      ],
    });

    await sendEmailWithConfig({
      config,
      to: recipients,
      subject,
      html,
      replyTo: salesEmail || config.replyTo,
    });

    return { sent: true, to: recipients };
  } catch (error) {
    logger.error(`Failed to send demo welcome email: ${error.message}`);
    return { sent: false, reason: 'send_failed', error: error.message };
  }
};

export const sendUpgradeWelcomeEmail = async ({ email, tenant, plan, billingCycle, amount, currency = 'SAR', preferredLanguage } = {}) => {
  try {
    const settings = await getGlobalSettings();
    const config = resolveEmailConfig(settings, { allowEnvFallback: false });

    if (!config.enabled) {
      return { sent: false, reason: 'email_disabled' };
    }

    ensureEmailConfigured(config);

    const recipients = dedupeRecipients(email);
    if (recipients.length === 0) {
      return { sent: false, reason: 'missing_recipient' };
    }

    const brandName = config.brandName;
    const salesEmail = String(settings?.email?.salesEmail || config.replyTo || config.fromEmail || '').trim();
    const loginUrl = 'https://maqder.com/login';
    const planName = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Professional';
    const cycleLabel = billingCycle === 'yearly' ? 'Annual' : 'Monthly';
    const amountStr = amount ? `${amount} ${currency}` : '';
    const now = new Date();
    const startDate = now.toLocaleDateString(preferredLanguage === 'ar' ? 'ar-SA' : 'en-GB');
    const endDate = new Date(now.getTime() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);
    const endDateStr = endDate.toLocaleDateString(preferredLanguage === 'ar' ? 'ar-SA' : 'en-GB');

    const subject = preferredLanguage === 'ar'
      ? `مرحباً بك في ${brandName} — تم تفعيل اشتراكك!`
      : `Welcome to ${brandName} — Your Subscription is Active!`;

    const bodyEn = `Dear ${tenant?.name || 'Valued Customer'},

Congratulations and welcome to the full version of ${brandName}!

Your subscription has been activated successfully. Here are your subscription details:
• Plan: ${planName}
• Billing Cycle: ${cycleLabel}
• Amount: ${amountStr}
• Start Date: ${startDate}
• Next Renewal: ${endDateStr}

You now have full access to all features:
• ZATCA Phase 2 E-Invoicing
• HR & Payroll Management
• Inventory & Warehouse
• Advanced Reports & Analytics
• And much more!

Login URL: ${loginUrl}

If you have any questions or need assistance, our support team is here to help — just reply to this email.

Thank you for choosing ${brandName}!

Best regards,
The ${brandName} Team`;

    const bodyAr = `عميلنا العزيز ${tenant?.name || ''}،

تهانينا ومرحباً بك في النسخة الكاملة من ${brandName}!

تم تفعيل اشتراكك بنجاح. إليك تفاصيل اشتراكك:
• الباقة: ${planName}
• دورة الفوترة: ${billingCycle === 'yearly' ? 'سنوية' : 'شهرية'}
• المبلغ: ${amountStr}
• تاريخ البدء: ${startDate}
• تاريخ التجديد القادم: ${endDateStr}

لديك الآن وصول كامل لجميع الميزات:
• الفوترة الإلكترونية المتوافقة مع هيئة الزكاة والضريبة والجمارك
• إدارة الموارد البشرية والرواتب
• المخزون والمستودعات
• تقارير وتحليلات متقدمة
• والمزيد!

رابط الدخول: ${loginUrl}

إذا كان لديك أي أسئلة أو تحتاج مساعدة، فريق الدعم لدينا جاهز لمساعدتك — فقط قم بالرد على هذا البريد.

شكراً لاختيارك ${brandName}!

مع تحيات،
فريق ${brandName}`;

    const html = buildBilingualEmailShell({
      brandName,
      title: subject,
      sections: [
        { title: `Welcome to ${brandName} — Subscription Active`, body: bodyEn, dir: 'ltr' },
        { title: `مرحباً بك في ${brandName} — اشتراك مفعّل`, body: bodyAr, dir: 'rtl' },
      ],
    });

    await sendEmailWithConfig({
      config,
      to: recipients,
      subject,
      html,
      replyTo: salesEmail || config.replyTo,
    });

    return { sent: true, to: recipients };
  } catch (error) {
    logger.error(`Failed to send upgrade welcome email: ${error.message}`);
    return { sent: false, reason: 'send_failed', error: error.message };
  }
};

export const maskEmailSecret = (value) => {
  if (!value) return '';
  const text = String(value);
  if (text.length <= 4) return '****';
  return `${text.slice(0, 2)}***${text.slice(-2)}`;
};

export const sendPasswordResetEmail = async ({ user, resetUrl, personalEmail } = {}) => {
  try {
    const settings = await getGlobalSettings();
    const config = resolveEmailConfig(settings, { allowEnvFallback: false });

    if (!config.enabled) {
      return { sent: false, reason: 'email_disabled' };
    }

    ensureEmailConfigured(config);

    const recipients = dedupeRecipients(personalEmail, user.email);
    if (recipients.length === 0) {
      return { sent: false, reason: 'missing_recipient' };
    }

    const brandName = config.brandName;
    const subject = `Password Reset Request - ${brandName}`;

    const htmlBody = `
      <p>Hello ${user.firstName || 'User'},</p>
      <p>We received a request to reset your password for your <strong>${brandName}</strong> account.</p>
      <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
      <div style="margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
      <p>Thanks,<br/>The ${brandName} Team</p>
    `;

    const fullHtml = buildEmailShell({
      brandName,
      title: subject,
      htmlBody: htmlBody,
      dir: 'ltr'
    });

    await sendEmailWithConfig({
      config,
      to: recipients,
      subject,
      html: fullHtml,
    });

    return { sent: true };
  } catch (error) {
    console.error('[EmailService] Failed to send password reset email:', error);
    return { sent: false, reason: 'error', details: error.message };
  }
};
