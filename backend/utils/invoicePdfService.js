import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sanitizeFileName = (value) => String(value || 'invoice')
  .replace(/[\\/:*?"<>|]+/g, '-')
  .replace(/\s+/g, ' ')
  .trim();

const normalizeText = (value) => String(value || '').trim();

const toMoney = (value, currency = 'SAR') => {
  const amount = Number(value || 0);
  return `${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'} ${String(currency || 'SAR').trim() || 'SAR'}`;
};

const escapePdfText = (value) => String(value || '')
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)')
  .replace(/[\r\n]+/g, ' ')
  .replace(/[^\x20-\x7E]/g, '?');

const formatDate = (value, language = 'en') => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const buildPartyLines = (party = {}, language = 'en') => {
  const address = party?.address || {};
  const cityLine = [address?.buildingNumber, address?.street, address?.district, address?.city].filter(Boolean).join(', ');
  const locationLine = [address?.postalCode, address?.country].filter(Boolean).join(' ');
  const labels = language === 'ar'
    ? { vat: 'الرقم الضريبي', cr: 'السجل التجاري', phone: 'الهاتف', email: 'البريد' }
    : { vat: 'VAT', cr: 'CR', phone: 'Phone', email: 'Email' };
  return [
    language === 'ar' ? normalizeText(party?.nameAr || party?.name) : normalizeText(party?.name || party?.nameAr),
    party?.vatNumber ? `${labels.vat}: ${normalizeText(party.vatNumber)}` : '',
    party?.crNumber ? `${labels.cr}: ${normalizeText(party.crNumber)}` : '',
    cityLine,
    locationLine,
    party?.contactPhone ? `${labels.phone}: ${normalizeText(party.contactPhone)}` : '',
    party?.contactEmail ? `${labels.email}: ${normalizeText(party.contactEmail)}` : '',
  ].filter(Boolean);
};

const buildTravelRows = (invoice = {}) => {
  const travelDetails = invoice?.travelDetails || {};
  const segments = Array.isArray(travelDetails?.segments) ? travelDetails.segments : [];
  const passengers = Array.isArray(travelDetails?.passengers) ? travelDetails.passengers : [];
  const routeLabel = segments.length
    ? segments.map((segment) => [normalizeText(segment?.from), normalizeText(segment?.to)].filter(Boolean).join(' → ')).filter(Boolean).join(' | ')
    : [normalizeText(travelDetails?.routeFrom), normalizeText(travelDetails?.routeTo)].filter(Boolean).join(' → ');

  return [
    ['Lead Traveler\nاسم المسافر', normalizeText(travelDetails?.travelerName || invoice?.buyer?.name || invoice?.buyer?.nameAr)],
    ['Passport\nرقم الجواز', normalizeText(travelDetails?.passportNumber)],
    ['Ticket Number\nرقم التذكرة', normalizeText(travelDetails?.ticketNumber)],
    ['PNR\nرقم الحجز', normalizeText(travelDetails?.pnr)],
    ['Airline / Vendor\nشركة الطيران / المورد', normalizeText(travelDetails?.airlineName)],
    ['Route\nالمسار', routeLabel],
    ['Departure Date\nتاريخ السفر', formatDate(travelDetails?.departureDate, 'en') || formatDate(invoice?.issueDate, 'en')],
    ['Return Date\nتاريخ العودة', travelDetails?.hasReturnDate ? formatDate(travelDetails?.returnDate, 'en') : '—'],
    ['Layover / Stay\nالتوقف / الإقامة', normalizeText(travelDetails?.layoverStay) || '—'],
    ['Additional Passengers\nمسافرون إضافيون', passengers.length ? passengers.map((passenger) => normalizeText(passenger?.name)).filter(Boolean).join(', ') : '—'],
  ].filter(([, value]) => String(value || '').trim());
};

const buildFallbackInvoiceLines = ({ invoice, tenant, customerName }) => {
  const sellerName = normalizeText(tenant?.business?.legalNameEn || tenant?.business?.legalNameAr || tenant?.name || 'Maqder ERP');
  const buyerName = normalizeText(customerName || invoice?.buyer?.name || invoice?.buyer?.nameAr || 'Customer');
  const lines = [
    sellerName,
    `Invoice ${normalizeText(invoice?.invoiceNumber)}`,
    `Issue Date: ${formatDate(invoice?.issueDate, 'en')}`,
    `Customer: ${buyerName}`,
    `Transaction: ${normalizeText(invoice?.transactionType)}`,
    `Payment Method: ${normalizeText(invoice?.paymentMethod)}`,
    `Subtotal: ${toMoney(invoice?.subtotal, invoice?.currency)}`,
    `Tax: ${toMoney(invoice?.totalTax, invoice?.currency)}`,
    `Total: ${toMoney(invoice?.grandTotal, invoice?.currency)}`,
    '',
    'Line Items',
  ];

  const invoiceLines = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];
  invoiceLines.slice(0, 18).forEach((line, index) => {
    const name = normalizeText(line?.productName || line?.productNameAr || `Item ${index + 1}`);
    const qty = Number(line?.quantity || 0);
    const price = toMoney(line?.unitPrice, invoice?.currency);
    const total = toMoney(line?.lineTotalWithTax || line?.lineTotal, invoice?.currency);
    lines.push(`${index + 1}. ${name} | Qty: ${Number.isFinite(qty) ? qty : 0} | Price: ${price} | Total: ${total}`);
  });

  const travelRows = buildTravelRows(invoice);
  if (travelRows.length) {
    lines.push('');
    lines.push('Travel Details');
    travelRows.forEach(([label, value]) => {
      lines.push(`${String(label || '').replace(/\n/g, ' / ')}: ${value}`);
    });
  }

  if (invoice?.notes) {
    lines.push('');
    lines.push(`Notes: ${normalizeText(invoice.notes)}`);
  }

  return lines.filter(Boolean);
};

