import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { saveInboundEmail } from '../utils/tenantEmailService.js';
import logger from '../utils/logger.js';

let isFetching = false;

export const fetchImapEmails = async () => {
  if (isFetching) {
    logger.info('[IMAP Fetcher] Skip run because a fetch is already in progress.');
    return;
  }

  const host = String(process.env.IMAP_HOST || '').trim();
  const port = Number(process.env.IMAP_PORT || 993);
  const user = String(process.env.IMAP_USER || '').trim();
  const pass = String(process.env.IMAP_PASSWORD || '').trim();
  const tls = process.env.IMAP_TLS === 'true' || port === 993;

  if (!host || !user || !pass) {
    return; // Silently abort if IMAP is not configured
  }

  const client = new ImapFlow({
    host,
    port,
    secure: tls,
    auth: { user, pass },
    logger: false, // disable internal logging to reduce noise
  });

  isFetching = true;

  try {
    await client.connect();
    
    // Select inbox and search for unseen messages
    const lock = await client.getMailboxLock('INBOX');
    try {
      const searchResult = await client.search({ seen: false });
      
      if (searchResult && searchResult.length > 0) {
        logger.info(`[IMAP Fetcher] Found ${searchResult.length} new emails in INBOX.`);
        
        for (const seq of searchResult) {
          try {
            const { content } = await client.download(seq);
            const parsed = await simpleParser(content);

            const payload = {
              messageId: parsed.messageId,
              to: parsed.to?.value?.map(t => t.address) || [],
              cc: parsed.cc?.value?.map(t => t.address) || [],
              bcc: parsed.bcc?.value?.map(t => t.address) || [],
              from: parsed.from?.value?.[0]?.address || '',
              subject: parsed.subject || '',
              html: parsed.html || '',
              text: parsed.text || parsed.textAsHtml || '',
              attachments: parsed.attachments?.map(a => ({
                filename: a.filename || 'attachment',
                contentType: a.contentType || 'application/octet-stream',
                size: a.size || 0,
                contentId: a.cid || '',
                contentBase64: Buffer.isBuffer(a.content) ? a.content.toString('base64') : ''
              })) || []
            };

            const result = await saveInboundEmail(payload, { provider: 'imap_poller' });
            
            if (result.saved) {
              // Mark as seen so we don't process it again
              await client.messageFlagsAdd(seq, ['\\Seen']);
            } else {
              logger.warn(`[IMAP Fetcher] Email not saved. Reason: ${result.reason}`);
              // We might still want to mark it as seen so it doesn't get stuck looping
              // but for now let's mark it as seen to avoid infinity loops on failure.
              await client.messageFlagsAdd(seq, ['\\Seen']);
            }
          } catch (err) {
            logger.error(`[IMAP Fetcher] Error processing message seq ${seq}: ${err.message}`);
          }
        }
      }
    } finally {
      lock.release();
    }
    
    await client.logout();
  } catch (error) {
    logger.error(`[IMAP Fetcher] Connection or processing error: ${error.message}`);
  } finally {
    isFetching = false;
  }
};
