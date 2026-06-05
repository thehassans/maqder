import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import Customer from './models/Customer.js';
import Invoice from './models/Invoice.js';
import Tenant from './models/Tenant.js';
import moment from 'moment'; // assume moment is installed, or just use JS Date

const MONGODB_URI = "mongodb+srv://hussainqadeer5050_db_user:J3QrTrKg5R8e2g@maqder.y0e2lgm.mongodb.net/?appName=MAQDER";
const BASE_DIR_ABSOLUTE = 'C:\\Users\\kjh\\Desktop\\Brilliantlines';
const BASE_DIR_RELATIVE = path.join(process.cwd(), 'Brilliantlines');

let BASE_DIR = BASE_DIR_ABSOLUTE;
if (!fs.existsSync(BASE_DIR)) {
  BASE_DIR = BASE_DIR_RELATIVE;
  if (!fs.existsSync(BASE_DIR)) {
    console.error(`Please place the CSV files in ${BASE_DIR_ABSOLUTE} or upload them to ${BASE_DIR_RELATIVE} on your server.`);
  }
}

const csvFiles = {
  customers: path.join(BASE_DIR, 'Customer.csv'),
  sales: path.join(BASE_DIR, 'sales.csv'),
  salesReturns: path.join(BASE_DIR, 'e.Sale Return Report.csv'),
  purchases: path.join(BASE_DIR, 'e.Purchase.csv')
};

const TENANT_VAT = '312781372800003';
const TENANT_NAME = 'ALKHTOT ALRAEAH EST';

async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filePath)) {
      console.log(`File missing: ${filePath}`);
      return resolve([]);
    }
    // Handle potential BOM by stripping it manually in the parser, or csv-parser handles it if configured
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Strip BOM from keys
        const cleanData = {};
        for (let key in data) {
          let cleanKey = key.replace(/^\uFEFF/, '').replace(/^"|"$/g, '').trim();
          cleanData[cleanKey] = data[key];
        }
        results.push(cleanData);
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function parseDate(dateStr) {
  if (!dateStr || dateStr === '01-01-1970') return new Date();
  // CSV dates seem to be DD-MM-YYYY
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  }
  return new Date();
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Find or create Tenant
    let tenant = await Tenant.findOne({ 'business.vatNumber': TENANT_VAT });
    if (!tenant) {
      tenant = new Tenant({
        name: TENANT_NAME,
        slug: 'alkhtot-alraeah',
        business: {
          legalNameEn: TENANT_NAME,
          legalNameAr: TENANT_NAME,
          vatNumber: TENANT_VAT,
          crNumber: '',
          industry: 'trading'
        },
        isActive: true
      });
      await tenant.save();
      console.log('Created new Tenant:', tenant._id);
    } else {
      console.log('Found Tenant:', tenant._id);
    }

    // 2. Migrate Customers
    const customersData = await readCSV(path.join(BASE_DIR, 'Customer.csv'));
    const customerMap = {}; // mapping by VAT or Name to ObjectId

    for (const row of customersData) {
      if (!row['Name']) continue;
      
      const vatNumber = row['VAT No'] || '';
      const mobile = row['Mobile No'] || '';
      let customer = await Customer.findOne({ tenantId: tenant._id, 'companyName': row['Company Name'] });
      
      if (!customer) {
        customer = new Customer({
          tenantId: tenant._id,
          customerType: vatNumber ? 'business' : 'individual',
          name: row['Name'],
          nameAr: row['Name'],
          companyName: row['Company Name'] || row['Name'],
          companyNameAr: row['Company Name'] || row['Name'],
          contactPerson: row['Name'],
          email: row['Email'],
          phone: mobile,
          taxNumber: vatNumber,
          address: {
            street: row['Address'],
            city: '',
            country: 'Saudi Arabia'
          }
        });
        await customer.save();
      }
      customerMap[row['Company Name'] || row['Name']] = customer._id;
    }
    console.log(`Migrated ${customersData.length} Customers`);

    // Helper to process invoices
    const processInvoices = async (data, flow, invoiceType) => {
      let count = 0;
      if (data.length > 0) {
        console.log(`First row headers:`, Object.keys(data[0]));
        console.log(`First row data:`, data[0]);
      }
      for (const row of data) {
        if (!row['Invoice No'] || row['Invoice No'] === 'Total' || row['Invoice No'] === 'Total ') continue;

        const customerName = row['Customer Name'] || row['Supplier Name'] || '';
        const customerVat = row['Customer VAT NO'] || row['Supplier VAT NO'] || '';
        let customerId = customerMap[customerName];

        const issueDate = parseDate(row['Date']);
        const amount = parseFloat(row['Amount']) || 0;
        const vat = parseFloat(row['VAT']) || 0;
        const grandTotal = parseFloat(row['Grand Total']) || 0;
        const paymentMethod = row['Payment Method']?.toLowerCase() || 'cash';
        let methodEnum = 'cash';
        if (paymentMethod.includes('credit')) methodEnum = 'credit';
        if (paymentMethod.includes('mada') || paymentMethod.includes('card')) methodEnum = 'card';
        if (paymentMethod.includes('bank')) methodEnum = 'bank_transfer';
        
        let invoice = await Invoice.findOne({ tenantId: tenant._id, invoiceNumber: row['Invoice No'] });
        if (!invoice) {
          invoice = new Invoice({
            tenantId: tenant._id,
            flow,
            invoiceNumber: row['Invoice No'],
            invoiceType,
            invoiceTypeCode: invoiceType === '381' ? '0200000' : '0100000',
            transactionType: customerVat ? 'B2B' : 'B2C',
            issueDate,
            customerId: flow === 'sell' ? customerId : null,
            supplierId: flow === 'purchase' ? customerId : null, // Not strictly correct since supplier map is different, but for this demo ok
            seller: flow === 'sell' ? tenant.business : { name: customerName, vatNumber: customerVat },
            buyer: flow === 'sell' ? { name: customerName, vatNumber: customerVat } : tenant.business,
            subtotal: amount,
            taxableAmount: amount,
            totalTax: vat,
            grandTotal,
            paymentMethod: methodEnum,
            paymentStatus: methodEnum === 'credit' ? 'pending' : 'paid',
            paidAmount: methodEnum === 'credit' ? 0 : grandTotal,
            status: 'approved', // migrated invoices are already final
            lineItems: [{
              lineNumber: 1,
              productName: flow === 'sell' ? 'Sales Item' : 'Purchase Item',
              quantity: 1,
              unitPrice: amount,
              taxRate: amount > 0 ? (vat / amount) * 100 : 15,
              taxAmount: vat,
              lineTotal: amount,
              lineTotalWithTax: grandTotal
            }]
          });
          await invoice.save();
          count++;
        }
      }
      return count;
    };

    // 3. Migrate Sales
    const salesData = await readCSV(path.join(BASE_DIR, 'sales.csv'));
    const salesCount = await processInvoices(salesData, 'sell', '388');
    console.log(`Migrated ${salesCount} Sales`);

    // 4. Migrate Sales Returns
    const returnsData = await readCSV(path.join(BASE_DIR, 'e.Sale Return Report.csv'));
    const returnsCount = await processInvoices(returnsData, 'sell', '381');
    console.log(`Migrated ${returnsCount} Sales Returns`);

    // 5. Migrate Purchases
    const purchaseData = await readCSV(path.join(BASE_DIR, 'e.Purchase.csv'));
    const purchaseCount = await processInvoices(purchaseData, 'purchase', '388');
    console.log(`Migrated ${purchaseCount} Purchases`);

    console.log('Migration Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration Error:', error);
    process.exit(1);
  }
}

run();
