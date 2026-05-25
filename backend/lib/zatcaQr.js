/**
 * ZATCA Phase 2 QR Code Helper
 * Implements the TLMV (Tag-Length-Value Minimum) encoding specified in
 * ZATCA's E-Invoicing Implementation Standards v2.3.
 *
 * Tags:
 *   1 - Seller Name (UTF-8)
 *   2 - Seller VAT Registration Number (UTF-8)
 *   3 - Invoice Timestamp (ISO 8601)
 *   4 - Invoice Total Amount (with VAT) as string
 *   5 - VAT Amount as string
 *
 * Each field is encoded as: [tag_byte] [length_byte(s)] [value_bytes]
 * The full buffer is then Base64-encoded for embedding in a QR code.
 *
 * Note: This covers the MINIMUM QR fields required by ZATCA Phase 2 B2C
 * invoices (simplified tax invoices). B2B (standard) invoices require
 * additional fields and cryptographic signing via the Phase 2 APIs.
 */

/**
 * Encode a single TLMV field.
 * @param {number} tag   - Tag byte (1-5)
 * @param {string} value - UTF-8 string value
 * @returns {Buffer}
 */
function encodeTLVField(tag, value) {
  const valueBuffer = Buffer.from(value, 'utf8');
  const length = valueBuffer.length;

  // Support length up to 255 bytes (single byte length)
  if (length > 255) {
    throw new Error(`ZATCA QR field ${tag} value too long (${length} bytes)`);
  }

  const tagBuffer = Buffer.alloc(1);
  tagBuffer.writeUInt8(tag, 0);

  const lengthBuffer = Buffer.alloc(1);
  lengthBuffer.writeUInt8(length, 0);

  return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
}

/**
 * Generate a ZATCA-compliant QR code payload.
 *
 * @param {object} params
 * @param {string}  params.sellerName        - Arabic or English seller name
 * @param {string}  params.vatNumber         - 15-digit Saudi VAT registration number
 * @param {Date|string} params.invoiceDate   - Invoice timestamp
 * @param {number}  params.totalAmount       - Grand total including VAT
 * @param {number}  params.vatAmount         - VAT portion of the total
 * @returns {string} Base64-encoded TLMV payload suitable for a QR code
 */
export function generateZatcaQr({ sellerName, vatNumber, invoiceDate, totalAmount, vatAmount }) {
  if (!sellerName || !vatNumber || !invoiceDate || totalAmount == null || vatAmount == null) {
    throw new Error('generateZatcaQr: all parameters are required');
  }

  // Format timestamp as ISO 8601 (ZATCA spec)
  const timestamp = invoiceDate instanceof Date
    ? invoiceDate.toISOString()
    : new Date(invoiceDate).toISOString();

  // Format amounts to 2 decimal places as strings (ZATCA spec)
  const totalStr = Number(totalAmount).toFixed(2);
  const vatStr = Number(vatAmount).toFixed(2);

  const fields = Buffer.concat([
    encodeTLVField(1, sellerName),
    encodeTLVField(2, vatNumber),
    encodeTLVField(3, timestamp),
    encodeTLVField(4, totalStr),
    encodeTLVField(5, vatStr),
  ]);

  return fields.toString('base64');
}

/**
 * Generate QR for a RentalContract closure, using the tenant's ZATCA config.
 *
 * @param {object} contract   - The RentalContract document (or POJO)
 * @param {object} tenant     - The Tenant document (or POJO)
 * @returns {string} Base64 QR string
 */
export function generateContractZatcaQr(contract, tenant) {
  const sellerName = tenant?.business?.legalNameAr
    || tenant?.business?.legalNameEn
    || tenant?.name
    || 'Car Rental';

  const vatNumber = tenant?.business?.vatNumber || '000000000000000';
  const invoiceDate = contract.actualReturnDateTime || contract.updatedAt || new Date();
  const totalAmount = contract.grandTotal || 0;
  const vatAmount = contract.totalVat || 0;

  return generateZatcaQr({ sellerName, vatNumber, invoiceDate, totalAmount, vatAmount });
}

/**
 * Decode a ZATCA QR Base64 payload back to its field values.
 * Useful for verification / testing.
 *
 * @param {string} base64 - Base64-encoded TLMV payload
 * @returns {object} Decoded fields
 */
export function decodeZatcaQr(base64) {
  const buf = Buffer.from(base64, 'base64');
  const result = {};
  const tagNames = { 1: 'sellerName', 2: 'vatNumber', 3: 'timestamp', 4: 'totalAmount', 5: 'vatAmount' };
  let offset = 0;

  while (offset < buf.length) {
    const tag = buf.readUInt8(offset);
    const length = buf.readUInt8(offset + 1);
    const value = buf.slice(offset + 2, offset + 2 + length).toString('utf8');
    result[tagNames[tag] || `tag_${tag}`] = value;
    offset += 2 + length;
  }

  return result;
}
