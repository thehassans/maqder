import Invoice from '../models/Invoice.js';
import Expense from '../models/Expense.js';
import Employee from '../models/Employee.js';
import Payroll from '../models/Payroll.js';

const TRAVEL_MARGIN_VAT_RATE = 15;
const safeStr = (v) => String(v ?? '').trim();
const toNumber = (v) => {
  const numericValue = Number(v);
  return Number.isFinite(numericValue) ? numericValue : 0;
};
const safeMoney = (v) => Number(v || 0).toFixed(2);
const safeDate = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US');
};

const getInvoiceZatcaStatus = (invoice = {}) => {
  const submissionStatus = safeStr(invoice?.zatca?.submissionStatus).toLowerCase();
  const invoiceStatus = safeStr(invoice?.status).toLowerCase();

  if (submissionStatus && submissionStatus !== 'pending') return submissionStatus;

  if (invoiceStatus === 'draft' && !invoice?.zatca?.signedXml) {
    return 'draft';
  }

  if (invoice?.zatca?.submittedAt) {
    return safeStr(invoice?.transactionType).toUpperCase() === 'B2C' ? 'reported' : 'submitted';
  }

  if (invoice?.zatca?.signedXml || invoice?.zatca?.invoiceHash) {
    return submissionStatus === 'pending' ? 'generated' : (submissionStatus || 'generated');
  }

  if (invoice?.zatca?.qrCodeData && !invoice?.zatca?.signedXml) {
    return invoiceStatus === 'pending' ? 'not_started' : (submissionStatus || 'draft');
  }

  return submissionStatus || 'not_started';
};

const getInvoiceZatcaLabel = (invoice = {}) => {
  const status = getInvoiceZatcaStatus(invoice);
  const labels = {
    cleared: 'Cleared',
    reported: 'Reported',
    submitted: 'Submitted',
    generated: 'E-Invoice Generated',
    rejected: 'Rejected',
    warning: 'Warning',
    draft: 'Draft',
    not_started: 'Not Submitted',
    pending: 'Processing',
  };
  return labels[status] || status || 'Not Submitted';
};

const getInvoiceEffectiveVat = (invoice = {}) => {
  const storedTax = toNumber(invoice?.totalTax);
  if (storedTax > 0) return storedTax;

  const lines = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];
  return lines.reduce((sum, line) => {
    if (line?.isTravelMargin) {
      const taxCategory = safeStr(line?.taxCategory).toUpperCase();
      if (taxCategory === 'S') {
        return sum + (toNumber(line?.marginTaxable) * (TRAVEL_MARGIN_VAT_RATE / 100));
      }
    }

    return sum + toNumber(line?.taxAmount);
  }, 0);
};

const getInvoiceCreatorName = (invoice = {}) => (
  safeStr(invoice?.createdByName)
  || safeStr(invoice?.createdByNameAr)
  || 'Unknown User'
);

const getInvoiceTravelAgencyCost = (invoice = {}) => {
  const lines = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];
  return lines.reduce((sum, line) => (
    line?.isTravelMargin
      ? sum + (toNumber(line?.quantity) * toNumber(line?.agencyPrice))
    : sum
  ), 0);
};

const getInvoiceCustomerRevenue = (invoice = {}) => {
  const lines = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];
  const travelCustomerRevenue = lines.reduce((sum, line) => {
    if (!line?.isTravelMargin) return sum;

    const lineTotalWithTax = toNumber(line?.lineTotalWithTax);
    if (lineTotalWithTax > 0) return sum + lineTotalWithTax;

    return sum + (toNumber(line?.quantity) * (toNumber(line?.customerPrice) || toNumber(line?.unitPrice)));
  }, 0);

  if (travelCustomerRevenue > 0) {
    const nonTravelRevenue = Math.max(0, toNumber(invoice?.grandTotal) - lines.reduce((sum, line) => (
      line?.isTravelMargin ? sum + toNumber(line?.lineTotalWithTax) : sum
    ), 0));
    return travelCustomerRevenue + nonTravelRevenue;
  }

  return toNumber(invoice?.grandTotal);
};

