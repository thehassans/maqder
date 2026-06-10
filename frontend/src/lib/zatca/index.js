import { buildB2CInvoiceXml } from './ublBuilder';
import { hashXml, signHash, getPublicKeyFromPem, generatePhase2Qr } from './crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * ZATCA Phase 2 Engine - Processes an invoice offline, calculating its
 * ICV, PIH, Cryptographic Stamp, and generating the Phase 2 QR code.
 * 
 * @param {Object} invoice - The draft invoice object (e.g. from POS)
 * @param {Object} tenant - The tenant context containing zatca config
 * @param {Object} previousZatcaData - { icv: Number, pih: String (base64) } of the last invoice
 * @returns {Object} - The processed invoice enriched with ZATCA Phase 2 data
 */
export function processOfflineInvoice(invoice, tenant, previousZatcaData) {
  // Ensure we have the minimum requirements
  if (!tenant?.zatca?.privateKey) {
    throw new Error('Tenant ZATCA private key is required for offline signing.');
  }

  // 1. Establish ICV and PIH
  const icv = (previousZatcaData?.icv || 0) + 1;
  const pih = previousZatcaData?.pih || 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjZTllMzEwNjI2MzRiMjEzMWE1YTMzNzRkZjRmNmQyZThlMQ=='; // Default ZATCA seed PIH if ICV=1
  
  // Assign UUID if not present
  invoice.uuid = invoice.uuid || uuidv4();
  
  // Attach ICV and PIH to invoice temporarily for XML building
  invoice.zatca = {
    ...invoice.zatca,
    icv,
    pih
  };

  // 2. Generate canonical UBL XML
  const xml = buildB2CInvoiceXml(invoice, tenant);

  // 3. Hash the XML (SHA-256 Base64)
  const xmlHashBase64 = hashXml(xml);

  // 4. Generate Cryptographic Stamp (ECDSA secp256k1 Signature Base64)
  const signatureBase64 = signHash(xmlHashBase64, tenant.zatca.privateKey);

  // 5. Extract Public Key
  const publicKeyBase64 = getPublicKeyFromPem(tenant.zatca.privateKey);

  // 6. Generate Phase 2 TLV Base64 QR Code (Tags 1-9)
  const sellerName = tenant?.business?.legalNameAr || tenant?.business?.legalNameEn || tenant?.name || 'Seller';
  const vatNumber = tenant?.business?.vatNumber || '300000000000003';
  const invoiceDate = invoice.createdAt || new Date();
  const totalAmount = invoice.grandTotal || 0;
  const vatAmount = invoice.totalVat || 0;
  
  const phase2QrCode = generatePhase2Qr({
    sellerName,
    vatNumber,
    invoiceDate,
    totalAmount,
    vatAmount,
    xmlHashBase64,
    signatureBase64,
    publicKeyBase64,
    certificateSignatureBase64: tenant.zatca.certificateSignature || '' // Optional, often injected by backend later
  });

  // 7. Enclose ZATCA payload
  return {
    ...invoice,
    zatca: {
      icv,
      pih,
      xmlHash: xmlHashBase64,
      cryptographicStamp: signatureBase64,
      phase2QrCode,
      xmlPayload: xml,
      syncStatus: 'PENDING_SYNC', // Marked for background sync
      syncDeviceId: 'pos-device-1' // In a real app, this comes from localStorage/settings
    }
  };
}
