import Invoice from '../models/Invoice.js';
import Expense from '../models/Expense.js';
import Employee from '../models/Employee.js';
import Payroll from '../models/Payroll.js';

const safeStr = (v) => String(v ?? '').trim();
const safeMoney = (v) => Number(v || 0).toFixed(2);
const safeDate = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US');
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
      .select('invoiceNumber issueDate buyer grandTotal totalTax subtotal status transactionType')
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

  const buffers = {};
  if (formats.includes('excel')) {
    buffers.excel = await buildExcelBuffer({ invoices, expenses, employees, payrolls, startDate, endDate });
  }
  if (formats.includes('pdf')) {
    buffers.pdf = await buildPdfBuffer({ invoices, expenses, employees, payrolls, startDate, endDate });
  }

  return {
    invoices,
    expenses,
    employees,
    payrolls,
    buffers,
  };
};

const buildExcelBuffer = async ({ invoices, expenses, employees, payrolls, startDate, endDate }) => {
  let XLSX;
  try {
    XLSX = (await import('xlsx')).default;
  } catch {
    return null;
  }

  const wb = XLSX.utils.book_new();
  wb.Props = { Title: 'Maqder ERP Tenant Backup', CreatedDate: new Date() };

  const invoiceRows = invoices.length
    ? invoices.map((inv) => ({
        'Invoice #': safeStr(inv.invoiceNumber),
        'Date': safeDate(inv.issueDate),
        'Customer': safeStr(inv.buyer?.name),
        'Type': safeStr(inv.transactionType),
        'Subtotal (SAR)': safeMoney(inv.subtotal),
        'VAT (SAR)': safeMoney(inv.totalTax),
        'Grand Total (SAR)': safeMoney(inv.grandTotal),
        'Status': safeStr(inv.status),
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

const buildPdfBuffer = async ({ invoices, expenses, employees, payrolls, startDate, endDate }) => {
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

  const totalRevenue = invoices.reduce((s, inv) => s + (Number(inv.grandTotal) || 0), 0);
  const totalExpenses = expenses.reduce((s, exp) => s + (Number(exp.amount) || 0), 0);
  const metrics = [
    { label: 'Invoices', value: String(invoices.length) },
    { label: 'Revenue', value: `SAR ${totalRevenue.toFixed(2)}` },
    { label: 'Expenses', value: String(expenses.length) },
    { label: 'Total Exp.', value: `SAR ${totalExpenses.toFixed(2)}` },
    { label: 'Employees', value: String(employees.length) },
    { label: 'Payrolls', value: String(payrolls.length) },
  ];
  const cardW = (pageW - 80 - 10 * (metrics.length - 1)) / metrics.length;
  metrics.forEach((m, i) => {
    const x = 40 + i * (cardW + 10);
    doc.setFillColor(244, 250, 246);
    doc.setDrawColor(209, 231, 215);
    doc.roundedRect(x, 56, cardW, 46, 6, 6, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 130, 110);
    doc.text(m.label, x + 6, 70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(m.value, x + 6, 88);
  });

  const autoTable = (doc, opts) => doc.autoTable(opts);

  const tableOptions = (startY, head, body) => ({
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
  });

  autoTable(doc, tableOptions(
    112,
    [['Invoice #', 'Date', 'Customer', 'Type', 'Subtotal', 'VAT', 'Total (SAR)', 'Status']],
    invoices.length
      ? invoices.map((inv) => [
          safeStr(inv.invoiceNumber),
          safeDate(inv.issueDate),
          safeStr(inv.buyer?.name),
          safeStr(inv.transactionType),
          safeMoney(inv.subtotal),
          safeMoney(inv.totalTax),
          safeMoney(inv.grandTotal),
          safeStr(inv.status),
        ])
      : [['—', '—', '—', '—', '—', '—', '—', 'No invoices in period']],
  ));

  autoTable(doc, tableOptions(
    doc.lastAutoTable.finalY + 18,
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

  autoTable(doc, tableOptions(
    doc.lastAutoTable.finalY + 18,
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
    autoTable(doc, tableOptions(
      doc.lastAutoTable.finalY + 18,
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

  const total = doc.getNumberOfPages();
  for (let pg = 1; pg <= total; pg++) {
    doc.setPage(pg);
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text(`Page ${pg} / ${total}`, pageW - 40, doc.internal.pageSize.getHeight() - 12, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleString('en-US')}`, 40, doc.internal.pageSize.getHeight() - 12);
  }

  return Buffer.from(doc.output('arraybuffer'));
};