const getInvoiceTravelMarginProfit = (invoice = {}) => {
  const lines = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];
  return lines.reduce((sum, line) => {
    if (!line?.isTravelMargin) return sum;

    const customerAmount = toNumber(line?.lineTotalWithTax) || (toNumber(line?.quantity) * (toNumber(line?.customerPrice) || toNumber(line?.unitPrice)));
    const agencyCost = toNumber(line?.quantity) * toNumber(line?.agencyPrice);
    const vatAmount = toNumber(line?.taxAmount)
      || (safeStr(line?.taxCategory).toUpperCase() === 'S' ? (toNumber(line?.marginTaxable) * (TRAVEL_MARGIN_VAT_RATE / 100)) : 0);

    return sum + Math.max(0, customerAmount - agencyCost - vatAmount);
  }, 0);
};

const buildBackupSummary = ({ invoices, expenses, employees, payrolls }) => {
  const normalizedInvoices = invoices.map((invoice) => ({
    ...invoice,
    effectiveVat: getInvoiceEffectiveVat(invoice),
    creatorName: getInvoiceCreatorName(invoice),
    zatcaStatus: getInvoiceZatcaStatus(invoice),
    zatcaStatusLabel: getInvoiceZatcaLabel(invoice),
    customerRevenue: getInvoiceCustomerRevenue(invoice),
    travelAgencyCost: getInvoiceTravelAgencyCost(invoice),
    travelMarginProfit: getInvoiceTravelMarginProfit(invoice),
  }));

  const totalRevenue = normalizedInvoices.reduce((sum, invoice) => sum + toNumber(invoice?.grandTotal), 0);
  const totalSubtotal = normalizedInvoices.reduce((sum, invoice) => sum + toNumber(invoice?.subtotal), 0);
  const totalVat = normalizedInvoices.reduce((sum, invoice) => sum + toNumber(invoice?.effectiveVat), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + toNumber(expense?.amount), 0);
  const totalPayroll = payrolls.reduce((sum, payroll) => sum + toNumber(payroll?.totalSalary), 0);
  const totalCustomerRevenue = normalizedInvoices.reduce((sum, invoice) => sum + toNumber(invoice?.customerRevenue), 0);
  const totalTravelAgencyCost = normalizedInvoices.reduce((sum, invoice) => sum + toNumber(invoice?.travelAgencyCost), 0);
  const totalTravelMarginProfit = normalizedInvoices.reduce((sum, invoice) => sum + toNumber(invoice?.travelMarginProfit), 0);
  const totalInvoiceProfit = normalizedInvoices.reduce((sum, invoice) => (
    sum + Math.max(0, toNumber(invoice?.customerRevenue) - toNumber(invoice?.travelAgencyCost) - toNumber(invoice?.effectiveVat))
  ), 0);
  const totalProfit = totalInvoiceProfit - totalExpenses - totalPayroll;
  const averageInvoiceValue = normalizedInvoices.length ? (totalRevenue / normalizedInvoices.length) : 0;

  const invoiceCreators = Object.values(normalizedInvoices.reduce((acc, invoice) => {
    const key = invoice.creatorName;
    if (!acc[key]) {
      acc[key] = {
        creatorName: key,
        invoiceCount: 0,
        subtotal: 0,
        vat: 0,
        total: 0,
        profit: 0,
      };
    }

    acc[key].invoiceCount += 1;
    acc[key].subtotal += toNumber(invoice?.subtotal);
    acc[key].vat += toNumber(invoice?.effectiveVat);
    acc[key].total += toNumber(invoice?.grandTotal);
    acc[key].profit += Math.max(0, toNumber(invoice?.customerRevenue) - toNumber(invoice?.travelAgencyCost) - toNumber(invoice?.effectiveVat));
    return acc;
  }, {})).sort((a, b) => b.total - a.total || b.invoiceCount - a.invoiceCount || a.creatorName.localeCompare(b.creatorName));

  const transactionSummary = normalizedInvoices.reduce((acc, invoice) => {
    const key = safeStr(invoice?.transactionType).toUpperCase() === 'B2B' ? 'B2B' : 'B2C';
    if (!acc[key]) {
      acc[key] = { count: 0, subtotal: 0, vat: 0, total: 0 };
    }

    acc[key].count += 1;
    acc[key].subtotal += toNumber(invoice?.subtotal);
    acc[key].vat += toNumber(invoice?.effectiveVat);
    acc[key].total += toNumber(invoice?.grandTotal);
    return acc;
  }, {
    B2B: { count: 0, subtotal: 0, vat: 0, total: 0 },
    B2C: { count: 0, subtotal: 0, vat: 0, total: 0 },
  });

  return {
    invoices: normalizedInvoices,
    counts: {
      invoices: normalizedInvoices.length,
      expenses: expenses.length,
      employees: employees.length,
      payrolls: payrolls.length,
    },
    totalRevenue,
    totalSubtotal,
    totalVat,
    totalCustomerRevenue,
    totalExpenses,
    totalPayroll,
    totalInvoiceProfit,
    totalTravelAgencyCost,
    totalTravelMarginProfit,
    totalProfit,
    averageInvoiceValue,
    invoiceCreators,
    transactionSummary,
  };
};

