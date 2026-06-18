import axios from 'axios';
import BoutiqueRental from '../models/BoutiqueRental.js';
import { WhatsAppConfig } from '../models/WhatsApp.js';

/**
 * Boutique WhatsApp Service
 * Integrates with the tenant's WhatsApp Business API configuration
 * to send automated rental notifications, invoices, and reminders.
 *
 * Supports Meta Cloud API as the primary provider.
 */

/**
 * Fetch the tenant's active WhatsApp configuration.
 */
async function getTenantWhatsAppConfig(tenantId) {
  return WhatsAppConfig.findOne({ tenantId, isActive: true });
}

/**
 * Format a Saudi mobile number to international format for WhatsApp.
 * @param {string} phone - Raw phone string
 * @returns {string} e.g., 9665xxxxxxxx
 */
function formatPhoneForWhatsApp(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('966')) return digits;
  if (digits.startsWith('0')) return '966' + digits.slice(1);
  if (digits.length === 9) return '966' + digits;
  return digits;
}

/**
 * Send a WhatsApp text message via Meta Cloud API.
 */
async function sendMetaMessage({ to, text, tenantId }) {
  const config = await getTenantWhatsAppConfig(tenantId);
  if (!config || !config.accessToken || !config.phoneNumberId) {
    throw new Error('WhatsApp Business API not configured for this tenant');
  }

  const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formatPhoneForWhatsApp(to),
    type: 'text',
    text: { body: text },
  };

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  return response.data;
}

/**
 * Send a WhatsApp message with a PDF media attachment.
 */
async function sendMetaMessageWithMedia({ to, text, mediaUrl, mediaType = 'document', filename, tenantId }) {
  const config = await getTenantWhatsAppConfig(tenantId);
  if (!config || !config.accessToken || !config.phoneNumberId) {
    throw new Error('WhatsApp Business API not configured for this tenant');
  }

  const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formatPhoneForWhatsApp(to),
    type: mediaType,
    [mediaType]: {
      link: mediaUrl,
      caption: text,
      ...(filename ? { filename } : {}),
    },
  };

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  return response.data;
}

/* ─── Boutique-specific message templates ─── */

export function buildPaymentGreeting(rental, language = 'en') {
  const lines = rental.lineItems.map((l) =>
    language === 'ar'
      ? `• ${l.productNameAr || l.productName} (${l.size || ''}) — ${l.rentalDays} يوم`
      : `• ${l.productName} (${l.size || ''}) — ${l.rentalDays} days`
  ).join('\n');

  if (language === 'ar') {
    return `مرحباً ${rental.customerName} 👗✨\n\nشكراً لاختياركم! تم تأكيد حجز الفساتين:\n${lines}\n\nرقم الحجز: ${rental.rentalNumber}\nالإجمالي: SAR ${rental.grandTotal.toFixed(2)}\nتاريخ الاستلام: ${new Date(rental.startDate).toLocaleDateString('ar-SA')}\nتاريخ الإرجاع: ${new Date(rental.endDate).toLocaleDateString('ar-SA')}\n\nنتطلع لخدمتكم 💕`;
  }

  return `Hello ${rental.customerName} 👗✨\n\nThank you for choosing us! Your dress rental is confirmed:\n${lines}\n\nBooking #: ${rental.rentalNumber}\nTotal: SAR ${rental.grandTotal.toFixed(2)}\nPickup: ${new Date(rental.startDate).toLocaleDateString('en-US')}\nReturn: ${new Date(rental.endDate).toLocaleDateString('en-US')}\n\nWe look forward to seeing you! 💕`;
}

export function buildReminder24h(rental, language = 'en') {
  if (language === 'ar') {
    return `تذكير عزيزتي ${rental.customerName} 👋\n\nفساتينك مستأجرة حتى غداً ${new Date(rental.endDate).toLocaleDateString('ar-SA')}.\nيرجى إرجاعها في موعدها لتجنب رسوم التأخير.\n\nرقم الحجز: ${rental.rentalNumber}\n📞 للاستفسار: رد على هذه الرسالة`;
  }
  return `Hi ${rental.customerName} 👋\n\nFriendly reminder: your dress rental is due tomorrow ${new Date(rental.endDate).toLocaleDateString('en-US')}.\nPlease return on time to avoid late fees.\n\nBooking #: ${rental.rentalNumber}\n📞 Questions? Reply to this message`;
}

export function buildOverdueAlert(rental, language = 'en') {
  const daysLate = Math.max(1, Math.ceil((Date.now() - new Date(rental.endDate).getTime()) / (1000 * 60 * 60 * 24)));
  const lateFee = rental.lineItems.reduce((sum, l) => sum + ((l.lateFeePerDay || 50) * daysLate), 0);

  if (language === 'ar') {
    return `تنبيه عزيزتي ${rental.customerName} ⚠️\n\nتأخرت في إرجاع الفساتين بـ ${daysLate} يوم/أيام.\nرسوم التأخير المتراكمة: SAR ${lateFee.toFixed(2)}\n\nرجاءً قومي بإرجاع الفساتين في أقرب وقت.\nرقم الحجز: ${rental.rentalNumber}`;
  }
  return `Hi ${rental.customerName} ⚠️\n\nYour dress rental is ${daysLate} day(s) overdue.\nAccrued late fees: SAR ${lateFee.toFixed(2)}\n\nPlease return the dress(es) as soon as possible.\nBooking #: ${rental.rentalNumber}`;
}

/* ─── Public API methods ─── */

/**
 * Send payment confirmation + invoice PDF to customer upon checkout.
 */
export async function sendPaymentConfirmation(rentalId, invoicePdfUrl, language = 'en') {
  const rental = await BoutiqueRental.findById(rentalId);
  if (!rental || !rental.customerPhone) return;

  const text = buildPaymentGreeting(rental, language);

  try {
    if (invoicePdfUrl) {
      await sendMetaMessageWithMedia({
        to: rental.customerPhone,
        text,
        mediaUrl: invoicePdfUrl,
        mediaType: 'document',
        filename: `${rental.rentalNumber}.pdf`,
        tenantId: rental.tenantId,
      });
    } else {
      await sendMetaMessage({
        to: rental.customerPhone,
        text,
        tenantId: rental.tenantId,
      });
    }
  } catch (err) {
    console.error('[BoutiqueWhatsApp] Payment confirmation failed:', err.message);
    throw err;
  }
}

/**
 * Send 24-hour return reminder.
 */
export async function sendReturnReminder(rentalId, language = 'en') {
  const rental = await BoutiqueRental.findById(rentalId);
  if (!rental || rental.reminder24hSent || !rental.customerPhone) return;

  const text = buildReminder24h(rental, language);

  try {
    await sendMetaMessage({
      to: rental.customerPhone,
      text,
      tenantId: rental.tenantId,
    });
    rental.reminder24hSent = true;
    await rental.save();
  } catch (err) {
    console.error('[BoutiqueWhatsApp] 24h reminder failed:', err.message);
  }
}

/**
 * Send overdue alert.
 */
export async function sendOverdueAlert(rentalId, language = 'en') {
  const rental = await BoutiqueRental.findById(rentalId);
  if (!rental || rental.reminderOverdueSent || !rental.customerPhone) return;

  const text = buildOverdueAlert(rental, language);

  try {
    await sendMetaMessage({
      to: rental.customerPhone,
      text,
      tenantId: rental.tenantId,
    });
    rental.reminderOverdueSent = true;
    await rental.save();
  } catch (err) {
    console.error('[BoutiqueWhatsApp] Overdue alert failed:', err.message);
  }
}
