const sanitizeFileName = (value) => String(value || 'invoice')
  .replace(/[\\/:*?"<>|]+/g, '-')
  .replace(/\s+/g, ' ')
  .trim();

const escapePdfText = (value) => String(value || '')
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)')
  .replace(/[\r\n]+/g, ' ')
  .replace(/[^\x20-\x7E]/g, '?');

const toMoney = (value, currency = 'SAR') => {
  const amount = Number(value || 0);
  return `${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'} ${String(currency || 'SAR').trim() || 'SAR'}`;
};

const buildInvoiceLines = ({ invoice, tenant, customerName }) => {
  const sellerName = String(tenant?.business?.legalNameEn || tenant?.business?.legalNameAr || tenant?.name || 'Maqder ERP').trim();
  const buyerName = String(customerName || invoice?.buyer?.name || invoice?.buyer?.nameAr || 'Customer').trim();
  const lines = [
    sellerName,
    `Invoice ${String(invoice?.invoiceNumber || '').trim()}`,
    `Issue Date: ${invoice?.issueDate ? new Date(invoice.issueDate).toISOString().slice(0, 10) : ''}`,
    `Status: ${String(invoice?.status || '').trim()}`,
    `Customer: ${buyerName}`,
    `Transaction: ${String(invoice?.transactionType || '').trim()}`,
    `Payment Method: ${String(invoice?.paymentMethod || '').trim()}`,
    `Subtotal: ${toMoney(invoice?.subtotal, invoice?.currency)}`,
    `Tax: ${toMoney(invoice?.totalTax, invoice?.currency)}`,
    `Total: ${toMoney(invoice?.grandTotal, invoice?.currency)}`,
    '',
    'Line Items',
  ];

  const invoiceLines = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];
  invoiceLines.slice(0, 22).forEach((line, index) => {
    const name = String(line?.productName || line?.productNameAr || `Item ${index + 1}`).trim();
    const qty = Number(line?.quantity || 0);
    const price = toMoney(line?.unitPrice, invoice?.currency);
    const total = toMoney(line?.lineTotalWithTax || line?.lineTotal, invoice?.currency);
    lines.push(`${index + 1}. ${name} | Qty: ${Number.isFinite(qty) ? qty : 0} | Price: ${price} | Total: ${total}`);
  });

  if (invoiceLines.length > 22) {
    lines.push(`... ${invoiceLines.length - 22} more items`);
  }

  if (invoice?.notes) {
    lines.push('');
    lines.push(`Notes: ${String(invoice.notes).trim()}`);
  }

  return lines.filter((line) => line !== null && line !== undefined);
};

const buildPdfBufferFromLines = (lines) => {
  const safeLines = Array.isArray(lines) ? lines.slice(0, 40) : [];
  const operations = ['BT', '/F1 11 Tf', '50 800 Td'];

  safeLines.forEach((line, index) => {
    const escapedLine = escapePdfText(line);
    if (index > 0) {
      operations.push('0 -18 Td');
    }
    operations.push(`(${escapedLine}) Tj`);
  });

  operations.push('ET');
  const content = `${operations.join('\n')}\n`;

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}endstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let output = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(output, 'utf8'));
    output += object;
  });

  const xrefOffset = Buffer.byteLength(output, 'utf8');
  output += `xref\n0 ${objects.length + 1}\n`;
  output += '0000000000 65535 f \n';
  for (let index = 1; index <= objects.length; index += 1) {
    output += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(output, 'utf8');
};

export const buildInvoicePdfBuffer = ({ invoice, tenant, customerName }) => buildPdfBufferFromLines(buildInvoiceLines({ invoice, tenant, customerName }));

export const buildInvoicePdfAttachment = ({ invoice, tenant, customerName }) => {
  const filename = `${sanitizeFileName(invoice?.invoiceNumber || 'invoice')}.pdf`;
  const content = buildInvoicePdfBuffer({ invoice, tenant, customerName });
  return {
    filename,
    content,
    contentType: 'application/pdf',
    size: content.length,
  };
};