export const resolvePeriodDates = ({ period, startDate: customStart, endDate: customEnd }) => {
  const now = new Date();
  if (period === 'weekly') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { startDate: start, endDate: now };
  }
  if (period === 'monthly') {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 1);
    return { startDate: start, endDate: now };
  }
  if (period === 'custom' && customStart && customEnd) {
    return { startDate: new Date(customStart), endDate: new Date(customEnd) };
  }
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  return { startDate: start, endDate: now };
};

export const buildTenantBackup = async ({ tenantId, startDate, endDate, formats = ['excel', 'pdf'] }) => {
  const [invoices, expenses, employees, payrolls] = await Promise.all([
    Invoice.find({ tenantId, issueDate: { $gte: startDate, $lte: endDate } })
      .select('invoiceNumber issueDate buyer grandTotal totalTax subtotal status transactionType zatca createdByName createdByNameAr lineItems.taxAmount lineItems.lineTotal lineItems.lineTotalWithTax lineItems.unitPrice lineItems.customerPrice lineItems.isTravelMargin lineItems.taxCategory lineItems.marginTaxable lineItems.agencyPrice lineItems.quantity')
      .lean(),
    Expense.find({ tenantId, date: { $gte: startDate, $lte: endDate } })
      .select('title category amount currency date status notes')
      .lean(),
    Employee.find({ tenantId, isActive: true })
      .select('firstName lastName firstNameAr lastNameAr department position nationalId salary iqamaNumber')
      .lean(),
    Payroll.find({ tenantId, 'period.startDate': { $gte: startDate }, 'period.endDate': { $lte: endDate } })
      .select('month year totalSalary status employee period')
      .lean(),
  ]);

  const summary = buildBackupSummary({ invoices, expenses, employees, payrolls });
  const normalizedInvoices = summary.invoices;

  const buffers = {};
  if (formats.includes('excel')) {
    buffers.excel = await buildExcelBuffer({ invoices: normalizedInvoices, expenses, employees, payrolls, startDate, endDate, summary });
  }
  if (formats.includes('pdf')) {
    buffers.pdf = await buildPdfBuffer({ invoices: normalizedInvoices, expenses, employees, payrolls, startDate, endDate, summary });
  }

  return {
    invoices: normalizedInvoices,
    expenses,
    employees,
    payrolls,
    summary,
    buffers,
  };
};

