import logger from '../utils/logger.js';

/**
 * Send SMS message via configured provider.
 * Stub implementation — extend with Twilio, Unifonic, or local SMS gateway.
 */
export async function sendSms(phone, message) {
  logger.info(`[SMS Stub] Would send to ${phone}: ${message.substring(0, 60)}...`);
  // TODO: integrate actual SMS provider
  // e.g. await twilioClient.messages.create({ body: message, from: fromNumber, to: phone });
  return { status: 'queued', provider: 'stub' };
}