const buildFallbackPdfBufferFromLines = (lines) => {
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

let pdfRuntimePromise;

const loadPdfRuntime = async () => {
  if (!pdfRuntimePromise) {
    pdfRuntimePromise = Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ])
      .then(([jspdfModule, autoTableModule]) => ({
        jsPDF: jspdfModule?.jsPDF || jspdfModule?.default || jspdfModule,
        autoTable: autoTableModule?.default || autoTableModule,
      }))
      .catch(() => null);
  }

  return pdfRuntimePromise;
};

let tajawalRegularBase64 = '';
let tajawalBoldBase64 = '';
let fontLoadPromise;

const ensureFontData = async () => {
  if (!fontLoadPromise) {
    fontLoadPromise = (async () => {
      const regularPath = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'fonts', 'Tajawal-Regular.ttf');
      const boldPath = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'fonts', 'Tajawal-Bold.ttf');
      if (existsSync(regularPath)) {
        tajawalRegularBase64 = (await readFile(regularPath)).toString('base64');
      }
      if (existsSync(boldPath)) {
        tajawalBoldBase64 = (await readFile(boldPath)).toString('base64');
      }
    })();
  }

  await fontLoadPromise;
};

const ensureTajawalFont = async (doc) => {
  await ensureFontData();
  if (!tajawalRegularBase64) return false;

  try {
    doc.addFileToVFS('Tajawal-Regular.ttf', tajawalRegularBase64);
    doc.addFont('Tajawal-Regular.ttf', 'Tajawal', 'normal');
    if (tajawalBoldBase64) {
      doc.addFileToVFS('Tajawal-Bold.ttf', tajawalBoldBase64);
      doc.addFont('Tajawal-Bold.ttf', 'Tajawal', 'bold');
    }
    doc.setFont('Tajawal', 'normal');
    return true;
  } catch {
    return false;
  }
};

const setDocFont = (doc, fontFamily, fontStyle = 'normal', fontSize = 11) => {
  try {
    doc.setFont(fontFamily, fontStyle);
  } catch {
    doc.setFont('helvetica', fontStyle === 'bold' ? 'bold' : 'normal');
  }
  doc.setFontSize(fontSize);
};