const buildExcelBuffer = async ({ invoices, expenses, employees, payrolls, startDate, endDate, summary }) => {
  let XLSX;
  try {
    XLSX = (await import('xlsx')).default;
  } catch {
    return null;
  }

  const wb = XLSX.utils.book_new();
  wb.Props = { Title: 'Maqder ERP Tenant Backup', CreatedDate: new Date() };

  const summaryRows = [
    { Metric: 'Period Start', Value: safeDate(startDate) },
    { Metric: 'Period End', Value: safeDate(endDate) },
    { Metric: 'Invoices', Value: summary.counts.invoices },
    { Metric: 'Expenses', Value: summary.counts.expenses },
    { Metric: 'Employees', Value: summary.counts.employees },
    { Metric: 'Payroll Records', Value: summary.counts.payrolls },
    { Metric: 'Revenue (SAR)', Value: safeMoney(summary.totalRevenue) },
    { Metric: 'Customer Revenue (SAR)', Value: safeMoney(summary.totalCustomerRevenue) },
    { Metric: 'Taxable Revenue (SAR)', Value: safeMoney(summary.totalSubtotal) },
    { Metric: 'VAT (SAR)', Value: safeMoney(summary.totalVat) },
    { Metric: 'Invoice Profit Before Overheads (SAR)', Value: safeMoney(summary.totalInvoiceProfit) },
    { Metric: 'Expenses Total (SAR)', Value: safeMoney(summary.totalExpenses) },
    { Metric: 'Payroll Total (SAR)', Value: safeMoney(summary.totalPayroll) },
    { Metric: 'Total Profit (SAR)', Value: safeMoney(summary.totalProfit) },
    { Metric: 'Travel Agency Cost (SAR)', Value: safeMoney(summary.totalTravelAgencyCost) },
    { Metric: 'Travel Margin Profit (SAR)', Value: safeMoney(summary.totalTravelMarginProfit) },
    { Metric: 'Average Invoice Value (SAR)', Value: safeMoney(summary.averageInvoiceValue) },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');

  const creatorRows = summary.invoiceCreators.length
    ? summary.invoiceCreators.map((row) => ({
        'Created By': row.creatorName,
        'Invoice Count': row.invoiceCount,
        'Subtotal (SAR)': safeMoney(row.subtotal),
        'VAT (SAR)': safeMoney(row.vat),
        'Grand Total (SAR)': safeMoney(row.total),
        'Profit (SAR)': safeMoney(row.profit),
      }))
    : [{ Note: 'No invoice creator data available' }];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(creatorRows), 'Invoice Creators');

  const transactionRows = ['B2B', 'B2C'].map((type) => ({
    'Transaction Type': type,
    'Invoice Count': summary.transactionSummary[type]?.count || 0,
    'Subtotal (SAR)': safeMoney(summary.transactionSummary[type]?.subtotal || 0),
    'VAT (SAR)': safeMoney(summary.transactionSummary[type]?.vat || 0),
    'Grand Total (SAR)': safeMoney(summary.transactionSummary[type]?.total || 0),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transactionRows), 'Transaction Summary');

  const invoiceRows = invoices.length
    ? invoices.map((inv) => ({
        'Invoice #': safeStr(inv.invoiceNumber),
        'Date': safeDate(inv.issueDate),
        'Customer': safeStr(inv.buyer?.name),
        'Created By': safeStr(inv.creatorName),
        'Type': safeStr(inv.transactionType),
        'Subtotal (SAR)': safeMoney(inv.subtotal),
        'VAT (SAR)': safeMoney(inv.effectiveVat),
        'Grand Total (SAR)': safeMoney(inv.grandTotal),
        'Profit (SAR)': safeMoney(Math.max(0, toNumber(inv?.customerRevenue) - toNumber(inv?.travelAgencyCost) - toNumber(inv?.effectiveVat))),
        'ZATCA Status': safeStr(inv.zatcaStatusLabel),
      }))
    : [{ Note: `No invoices between ${safeDate(startDate)} and ${safeDate(endDate)}` }];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoiceRows), 'Invoices');

  const expenseRows = expenses.length
    ? expenses.map((exp) => ({
        'Title': safeStr(exp.title),
        'Category': safeStr(exp.category),
        'Date': safeDate(exp.date),
        'Amount': safeMoney(exp.amount),
        'Currency': safeStr(exp.currency) || 'SAR',
        'Status': safeStr(exp.status),
        'Notes': safeStr(exp.notes),
      }))
    : [{ Note: `No expenses between ${safeDate(startDate)} and ${safeDate(endDate)}` }];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseRows), 'Expenses');

  const employeeRows = employees.length
    ? employees.map((emp) => ({
        'Full Name (EN)': `${safeStr(emp.firstName)} ${safeStr(emp.lastName)}`,
        'Full Name (AR)': `${safeStr(emp.firstNameAr)} ${safeStr(emp.lastNameAr)}`,
        'Department': safeStr(emp.department),
        'Position': safeStr(emp.position),
        'Basic Salary (SAR)': safeMoney(emp.salary?.basic),
        'National ID': safeStr(emp.nationalId),
        'Iqama #': safeStr(emp.iqamaNumber),
      }))
    : [{ Note: 'No active employees' }];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(employeeRows), 'Employees');

  const payrollRows = payrolls.length
    ? payrolls.map((p) => ({
        'Month': safeStr(p.month),
        'Year': safeStr(p.year),
        'Period Start': safeDate(p.period?.startDate),
        'Period End': safeDate(p.period?.endDate),
        'Total Salary (SAR)': safeMoney(p.totalSalary),
        'Status': safeStr(p.status),
      }))
    : [{ Note: `No payroll records between ${safeDate(startDate)} and ${safeDate(endDate)}` }];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payrollRows), 'Payroll');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

