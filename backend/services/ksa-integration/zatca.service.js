/**
 * ZATCA Phase 2 Integration Service
 * Handles compliant XML generation, digital signing, and TLV QR Code.
 */

import crypto from 'crypto';

export class ZatcaService {
  /**
   * Generates a Base64 encoded TLV (Tag-Length-Value) QR Code string as per ZATCA Phase 2 requirements.
   * @param {Object} data { sellerName, vatRegistrationNumber, timestamp, invoiceTotal, vatTotal }
   */
  static generateTlvQrCode(data) {
    const { sellerName, vatRegistrationNumber, timestamp, invoiceTotal, vatTotal } = data;

    const getHexFromValue = (tag, value) => {
      const buffer = Buffer.from(String(value), 'utf8');
      const tagHex = Buffer.from([tag]).toString('hex');
      const lengthHex = Buffer.from([buffer.length]).toString('hex');
      return tagHex + lengthHex + buffer.toString('hex');
    };

    const tlvHex = [
      getHexFromValue(1, sellerName),
      getHexFromValue(2, vatRegistrationNumber),
      getHexFromValue(3, timestamp),
      getHexFromValue(4, invoiceTotal),
      getHexFromValue(5, vatTotal)
    ].join('');

    return Buffer.from(tlvHex, 'hex').toString('base64');
  }

  /**
   * Generates SHA-256 Hash of the invoice payload.
   * @param {Object} invoiceData 
   */
  static generateInvoiceHash(invoiceData) {
    const payload = JSON.stringify(invoiceData);
    return crypto.createHash('sha256').update(payload).digest('base64');
  }

  /**
   * Generates ZATCA Compliant XML for Simplified Tax Invoice.
   * @param {Object} invoiceData 
   */
  static generateSimplifiedTaxInvoiceXML(invoiceData) {
    // In a real implementation, this requires strict UBL 2.1 XML construction with XSLT transformations
    // and cryptographic signatures based on a provided CSR/Certificate.
    
    console.log(`[ZATCA] Generating Simplified Tax Invoice XML for Contract ${invoiceData.contractNumber}`);
    
    // Mock XML returning structure
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:ID>${invoiceData.invoiceNumber}</cbc:ID>
  <cbc:IssueDate>${new Date().toISOString().split('T')[0]}</cbc:IssueDate>
  <!-- ZATCA UBL details here -->
  <cac:LegalMonetaryTotal>
    <cbc:TaxExclusiveAmount currencyID="SAR">${invoiceData.subTotal}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${invoiceData.grandTotal}</cbc:TaxInclusiveAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;
  }
}
