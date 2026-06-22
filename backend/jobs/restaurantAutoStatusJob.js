import Tenant from '../models/Tenant.js';
import { sendSms } from '../services/smsService.js';
import whatsAppService from '../services/whatsappService.js';
import { sendRestaurantOpenNotification } from '../services/restaurantWhatsAppService.js';

/**
 * Check all tenants with restaurant business type and autoStatusUpdate enabled.
 * Automatically update their status (open/closed) based on opening/closing times.
 * Send notifications when status changes.
 */
export async function checkRestaurantAutoStatus() {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    const tenants = await Tenant.find({
      'businessTypes': 'restaurant',
      'settings.restaurant.autoStatusUpdate': true,
      'isActive': true,
    }).lean();

    for (const tenant of tenants) {
      const rs = tenant.settings?.restaurant || {};
      const openingTime = rs.openingTime || '08:00';
      const closingTime = rs.closingTime || '23:00';
      const notifyOnChange = rs.notifyOnStatusChange;
      const notifyPhone = rs.statusNotificationPhone?.trim();

      // Determine if currently open based on time
      const isOpen = currentTime >= openingTime && currentTime < closingTime;

      // Get current status from tenant (if it exists)
      const currentStatus = tenant.status || 'active';

      // Only update if status actually changes
      const newStatus = isOpen ? 'active' : 'inactive';
      if (newStatus === currentStatus) continue;

      // Update tenant status
      await Tenant.updateOne(
        { _id: tenant._id },
        { $set: { status: newStatus } }
      );

      // Send notification if enabled
      if (notifyOnChange && notifyPhone) {
        const businessName = tenant.business?.legalNameEn || tenant.name || 'Restaurant';
        const businessNameAr = tenant.business?.legalNameAr || businessName;

        if (isOpen) {
          const msgEn = `${businessName} is now OPEN. Opening hours: ${openingTime} - ${closingTime}. We look forward to serving you!`;
          const msgAr = `مرحباً! ${businessNameAr} مفتوح الآن. ساعات العمل: من ${openingTime} إلى ${closingTime}. نتطلع لخدمتكم!`;
          await sendNotification(tenant._id, notifyPhone, msgEn, msgAr);

          // Also send WhatsApp auto-open notification to notify list
          try {
            await sendRestaurantOpenNotification(tenant._id);
          } catch (e) {
            console.error('WhatsApp open notification failed:', e.message);
          }
        } else {
          const msgEn = `${businessName} is now CLOSED. Thank you for visiting! We open tomorrow at ${openingTime}.`;
          const msgAr = `شكراً لزيارتكم! ${businessNameAr} مغلق الآن. نفتح غداً في الساعة ${openingTime}.`;
          await sendNotification(tenant._id, notifyPhone, msgEn, msgAr);
        }
      }
    }
  } catch (err) {
    console.error('Restaurant auto status check error:', err.message);
  }
}

async function sendNotification(tenantId, phone, msgEn, msgAr) {
  try {
    // Try WhatsApp first, fallback to SMS
    await whatsAppService.sendText(tenantId, phone, `${msgEn}\n\n${msgAr}`);
  } catch {
    try {
      await sendSms(phone, msgEn);
    } catch (smsErr) {
      console.error('Notification failed:', smsErr.message);
    }
  }
}