const labelZatcaStatus = (inv) => {
const label = safeStr(inv?.zatcaStatusLabel);
if (label) return label;
return getInvoiceZatcaLabel(inv);
};

const buildPdfBuffer = async ({ invoices, expenses, employees, payrolls, startDate, endDate, summary }) => {
let jsPDF;
try {
({ jsPDF } = await import('jspdf'));
await import('jspdf-autotable');
} catch {
return null;
}

const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
const pageW = doc.internal.pageSize.getWidth();
const periodText = `${safeDate(startDate)} — ${safeDate(endDate)}`;

const drawPageHeader = (title = 'Maqder ERP — Tenant Backup Report') => {
doc.setFillColor(26, 61, 40);
doc.rect(0, 0, pageW, 46, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.setTextColor(255, 255, 255);
doc.text(title, 40, 29);
doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.setTextColor(200, 230, 210);
doc.text(`Period: ${periodText}`, 40, 42);
};

drawPageHeader();

const totalRevenue = toNumber(summary?.totalRevenue);
const totalSubtotal = toNumber(summary?.totalSubtotal);
const totalVat = toNumber(summary?.totalVat);
const totalExpAmt = toNumber(summary?.totalExpenses);
const totalPayroll = toNumber(summary?.totalPayroll);
const totalProfit = toNumber(summary?.totalProfit);
const totalTravelAgencyCost = toNumber(summary?.totalTravelAgencyCost);
const totalTravelMarginProfit = toNumber(summary?.totalTravelMarginProfit);

const metrics = [
{ label: 'Invoices', value: String(summary?.counts?.invoices || invoices.length) },
{ label: 'Revenue', value: `SAR ${totalRevenue.toFixed(2)}` },
{ label: 'VAT Collected', value: `SAR ${totalVat.toFixed(2)}` },
{ label: 'Total Profit', value: `SAR ${totalProfit.toFixed(2)}` },
{ label: 'Payroll', value: `SAR ${totalPayroll.toFixed(2)}` },
{ label: 'Employees', value: String(summary?.counts?.employees || employees.length) },
];
const cardW = (pageW - 80 - 10 * (metrics.length - 1)) / metrics.length;
metrics.forEach((m, i) => {
const x = 40 + i * (cardW + 10);
const isNeg = m.label === 'Total Profit' && totalProfit < 0;
doc.setFillColor(isNeg ? 254 : 244, isNeg ? 242 : 250, isNeg ? 242 : 246);
doc.setDrawColor(isNeg ? 252 : 209, isNeg ? 165 : 231, isNeg ? 165 : 215);
doc.roundedRect(x, 56, cardW, 46, 6, 6, 'FD');
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(100, 130, 110);
doc.text(m.label, x + 6, 70);
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(isNeg ? 185 : 15, isNeg ? 28 : 23, isNeg ? 28 : 42);
doc.text(m.value, x + 6, 88);
});

const autoTable = (doc, opts) => doc.autoTable(opts);

const tableOptions = (startY, head, body, extraOpts = {}) => ({
startY,
head,
body,
headStyles: { fillColor: [26, 61, 40], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
alternateRowStyles: { fillColor: [248, 252, 249] },
margin: { left: 40, right: 40 },
styles: { fontSize: 8, textColor: [31, 41, 55], cellPadding: 4 },
didDrawPage: ({ pageNumber }) => {
if (pageNumber > 1) {
doc.setFillColor(26, 61, 40);
doc.rect(0, 0, pageW, 18, 'F');
doc.setFontSize(7);
doc.setTextColor(200, 230, 210);
doc.text('Maqder ERP — Tenant Backup Report', 40, 12);
}
},
...extraOpts,
});

const sectionTitle = (y, title) => {
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.setTextColor(26, 61, 40);
doc.text(title, 40, y);
doc.setDrawColor(209, 231, 215);
doc.line(40, y + 3, pageW - 40, y + 3);
return y + 14;
};

let y = sectionTitle(116, 'Business Summary');
autoTable(doc, tableOptions(y, [['Category', 'Amount (SAR)']], [
['Total Invoice Revenue', totalRevenue.toFixed(2)],
['Customer Revenue', toNumber(summary?.totalCustomerRevenue).toFixed(2)],
['Taxable Amount (excl. VAT)', totalSubtotal.toFixed(2)],
['Total VAT', totalVat.toFixed(2)],
['Invoice Profit Before Overheads', toNumber(summary?.totalInvoiceProfit).toFixed(2)],
['Total Expenses', totalExpAmt.toFixed(2)],
['Total Payroll', totalPayroll.toFixed(2)],
['Total Profit', totalProfit.toFixed(2)],
['Travel Agency Cost', totalTravelAgencyCost.toFixed(2)],
['Travel Margin Profit', totalTravelMarginProfit.toFixed(2)],
['Average Invoice Value', toNumber(summary?.averageInvoiceValue).toFixed(2)],
], { tableWidth: 'wrap', columnStyles: { 0: { cellWidth: 260 }, 1: { cellWidth: 120, halign: 'right' } } }));

const b2bSummary = summary?.transactionSummary?.B2B || { count: 0, subtotal: 0, vat: 0, total: 0 };
const b2cSummary = summary?.transactionSummary?.B2C || { count: 0, subtotal: 0, vat: 0, total: 0 };
y = sectionTitle(doc.lastAutoTable.finalY + 16, 'VAT Summary');
autoTable(doc, tableOptions(y, [['Transaction Type', 'Count', 'Taxable (SAR)', 'VAT (SAR)', 'Total (SAR)']], [
['B2B (Tax Invoice)', String(b2bSummary.count || 0), toNumber(b2bSummary.subtotal).toFixed(2), toNumber(b2bSummary.vat).toFixed(2), toNumber(b2bSummary.total).toFixed(2)],
['B2C (Simplified Invoice)', String(b2cSummary.count || 0), toNumber(b2cSummary.subtotal).toFixed(2), toNumber(b2cSummary.vat).toFixed(2), toNumber(b2cSummary.total).toFixed(2)],
['TOTAL', String(summary?.counts?.invoices || invoices.length), totalSubtotal.toFixed(2), totalVat.toFixed(2), totalRevenue.toFixed(2)],
], { columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } } }));

y = sectionTitle(doc.lastAutoTable.finalY + 16, 'Invoices by Creator');
autoTable(doc, tableOptions(
y,
[['Created By', 'Invoice Count', 'Subtotal (SAR)', 'VAT (SAR)', 'Grand Total (SAR)', 'Profit (SAR)']],
summary?.invoiceCreators?.length
? summary.invoiceCreators.map((row) => [
safeStr(row.creatorName),
String(row.invoiceCount),
safeMoney(row.subtotal),
safeMoney(row.vat),
safeMoney(row.total),
safeMoney(row.profit),
])
: [['No creator data', '0', '0.00', '0.00', '0.00', '0.00']],
{ columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } } },
));

