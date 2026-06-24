import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import Expense from '../models/Expense.js';
import KhayyatWorker from '../models/khayyat/KhayyatWorker.js';
import KhayyatFabric from '../models/khayyat/KhayyatFabric.js';
import KhayyatStitching from '../models/khayyat/KhayyatStitching.js';
import KhayyatPayment from '../models/khayyat/KhayyatPayment.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zatca-erp';
const DATA_DIR = 'C:/Users/kjh/Desktop/khayyatnil_extracted';
const USER_EMAIL = 'nabeel@maqder.com';

function readExcel(fileName) {
  const wb = XLSX.readFile(path.join(DATA_DIR, fileName));
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws);
}

function parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function parseNum(val) {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

async function importData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Find or create tenant + user
    let user = await User.findOne({ email: USER_EMAIL });
    let tenant;

    if (user && user.tenantId) {
      tenant = await Tenant.findById(user.tenantId);
    }

    if (!tenant) {
      console.log('No existing khayyat tenant found for user. Creating new tenant...');
      tenant = new Tenant({
        name: 'Khayyat Nil Tailoring',
        slug: 'khayyat-nil',
        businessType: 'khayyat',
        businessTypes: ['khayyat'],
        isActive: true,
        zatca: { phase: 1, isOnboarded: false },
        business: {
          legalNameEn: 'Khayyat Nil Tailoring',
          legalNameAr: 'خياط نيل',
          vatNumber: '',
          address: { city: 'Al Khobar', country: 'SA' },
        },
        settings: {
          useHijriDates: true,
          khayyat: { whatsappLanguage: 'both' },
        },
        subscription: {
          plan: 'professional',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'active',
        },
      });
      await tenant.save();
      console.log(`Created tenant: ${tenant.name} (${tenant._id})`);
    }

    const tenantId = tenant._id;
    console.log(`Using tenant: ${tenant.name} (${tenantId})`);
    console.log(`Business types: ${tenant.businessTypes?.join(', ')}`);

    // Ensure tenant has khayyat business type
    if (!tenant.businessTypes?.includes('khayyat')) {
      tenant.businessTypes = [...new Set([...(tenant.businessTypes || []), 'khayyat'])];
      if (!tenant.businessType) tenant.businessType = 'khayyat';
      await tenant.save();
      console.log('Added khayyat to tenant businessTypes');
    }

    // Create user if not exists
    if (!user) {
      console.log(`Creating user ${USER_EMAIL}...`);
      user = new User({
        tenantId,
        email: USER_EMAIL,
        password: 'Maqder@2024',
        firstName: 'Nabeel',
        lastName: 'Khayyat',
        role: 'admin',
        isActive: true,
        preferences: { language: 'ar', theme: 'light' },
      });
      await user.save();
      console.log(`Created user: ${USER_EMAIL}`);
    } else if (!user.tenantId) {
      user.tenantId = tenantId;
      await user.save();
      console.log(`Linked user ${USER_EMAIL} to tenant`);
    }

    // ==========================================
    // 2. Import Customers
    // ==========================================
    console.log('\n--- Importing Customers ---');
    const customerData = readExcel('Customer.xlsx');
    const customerMap = {}; // old CusNo -> new Customer._id
    let customerCount = 0;

    for (const row of customerData) {
      const name = String(row.CusName || '').trim();
      if (!name) continue;

      const phone = String(row.TelNo || '').trim();
      const existing = await Customer.findOne({ tenantId, name, phone });

      if (existing) {
        customerMap[row.CusNo] = existing._id;
        continue;
      }

      const customer = new Customer({
        tenantId,
        type: 'individual',
        name,
        customerCode: String(row.CusId || row.CusNo || '').trim(),
        phone,
        currentBalance: parseNum(row.Balance),
        notes: String(row.Notes || '').trim(),
        address: {
          city: 'Al Khobar',
          country: 'SA',
        },
        isActive: true,
      });
      await customer.save();
      customerMap[row.CusNo] = customer._id;
      customerCount++;
    }
    console.log(`Imported ${customerCount} new customers (${customerData.length} total in file)`);

    // Also import SalesCus as a customer (walk-in / sales customer)
    const salesCusData = readExcel('SalesCus.xlsx');
    for (const row of salesCusData) {
      const name = String(row.LocName || row.Title || '').trim();
      if (!name) continue;
      const existing = await Customer.findOne({ tenantId, name });
      if (!existing) {
        const customer = new Customer({
          tenantId,
          type: 'business',
          name,
          phone: String(row.TelNo || '').trim(),
          currentBalance: parseNum(row.Balance),
          notes: String(row.Notes || '').trim(),
          address: { city: String(row.Address || 'Al Khobar').trim(), country: 'SA' },
          isActive: true,
        });
        await customer.save();
        customerCount++;
      }
    }
    console.log(`Total customers processed: ${customerCount}`);

    // ==========================================
    // 3. Import Suppliers
    // ==========================================
    console.log('\n--- Importing Suppliers ---');
    const supplierData = readExcel('supplier.xlsx');
    const supplierMap = {};
    let supplierCount = 0;

    for (const row of supplierData) {
      const name = String(row.SupName || '').trim();
      if (!name) continue;
      const code = `SUP-${String(row.SupNo || '1').padStart(2, '0')}`;
      const existing = await Supplier.findOne({ tenantId, code });
      if (existing) {
        supplierMap[row.SupNo] = existing._id;
        continue;
      }
      const supplier = new Supplier({
        tenantId,
        code,
        nameEn: name,
        nameAr: name,
        phone: String(row.TelNo || '').trim(),
        address: {
          city: String(row.Address || 'Al Khobar').trim(),
          country: 'SA',
        },
        notes: String(row.Notes || '').trim(),
        isActive: true,
      });
      await supplier.save();
      supplierMap[row.SupNo] = supplier._id;
      supplierCount++;
    }
    console.log(`Imported ${supplierCount} suppliers`);

    // ==========================================
    // 4. Import Employees as KhayyatWorkers
    // ==========================================
    console.log('\n--- Importing Workers ---');
    const employeeData = readExcel('Employee.xlsx');
    const workerMap = {};
    let workerCount = 0;

    for (const row of employeeData) {
      const name = String(row.EmpName || '').trim();
      if (!name) continue;
      const phone = String(row.TelNo || '0000000000').trim() || '0000000000';
      const existing = await KhayyatWorker.findOne({ tenantId, name });
      if (existing) {
        workerMap[row.Empno] = existing._id;
        continue;
      }
      const worker = new KhayyatWorker({
        tenantId,
        name,
        phone,
        password: '1234',
        paymentType: 'salary',
        paymentAmount: parseNum(row.Salary),
        totalEarnings: 0,
        totalPaid: parseNum(row.Advance),
        isActive: String(row.Status) === '0',
      });
      await worker.save();
      workerMap[row.Empno] = worker._id;
      workerCount++;
    }
    console.log(`Imported ${workerCount} workers`);

    // ==========================================
    // 5. Import Textiles as KhayyatFabrics
    // ==========================================
    console.log('\n--- Importing Fabrics ---');
    const textileData = readExcel('Textiles.xlsx');
    let fabricCount = 0;

    for (const row of textileData) {
      const name = String(row.TexItem || '').trim();
      if (!name) continue;
      const existing = await KhayyatFabric.findOne({ tenantId, name });
      if (existing) continue;
      const fabric = new KhayyatFabric({
        tenantId,
        name,
        madeIn: String(row.brand || '').trim(),
        pricePerRoll: parseNum(row.CostPrice),
        rollsInStock: parseNum(row.Stock),
        stockMeters: parseNum(row.stkAmount),
        supplierId: supplierMap['1'] || null,
      });
      await fabric.save();
      fabricCount++;
    }
    console.log(`Imported ${fabricCount} fabrics`);

    // ==========================================
    // 6. Import Items & Models into tenant settings
    // ==========================================
    console.log('\n--- Importing Items & Models ---');
    const itemsData = readExcel('Items.xlsx');
    const modelsData = readExcel('Models.xlsx');

    const items = itemsData.map(r => ({
      no: parseNum(r.No),
      name: String(r.item || '').trim(),
      price: parseNum(r.PRICE),
      labourCharge: parseNum(r.LABOURCHARGE),
      description: String(r.Description || '').trim(),
    }));

    const models = modelsData.map(r => ({
      no: parseNum(r.No),
      name: String(r.item || '').trim(),
      description: String(r.Description || '').trim(),
    }));

    // Import all style option catalogs
    const styleCatalogs = {};
    const styleFiles = [
      'CllrStitch.xlsx', 'CollerCanvas.xlsx', 'cuffmodel.xlsx',
      'deliveryStatus.xlsx', 'JbzrButton.xlsx', 'JbzrModel.xlsx',
      'MobilePkt.xlsx', 'NckButton.xlsx', 'NckCanvas.xlsx',
      'NckModel.xlsx', 'NckStitch.xlsx', 'PagerPkt.xlsx',
      'SidePocket.xlsx', 'ThopStitch.xlsx',
    ];
    for (const f of styleFiles) {
      const key = f.replace('.xlsx', '');
      const rows = readExcel(f);
      styleCatalogs[key] = rows.map(r => ({
        no: parseNum(r.No),
        name: String(r.item || r.Item || '').trim(),
        description: String(r.Description || '').trim(),
      }));
    }

    // Import locations
    const locationData = readExcel('Location.xlsx');
    const locations = locationData.map(r => ({
      no: parseNum(r.LocNo),
      name: String(r.LocName || '').trim(),
      description: String(r.Description || '').trim(),
    }));

    // Store in tenant settings under khayyat
    if (!tenant.settings) tenant.settings = {};
    if (!tenant.settings.khayyat) tenant.settings.khayyat = {};
    tenant.settings.khayyat.importedData = {
      items,
      models,
      styleCatalogs,
      locations,
      importedAt: new Date().toISOString(),
      source: 'khayyatnil.zip',
    };
    await tenant.save();
    console.log(`Stored ${items.length} items, ${models.length} models, ${Object.keys(styleCatalogs).length} style catalogs, ${locations.length} locations in tenant settings`);

    // ==========================================
    // 7. Import Orders as KhayyatStitching records
    // ==========================================
    console.log('\n--- Importing Orders (Stitching Records) ---');
    const ordersData = readExcel('Orders.xlsx');
    const deliveryData = readExcel('Delivery.xlsx');
    let stitchingCount = 0;

    // Map thawbType from Model field
    const modelToThawbType = (model) => {
      const m = String(model || '').toUpperCase().trim();
      if (m.includes('HIJAZI') || m.includes('SAUDI')) return 'saudi';
      if (m.includes('QATAR')) return 'qatari';
      if (m.includes('KUWIT')) return 'kuwaiti';
      if (m.includes('OMANI')) return 'omani';
      if (m.includes('BAHAR')) return 'bahraini';
      if (m.includes('NOUM')) return 'noum';
      return 'saudi';
    };

    // Map delivery status
    const mapDeliveryStatus = (status) => {
      const s = String(status || '').toUpperCase().trim();
      if (s === 'NEW') return 'pending';
      if (s === 'PARTIAL') return 'in_progress';
      if (s === 'DELIVERED') return 'delivered';
      if (s === 'SALES') return 'done';
      return 'pending';
    };

    // Create missing customers referenced in orders but not in Customer.xlsx
    for (const row of ordersData) {
      const cusNo = String(row.CusNo || '');
      if (customerMap[cusNo]) continue;
      const name = String(row.CusName || '').trim();
      if (!name) continue;
      console.log(`  Creating missing customer CusNo=${cusNo}: ${name}`);
      const customer = new Customer({
        tenantId,
        type: 'individual',
        name,
        customerCode: cusNo,
        phone: String(row.TelNo || '').trim(),
        address: { city: 'Al Khobar', country: 'SA' },
        isActive: true,
      });
      await customer.save();
      customerMap[cusNo] = customer._id;
    }

    let receiptSeq = 1;
    for (const row of ordersData) {
      const cusNo = String(row.CusNo || '');
      const customerId = customerMap[cusNo];
      if (!customerId) {
        console.log(`  Skipping order ${row.OrderNo}: customer ${cusNo} not found`);
        continue;
      }

      const receiptNumber = `KHY-OLD-${String(receiptSeq++).padStart(4, '0')}`;
      const existing = await KhayyatStitching.findOne({ tenantId, receiptNumber });
      if (existing) continue;

      const orderDate = parseDate(row.Odate);
      const dueDate = parseDate(row.Ddate);
      const deliveryDate = parseDate(row.LdeliveryDt);

      // Determine status from delivery data
      const deliveryRow = deliveryData.find(d => String(d.OrderNo) === String(row.OrderNo));
      const status = deliveryRow
        ? mapDeliveryStatus(deliveryRow.DeliveryStatus || row.DeliveryStatus)
        : mapDeliveryStatus(row.DeliveryStatus);

      const stitching = new KhayyatStitching({
        tenantId,
        customerId,
        customerName: String(row.CusName || '').trim(),
        customerPhone: String(row.TelNo || '').trim(),
        workerId: workerMap[String(row.EmpNo || '')] || null,
        orderNumber: String(row.OrderNo || ''),
        receiptNumber,
        oldInvoiceNumber: String(row.OrderNo || ''),
        thawbType: modelToThawbType(row.Model),
        customFabricName: String(row.Cloth || '').trim(),
        measurements: {
          length: parseNum(String(row.Length || '').replace(/[^0-9.]/g, '').split(/[\/\s]/)[0]) || null,
          shoulderWidth: parseNum(String(row.Shoulder || '').replace(/[^0-9.]/g, '')) || null,
          chest: parseNum(String(row.Bloose || '').replace(/[^0-9.]/g, '')) || null,
          neck: parseNum(String(row.NeckSize || '').replace(/[^0-9.]/g, '')) || null,
          cuffWidth: parseNum(String(row.CuffSize || '').replace(/[^0-9.]/g, '')) || null,
          expansion: parseNum(String(row.Ssada || '').replace(/[^0-9.]/g, '').split(/[\/\s]/)[0]) || null,
        },
        styleOptions: {
          collar: String(row.CllrSize || row.CllrCanvas || '').trim() || null,
          bain: String(row.JbzrModel || '').trim() || null,
          cuff: String(row.CuffModel || '').trim() || null,
          pocket: String(row.FrontPkt || row.SidePkt || '').trim() || null,
          buttons: String(row.NckButton || row.JbzrBttn || '').trim() || null,
          embroidery: String(row.JbzrDsgn || '').trim() || null,
        },
        quantity: parseNum(row.ItmQty) || 1,
        price: parseNum(row.TotAmount) || parseNum(row.ItmPrice) || 0,
        paidAmount: parseNum(row.StlAmount) + parseNum(row.AdvAmount),
        status,
        notes: String(row.Notes || '').trim(),
        dueDate,
        completedDate: status === 'completed' || status === 'delivered' ? (deliveryDate || orderDate) : null,
        deliveredDate: status === 'delivered' ? (deliveryDate || orderDate) : null,
        description: `Item: ${row.Item || ''}, Model: ${row.Model || ''}, Cloth: ${row.Cloth || ''}, Yard: ${row.Yard || ''}`,
      });
      await stitching.save();
      stitchingCount++;
    }
    console.log(`Imported ${stitchingCount} stitching records`);

    // ==========================================
    // 8. Import BalanceSheet entries as Expenses
    // ==========================================
    console.log('\n--- Importing Balance Sheet ---');
    const balanceData = readExcel('BalanceSheet.xlsx');
    let expenseCount = 0;
    let expenseSeq = 1;

    for (const row of balanceData) {
      const description = String(row.Description || '').trim();
      const earn = parseNum(row.Earn);
      const expense = parseNum(row.Expense);
      const date = parseDate(row.SalD);

      if (earn === 0 && expense === 0) continue;

      // Create expense for the expense side
      if (expense > 0) {
        const expenseNumber = `BS-IMP-${String(expenseSeq++).padStart(4, '0')}`;
        const existing = await Expense.findOne({ tenantId, expenseNumber });
        if (!existing) {
          const exp = new Expense({
            tenantId,
            expenseNumber,
            expenseDate: date || new Date(),
            category: description.toLowerCase().includes('salary') ? 'salaries' : 'other',
            description,
            amount: expense,
            taxAmount: 0,
            totalAmount: expense,
            status: 'paid',
            paymentMethod: 'cash',
            paymentDate: date || new Date(),
            isActive: true,
          });
          await exp.save();
          expenseCount++;
        }
      }
    }
    console.log(`Imported ${expenseCount} expense records from balance sheet`);

    // ==========================================
    // 9. Import Iqama data for workers
    // ==========================================
    console.log('\n--- Importing Iqama Data ---');
    const iqamaData = readExcel('Iqama.xlsx');
    for (const row of iqamaData) {
      const worker = await KhayyatWorker.findOne({ tenantId, name: String(row.EmpName || '').trim() });
      if (worker) {
        // Store iqama info in notes or a custom field
        const iqamaInfo = `Iqama: ${row.IqamaNo || ''}, Place: ${row.IPlace || ''}, Issue: ${row.IssueD || ''}, Exp: ${row.ExpD || ''}`;
        // We don't have a dedicated field, so skip or add to notes
        console.log(`  Iqama for ${row.EmpName}: ${iqamaInfo}`);
      }
    }

    // ==========================================
    // Summary
    // ==========================================
    console.log('\n=== IMPORT SUMMARY ===');
    console.log(`Tenant: ${tenant.name} (${tenantId})`);
    console.log(`Customers: ${customerCount}`);
    console.log(`Suppliers: ${supplierCount}`);
    console.log(`Workers: ${workerCount}`);
    console.log(`Fabrics: ${fabricCount}`);
    console.log(`Items: ${items.length}`);
    console.log(`Models: ${models.length}`);
    console.log(`Style Catalogs: ${Object.keys(styleCatalogs).length}`);
    console.log(`Locations: ${locations.length}`);
    console.log(`Stitching Records: ${stitchingCount}`);
    console.log(`Expenses: ${expenseCount}`);
    console.log('=== DONE ===');

    process.exit(0);
  } catch (error) {
    console.error('Import error:', error);
    process.exit(1);
  }
}

importData();
