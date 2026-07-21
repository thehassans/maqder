const { ipcMain } = require('electron');
const QRCode = require('qrcode');

/**
 * Encode TLV (Tag-Length-Value)
 */
function encodeTLV(tag, valueString) {
  const valueBytes = Buffer.from(valueString, 'utf8');
  const length = valueBytes.length;
  
  if (length > 255) throw new Error(\`TLV Tag \${tag} value is too long (\${length} bytes)\`);
  
  const buffer = Buffer.alloc(2 + length);
  buffer[0] = tag;
  buffer[1] = length;
  valueBytes.copy(buffer, 2);
  
  return buffer;
}

/**
 * Generates ZATCA Phase 1 TLV Base64 String
 * Tags 1-5 only.
 */
function generatePhase1TLV({ sellerName, vatNumber, timestamp, invoiceTotal, vatTotal }) {
  const t1 = encodeTLV(1, sellerName);
  const t2 = encodeTLV(2, vatNumber);
  
  // Format timestamp properly (ISO 8601 or similar expected by readers)
  const timeStr = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString();
  const t3 = encodeTLV(3, timeStr);
  
  const t4 = encodeTLV(4, Number(invoiceTotal).toFixed(2));
  const t5 = encodeTLV(5, Number(vatTotal).toFixed(2));
  
  const totalLength = t1.length + t2.length + t3.length + t4.length + t5.length;
  const qrBuffer = Buffer.alloc(totalLength);
  
  let offset = 0;
  t1.copy(qrBuffer, offset); offset += t1.length;
  t2.copy(qrBuffer, offset); offset += t2.length;
  t3.copy(qrBuffer, offset); offset += t3.length;
  t4.copy(qrBuffer, offset); offset += t4.length;
  t5.copy(qrBuffer, offset); offset += t5.length;
  
  return qrBuffer.toString('base64');
}

/**
 * Register IPC Handler for QR Generation
 */
function registerZatcaIpcHandlers() {
  ipcMain.handle('zatca:generatePhase1QR', async (event, data) => {
    try {
      const { sellerName, vatNumber, timestamp, invoiceTotal, vatTotal } = data;
      
      const tlvBase64 = generatePhase1TLV({ 
        sellerName, 
        vatNumber, 
        timestamp, 
        invoiceTotal, 
        vatTotal 
      });

      // Also generate the Data URL image if needed for rendering
      const qrImageUrl = await QRCode.toDataURL(tlvBase64, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 150
      });

      return {
        base64: tlvBase64,
        imageUrl: qrImageUrl
      };
    } catch (error) {
      console.error('Error generating Phase 1 QR:', error);
      throw error;
    }
  });
}

module.exports = {
  generatePhase1TLV,
  registerZatcaIpcHandlers
};