y = sectionTitle(doc.lastAutoTable.finalY + 16, 'Invoice Details');
autoTable(doc, tableOptions(
y,
[['Invoice #', 'Date', 'Customer', 'Created By', 'Type', 'Subtotal', 'VAT', 'Total', 'Profit', 'ZATCA']],
invoices.length
? invoices.map((inv) => [
safeStr(inv.invoiceNumber),
safeDate(inv.issueDate),
safeStr(inv.buyer?.name),
safeStr(inv.creatorName),
safeStr(inv.transactionType),
safeMoney(inv.subtotal),
safeMoney(inv.effectiveVat),
safeMoney(inv.grandTotal),
safeMoney(Math.max(0, toNumber(inv?.customerRevenue) - toNumber(inv?.travelAgencyCost) - toNumber(inv?.effectiveVat))),
labelZatcaStatus(inv),
])
: [['—', '—', '—', '—', '—', '—', '—', '—', '—', 'No invoices in period']],
{ styles: { fontSize: 7, cellPadding: 3 } },
));

y = sectionTitle(doc.lastAutoTable.finalY + 16, 'Expenses');
autoTable(doc, tableOptions(
y,
[['Title', 'Category', 'Date', 'Amount', 'Currency', 'Status']],
expenses.length
? expenses.map((exp) => [
safeStr(exp.title),
safeStr(exp.category),
safeDate(exp.date),
safeMoney(exp.amount),
safeStr(exp.currency) || 'SAR',
safeStr(exp.status),
])
: [['—', '—', '—', '—', '—', 'No expenses in period']],
));