export const buildInvoicePdfBuffer = async ({ invoice, tenant, customerName, language = 'bilingual' }) => {
  const pdfRuntime = await loadPdfRuntime();
  if (!pdfRuntime?.jsPDF || !pdfRuntime?.autoTable) {
    return buildFallbackPdfBufferFromLines(buildFallbackInvoiceLines({ invoice, tenant, customerName }));
  }

  const { jsPDF, autoTable } = pdfRuntime;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const arabicFontReady = await ensureTajawalFont(doc);
  const englishFont = 'helvetica';
  const arabicFont = arabicFontReady ? 'Tajawal' : 'helvetica';
  const sellerNameEn = normalizeText(tenant?.business?.legalNameEn || tenant?.name || 'Maqder ERP');
  const sellerNameAr = normalizeText(tenant?.business?.legalNameAr);
  const buyerName = normalizeText(customerName || invoice?.buyer?.name || invoice?.buyer?.nameAr || 'Customer');
  const invoiceTitle = `Invoice ${normalizeText(invoice?.invoiceNumber)}`;
  const invoiceTitleAr = `الفاتورة ${normalizeText(invoice?.invoiceNumber)}`;

  doc.setFillColor(22, 59, 39);
  doc.rect(0, 0, pageWidth, 120, 'F');
  setDocFont(doc, englishFont, 'bold', 22);
  doc.setTextColor(255, 255, 255);
  doc.text(sellerNameEn, margin, 42);
  if (sellerNameAr) {
    setDocFont(doc, arabicFont, 'normal', 13);
    if (typeof doc.setR2L === 'function') doc.setR2L(true);
    doc.text(sellerNameAr, pageWidth - margin, 42, { align: 'right' });
    if (typeof doc.setR2L === 'function') doc.setR2L(false);
  }
  setDocFont(doc, englishFont, 'bold', 18);
  doc.text(invoiceTitle, margin, 78);
  setDocFont(doc, arabicFont, 'bold', 16);
  if (typeof doc.setR2L === 'function') doc.setR2L(true);
  doc.text(invoiceTitleAr, pageWidth - margin, 78, { align: 'right' });
  if (typeof doc.setR2L === 'function') doc.setR2L(false);

  const infoRows = [
    ['Issue Date', 'تاريخ الإصدار', formatDate(invoice?.issueDate, 'en')],
    ['Transaction', 'نوع المعاملة', normalizeText(invoice?.transactionType)],
    ['Payment Method', 'طريقة الدفع', normalizeText(invoice?.paymentMethod)],
    ['Status', 'الحالة', normalizeText(invoice?.status)],
  ];

  autoTable(doc, {
    startY: 140,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['English', 'العربية', 'Value']],
    body: infoRows,
    styles: { font: englishFont, fontSize: 10, cellPadding: 8, textColor: [31, 41, 55] },
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      1: { font: arabicFont, halign: 'right' },
      2: { halign: 'left' },
    },
  });

  const partiesStartY = (doc.lastAutoTable?.finalY || 140) + 18;
  const sectionWidth = (pageWidth - margin * 2 - 14) / 2;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, partiesStartY, sectionWidth, 122, 14, 14, 'FD');
  doc.roundedRect(margin + sectionWidth + 14, partiesStartY, sectionWidth, 122, 14, 14, 'FD');
  setDocFont(doc, englishFont, 'bold', 13);
  doc.setTextColor(15, 23, 42);
  doc.text('Seller / البائع', margin + 14, partiesStartY + 20);
  doc.text('Customer / العميل', margin + sectionWidth + 28, partiesStartY + 20);

  const writeMultiline = (lines, startX, startY, fontFamily, align = 'left') => {
    let cursorY = startY;
    lines.forEach((line) => {
      if (!line) return;
      setDocFont(doc, fontFamily, 'normal', 10.5);
      if (align === 'right' && typeof doc.setR2L === 'function') doc.setR2L(true);
      doc.text(line, startX, cursorY, { maxWidth: sectionWidth - 28, align });
      if (align === 'right' && typeof doc.setR2L === 'function') doc.setR2L(false);
      cursorY += 14;
    });
  };

  writeMultiline(buildPartyLines(invoice?.seller || tenant?.business || {}, 'en'), margin + 14, partiesStartY + 40, englishFont);
  writeMultiline(buildPartyLines({ ...(invoice?.buyer || {}), name: buyerName }, 'en'), margin + sectionWidth + 28, partiesStartY + 40, englishFont);

  const travelRows = buildTravelRows(invoice);
  if (travelRows.length) {
    autoTable(doc, {
      startY: partiesStartY + 140,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [['Travel Details / تفاصيل السفر', 'Value / القيمة']],
      body: travelRows,
      styles: { font: englishFont, fontSize: 10, cellPadding: 8, textColor: [31, 41, 55] },
      headStyles: { fillColor: [236, 253, 245], textColor: [6, 78, 59], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }

  const itemsStartY = (doc.lastAutoTable?.finalY || (partiesStartY + 140)) + 18;
  const lineItems = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];
  autoTable(doc, {
    startY: itemsStartY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [[
      '#',
      'Description\nالوصف',
      'Qty\nالكمية',
      'Unit Price\nسعر الوحدة',
      'Tax\nالضريبة',
      'Total\nالإجمالي',
    ]],
    body: lineItems.map((line, index) => ([
      String(index + 1),
      [normalizeText(line?.productName), normalizeText(line?.productNameAr)].filter(Boolean).join('\n'),
      String(Number(line?.quantity || 0)),
      toMoney(line?.unitPrice, invoice?.currency),
      `${Number(line?.taxRate || 0).toFixed(2)}%`,
      toMoney(line?.lineTotalWithTax || line?.lineTotal, invoice?.currency),
    ])),
    styles: { font: englishFont, fontSize: 9.5, cellPadding: 7, textColor: [31, 41, 55], valign: 'middle' },
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      1: { cellWidth: 180 },
    },
  });

  let footerY = (doc.lastAutoTable?.finalY || itemsStartY) + 18;
  if (footerY > 720) {
    doc.addPage();
    footerY = 56;
  }

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth - margin - 190, footerY, 190, 92, 14, 14, 'FD');
  setDocFont(doc, englishFont, 'normal', 10.5);
  doc.text(`Subtotal / الإجمالي الفرعي`, pageWidth - margin - 176, footerY + 22);
  doc.text(toMoney(invoice?.subtotal, invoice?.currency), pageWidth - margin - 12, footerY + 22, { align: 'right' });
  doc.text(`Tax / الضريبة`, pageWidth - margin - 176, footerY + 44);
  doc.text(toMoney(invoice?.totalTax, invoice?.currency), pageWidth - margin - 12, footerY + 44, { align: 'right' });
  setDocFont(doc, englishFont, 'bold', 12.5);
  doc.text(`Grand Total / الإجمالي`, pageWidth - margin - 176, footerY + 70);
  doc.text(toMoney(invoice?.grandTotal, invoice?.currency), pageWidth - margin - 12, footerY + 70, { align: 'right' });

  if (invoice?.notes) {
    setDocFont(doc, englishFont, 'bold', 11);
    doc.text('Notes / ملاحظات', margin, footerY + 18);
    setDocFont(doc, englishFont, 'normal', 10);
    doc.text(normalizeText(invoice.notes), margin, footerY + 38, { maxWidth: pageWidth - margin * 2 - 210 });
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
};

export const buildInvoicePdfAttachment = async ({ invoice, tenant, customerName, language = 'bilingual' }) => {
  const filename = `${sanitizeFileName(invoice?.invoiceNumber || 'invoice')}.pdf`;
  const content = await buildInvoicePdfBuffer({ invoice, tenant, customerName, language });
  return {
    filename,
    content,
    contentType: 'application/pdf',
    size: content.length,
  };
};
