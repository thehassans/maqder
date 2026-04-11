import axios from 'axios';
import nodemailer from 'nodemailer';

const BREVO_API_BASE_URL = 'https://api.brevo.com/v3';

const normalizeProvider = (value) => {
  const normalized = String(value || 'smtp').trim().toLowerCase();
  if (normalized === 'brevo') return 'brevo';
  if (normalized === 'custom_smtp') return 'custom_smtp';
  return 'smtp';
};

const toAddressList = (...values) => {
  const seen = new Set();
  const list = [];

  values.flat().forEach((value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    list.push(normalized);
  });

  return list;
};

const normalizeAttachment = (attachment = {}) => {
  const rawContent = attachment.content;
  const bufferContent = Buffer.isBuffer(rawContent)
    ? rawContent
    : (rawContent instanceof Uint8Array ? Buffer.from(rawContent) : null);
  const contentBase64 = String(attachment.contentBase64 || attachment.base64 || '').trim()
    || (bufferContent ? bufferContent.toString('base64') : '');

  return {
    filename: String(attachment.filename || attachment.name || 'attachment').trim(),
    content: bufferContent,
    contentBase64,
    contentType: String(attachment.contentType || attachment.type || 'application/octet-stream').trim(),
    contentId: String(attachment.contentId || '').trim(),
    url: String(attachment.url || attachment.path || '').trim(),
  };
};

const mapBrevoRecipients = (values = []) => toAddressList(values).map((email) => ({ email }));

const mapBrevoAttachments = (attachments = []) => attachments
  .map(normalizeAttachment)
  .filter((attachment) => attachment.filename && attachment.contentBase64)
  .map((attachment) => ({
    name: attachment.filename,
    content: attachment.contentBase64,
  }));

const resolveProviderErrorMessage = (error, fallbackMessage) => {
  const responseData = error?.response?.data;
  return responseData?.message
    || responseData?.code
    || responseData?.error
    || error?.message
    || fallbackMessage;
};

export const resolveSmtpTransportOptions = (config) => {
  const port = Number(config?.port || 587);
  const normalizedPort = Number.isFinite(port) ? port : 587;
  const useImplicitSsl = normalizedPort === 465;

  return {
    host: config.host,
    port: normalizedPort,
    secure: useImplicitSsl,
    requireTLS: !useImplicitSsl && (config?.secure === true || normalizedPort === 587),
    auth: {
      user: config.user,
      pass: config.pass,
    },
  };
};

export const ensureEmailDeliveryConfig = (config, { requireEnabled = true, context = 'Email delivery' } = {}) => {
  const provider = normalizeProvider(config?.provider);

  if (requireEnabled && !config?.enabled) {
    throw new Error(`${context} is disabled`);
  }

  if (!String(config?.fromEmail || '').trim()) {
    throw new Error('Sender email is required');
  }

  if (provider === 'brevo') {
    if (!String(config?.brevoApiKey || '').trim()) {
      throw new Error('Brevo API key is missing');
    }
    return provider;
  }

  if (!config?.host || !config?.user || !config?.pass) {
    throw new Error('Email SMTP settings are incomplete');
  }

  return provider;
};

export const verifyEmailDeliveryConnection = async (config) => {
  const provider = ensureEmailDeliveryConfig(config, { context: 'Email delivery' });

  if (provider === 'brevo') {
    try {
      const response = await axios.get(`${BREVO_API_BASE_URL}/account`, {
        headers: {
          accept: 'application/json',
          'api-key': String(config.brevoApiKey || '').trim(),
        },
      });

      return {
        connected: true,
        provider,
        accountEmail: String(response.data?.email || '').trim(),
        fromEmail: config.fromEmail,
        fromName: config.fromName,
      };
    } catch (error) {
      throw new Error(resolveProviderErrorMessage(error, 'Failed to verify Brevo connection'));
    }
  }

  const transporter = nodemailer.createTransport(resolveSmtpTransportOptions(config));
  await transporter.verify();

  return {
    connected: true,
    provider,
    host: config.host,
    port: config.port,
    secure: config.secure,
    fromEmail: config.fromEmail,
    fromName: config.fromName,
  };
};

export const sendEmailWithConfig = async ({ config, to, cc, bcc, subject, html, text, replyTo, attachments = [] }) => {
  const provider = ensureEmailDeliveryConfig(config, { context: 'Email delivery' });
  const toList = toAddressList(to);
  const ccList = toAddressList(cc);
  const bccList = toAddressList(bcc);
  const replyToEmail = String(replyTo || config?.replyTo || '').trim();

  if (toList.length === 0) {
    throw new Error('Email recipient is required');
  }

  if (provider === 'brevo') {
    const payload = {
      sender: {
        name: String(config.fromName || '').trim() || undefined,
        email: String(config.fromEmail || '').trim(),
      },
      to: mapBrevoRecipients(toList),
      cc: ccList.length ? mapBrevoRecipients(ccList) : undefined,
      bcc: bccList.length ? mapBrevoRecipients(bccList) : undefined,
      replyTo: replyToEmail ? { email: replyToEmail } : undefined,
      subject: String(subject || '').trim(),
      htmlContent: String(html || '').trim() || undefined,
      textContent: String(text || '').trim() || undefined,
      attachment: mapBrevoAttachments(attachments),
    };

    if (!payload.attachment?.length) {
      delete payload.attachment;
    }

    try {
      const response = await axios.post(`${BREVO_API_BASE_URL}/smtp/email`, payload, {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': String(config.brevoApiKey || '').trim(),
        },
      });

      return {
        provider,
        providerMessageId: String(response.data?.messageId || response.data?.messageIds?.[0] || '').trim(),
        to: toList,
      };
    } catch (error) {
      throw new Error(resolveProviderErrorMessage(error, 'Brevo email send failed'));
    }
  }

  const transporter = nodemailer.createTransport(resolveSmtpTransportOptions(config));
  const result = await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: toList.join(', '),
    cc: ccList.join(', ') || undefined,
    bcc: bccList.join(', ') || undefined,
    replyTo: replyToEmail || undefined,
    subject: String(subject || '').trim(),
    html: String(html || '').trim() || undefined,
    text: String(text || '').trim() || undefined,
    attachments: attachments
      .map(normalizeAttachment)
      .filter((attachment) => attachment.filename)
      .map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content || (attachment.contentBase64 ? Buffer.from(attachment.contentBase64, 'base64') : undefined),
        contentType: attachment.contentType,
        cid: attachment.contentId || undefined,
        path: !attachment.content && !attachment.contentBase64 && attachment.url ? attachment.url : undefined,
      })),
  });

  return {
    provider,
    providerMessageId: String(result?.messageId || '').trim(),
    to: toList,
  };
};