y = sectionTitle(doc.lastAutoTable.finalY + 16, 'Employees');
autoTable(doc, tableOptions(
y,
[['Name (EN)', 'Name (AR)', 'Department', 'Position', 'Basic Salary (SAR)']],
employees.length
? employees.map((emp) => [
`${safeStr(emp.firstName)} ${safeStr(emp.lastName)}`,
`${safeStr(emp.firstNameAr)} ${safeStr(emp.lastNameAr)}`,
safeStr(emp.department),
safeStr(emp.position),
safeMoney(emp.salary?.basic),
])
: [['—', '—', '—', '—', 'No active employees']],
));

if (payrolls.length) {
y = sectionTitle(doc.lastAutoTable.finalY + 16, 'Payroll');
autoTable(doc, tableOptions(
y,
[['Month', 'Year', 'Period Start', 'Period End', 'Total Salary (SAR)', 'Status']],
payrolls.map((p) => [
safeStr(p.month),
safeStr(p.year),
safeDate(p.period?.startDate),
safeDate(p.period?.endDate),
safeMoney(p.totalSalary),
safeStr(p.status),
]),
));
}

const totalPages = doc.getNumberOfPages();
for (let pg = 1; pg <= totalPages; pg++) {
doc.setPage(pg);
doc.setFontSize(8);
doc.setTextColor(160);
doc.text(`Page ${pg} / ${totalPages}`, pageW - 40, doc.internal.pageSize.getHeight() - 12, { align: 'right' });
doc.text(`Generated: ${new Date().toLocaleString('en-US')}`, 40, doc.internal.pageSize.getHeight() - 12);
}

return Buffer.from(doc.output('arraybuffer'));
};
