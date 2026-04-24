import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const safeText = (value) => String(value ?? '').replace(/[\u200e\u200f\u061c]/g, '').replace(/﷼/g, 'SAR').replace(/\s+/g, ' ').trim();

const formatDate = (value, language = 'en') => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
};

const formatMoney = (value, currency = 'SAR') => {
  const amount = Number(value || 0);
  return `${String(currency || 'SAR').trim().toUpperCase()} ${amount.toFixed(2)}`;
};

const buildHeader = ({ doc, title, periodText }) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(20, 184, 166);
  doc.rect(0, 0, pageWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(safeText(title), 40, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(safeText(periodText), 40, 62);
};

const addFooter = (doc) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalPages = doc.getNumberOfPages();
  for (let index = 1; index <= totalPages; index += 1) {
    doc.setPage(index);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Page ${index} / ${totalPages}`, pageWidth - 40, pageHeight - 20, { align: 'right' });
  }
};

const drawMetricGrid = (doc, cards) => {
  const margin = 40;
  const gap = 12;
  const width = doc.internal.pageSize.getWidth();
  const cardWidth = (width - margin * 2 - gap) / 2;
  const cardHeight = 58;
  let y = 82;

  cards.forEach((card, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + column * (cardWidth + gap);
    y = 82 + row * (cardHeight + gap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, cardWidth, cardHeight, 12, 12, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(safeText(card.label), x + 12, y + 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(safeText(card.value), x + 12, y + 40);
  });

  return y + cardHeight + 24;
};

const buildVatPdfBuffer = ({ report, language }) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const currency = report?.currency || 'SAR';
  const periodText = `${language === 'ar' ? 'الفترة' : 'Period'}: ${formatDate(report?.period?.startDate, language)} - ${formatDate(report?.period?.endDate, language)}`;
  buildHeader({ doc, title: language === 'ar' ? 'تقرير إقرار ضريبة القيمة المضافة' : 'VAT Return Report', periodText });

  const startY = drawMetricGrid(doc, [
    { label: language === 'ar' ? 'عدد الفواتير' : 'Invoices', value: safeText(report?.totals?.invoiceCount || 0) },
    { label: language === 'ar' ? 'المبلغ الخاضع للضريبة' : 'Taxable Amount', value: formatMoney(report?.totals?.taxableAmount, currency) },
    { label: language === 'ar' ? 'إجمالي الضريبة' : 'Total VAT', value: formatMoney(report?.totals?.totalTax, currency) },
    { label: language === 'ar' ? 'صافي الضريبة المستحقة' : 'Net VAT Due', value: formatMoney(report?.vatReturn?.statement?.netVatDue?.vatAmount, currency) },
  ]);

  autoTable(doc, {
    startY,
    head: [[language === 'ar' ? 'التصنيف' : 'Category', language === 'ar' ? 'خاضع للضريبة' : 'Taxable', language === 'ar' ? 'الضريبة' : 'VAT']],
    body: [
      [language === 'ar' ? 'قياسي' : 'Standard Rated', formatMoney(report?.totals?.byCategory?.standardRated?.taxableAmount, currency), formatMoney(report?.totals?.byCategory?.standardRated?.taxAmount, currency)],
      [language === 'ar' ? 'صفري' : 'Zero Rated', formatMoney(report?.totals?.byCategory?.zeroRated?.taxableAmount, currency), formatMoney(report?.totals?.byCategory?.zeroRated?.taxAmount, currency)],
      [language === 'ar' ? 'معفى' : 'Exempt', formatMoney(report?.totals?.byCategory?.exempt?.taxableAmount, currency), formatMoney(report?.totals?.byCategory?.exempt?.taxAmount, currency)],
      [language === 'ar' ? 'خارج النطاق' : 'Out of Scope', formatMoney(report?.totals?.byCategory?.outOfScope?.taxableAmount, currency), formatMoney(report?.totals?.byCategory?.outOfScope?.taxAmount, currency)],
    ],
    headStyles: { fillColor: [20, 184, 166], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9, textColor: [31, 41, 55] },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 18,
    head: [[language === 'ar' ? 'البند' : 'Line Item', language === 'ar' ? 'القيمة' : 'Value']],
    body: [
      [language === 'ar' ? 'إجمالي ضريبة الفترة الحالية' : 'Total VAT Due Current Period', formatMoney(report?.vatReturn?.statement?.totalVatDueCurrentPeriod?.vatAmount, currency)],
      [language === 'ar' ? 'تصحيحات الفترات السابقة' : 'Corrections Previous Period', formatMoney(report?.vatReturn?.statement?.correctionsPreviousPeriod?.vatAmount, currency)],
      [language === 'ar' ? 'رصيد ضريبة مرحل' : 'VAT Credit Carried Forward', formatMoney(report?.vatReturn?.statement?.vatCreditCarriedForward?.vatAmount, currency)],
      [language === 'ar' ? 'صافي الضريبة المستحقة' : 'Net VAT Due', formatMoney(report?.vatReturn?.statement?.netVatDue?.vatAmount, currency)],
    ],
    headStyles: { fillColor: [20, 184, 166], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9, textColor: [31, 41, 55] },
  });

  addFooter(doc);
  return Buffer.from(doc.output('arraybuffer'));
};

const buildBusinessPdfBuffer = ({ report, language }) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const currency = report?.currency || 'SAR';
  const periodText = `${language === 'ar' ? 'الفترة' : 'Period'}: ${formatDate(report?.period?.startDate, language)} - ${formatDate(report?.period?.endDate, language)}`;
  buildHeader({ doc, title: language === 'ar' ? 'تقرير الأعمال' : 'Business Report', periodText });

  const startY = drawMetricGrid(doc, [
    { label: language === 'ar' ? 'إجمالي المبيعات' : 'Sales Total', value: formatMoney(report?.totals?.sales?.grandTotal, currency) },
    { label: language === 'ar' ? 'إجمالي المشتريات' : 'Purchases Total', value: formatMoney(report?.totals?.purchases?.grandTotal, currency) },
    { label: language === 'ar' ? 'إجمالي المصاريف' : 'Expenses Total', value: formatMoney(report?.totals?.expenses?.totalAmount, currency) },
    { label: language === 'ar' ? 'الصافي' : 'Net', value: formatMoney(report?.totals?.net, currency) },
  ]);

  autoTable(doc, {
    startY,
    head: [[language === 'ar' ? 'النوع' : 'Type', language === 'ar' ? 'عدد الفواتير' : 'Invoices', language === 'ar' ? 'الإيراد' : 'Revenue', language === 'ar' ? 'الضريبة' : 'Tax']],
    body: (report?.breakdown?.salesByTransactionType || []).map((row) => [
      safeText(row?._id || '-'),
      safeText(row?.invoiceCount || 0),
      formatMoney(row?.revenue, currency),
      formatMoney(row?.tax, currency),
    ]),
    headStyles: { fillColor: [20, 184, 166], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9, textColor: [31, 41, 55] },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 18,
    head: [[language === 'ar' ? 'التصنيف' : 'Category', language === 'ar' ? 'العدد' : 'Count', language === 'ar' ? 'الإجمالي' : 'Total']],
    body: (report?.breakdown?.expensesByCategory || []).map((row) => [
      safeText(row?._id || '-'),
      safeText(row?.count || 0),
      formatMoney(row?.totalAmount, currency),
    ]),
    headStyles: { fillColor: [20, 184, 166], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9, textColor: [31, 41, 55] },
  });

  addFooter(doc);
  return Buffer.from(doc.output('arraybuffer'));
};

export const buildScheduledReportPdfAttachment = async ({ reportType, report, language = 'en' }) => {
  const normalizedType = reportType === 'business' ? 'business' : 'vat';
  const buffer = normalizedType === 'business'
    ? buildBusinessPdfBuffer({ report, language })
    : buildVatPdfBuffer({ report, language });
  const fileName = normalizedType === 'business' ? 'business_report.pdf' : 'vat_return_report.pdf';
  return {
    filename: fileName,
    content: buffer,
    contentType: 'application/pdf',
    size: buffer.length,
  };
};
