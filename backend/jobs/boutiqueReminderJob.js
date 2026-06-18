import cron from 'node-cron';
import BoutiqueRental from '../models/BoutiqueRental.js';
import { sendReturnReminder, sendOverdueAlert } from '../services/boutiqueWhatsAppService.js';
import { flagOverdueRentals } from '../services/boutiqueCalendarService.js';

/**
 * Boutique Reminder CRON Jobs
 *
 * 1. Daily at 10:00 AM — flag rentals that have passed their endDate as "late_return"
 * 2. Daily at 11:00 AM — send WhatsApp reminders for rentals due tomorrow
 * 3. Daily at 11:30 AM — send overdue alerts for late rentals
 *
 * Timezone: Asia/Riyadh (UTC+3) — configured in cron options where supported,
 * or rely on server local time being set to Riyadh.
 */

const RENTAL_REMINDER_STATUSES = ['reserved', 'picked_up'];

/**
 * Process rentals that are due tomorrow and send 24h reminders.
 */
export async function process24HourReminders() {
  const now = new Date();
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const rentals = await BoutiqueRental.find({
    status: 'picked_up',
    endDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
    reminder24hSent: { $ne: true },
    customerPhone: { $exists: true, $ne: '' },
  }).limit(100);

  let sent = 0;
  for (const rental of rentals) {
    try {
      await sendReturnReminder(rental._id, 'ar'); // Default to Arabic for Saudi market; fallback to 'en'
      sent++;
    } catch (err) {
      console.error(`[BoutiqueReminder] 24h reminder failed for ${rental.rentalNumber}:`, err.message);
    }
  }

  console.log(`[BoutiqueReminder] Sent ${sent} 24-hour reminders`);
  return sent;
}

/**
 * Process overdue rentals and send alert messages.
 */
export async function processOverdueAlerts() {
  // First, auto-flag any rentals that are past endDate but still "picked_up"
  const flagged = await flagOverdueRentals();
  if (flagged > 0) {
    console.log(`[BoutiqueReminder] Auto-flagged ${flagged} rentals as late_return`);
  }

  // Then send WhatsApp alerts for newly flagged (or still late) rentals
  const overdueRentals = await BoutiqueRental.find({
    status: 'late_return',
    reminderOverdueSent: { $ne: true },
    customerPhone: { $exists: true, $ne: '' },
  }).limit(100);

  let sent = 0;
  for (const rental of overdueRentals) {
    try {
      await sendOverdueAlert(rental._id, 'ar');
      sent++;
    } catch (err) {
      console.error(`[BoutiqueReminder] Overdue alert failed for ${rental.rentalNumber}:`, err.message);
    }
  }

  console.log(`[BoutiqueReminder] Sent ${sent} overdue alerts`);
  return sent;
}

/**
 * Register all boutique reminder cron jobs.
 * Call once from server.js startJobs().
 */
export function startBoutiqueReminderJobs() {
  // Auto-flag overdue rentals daily at 10:00
  cron.schedule('0 10 * * *', async () => {
    console.log('[BoutiqueReminder] Running overdue flagging...');
    await flagOverdueRentals();
  });

  // 24-hour reminders daily at 11:00
  cron.schedule('0 11 * * *', async () => {
    console.log('[BoutiqueReminder] Running 24h reminder job...');
    await process24HourReminders();
  });

  // Overdue alerts daily at 11:30
  cron.schedule('30 11 * * *', async () => {
    console.log('[BoutiqueReminder] Running overdue alert job...');
    await processOverdueAlerts();
  });
}
