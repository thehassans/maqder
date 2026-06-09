import mongoose from 'mongoose';
import dotenv from 'dotenv';
import xlsx from 'xlsx';
import path from 'path';
import Tenant from './models/Tenant.js';
import BakalaProduct from './models/BakalaProduct.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zatca-erp');
    console.log('Connected to MongoDB');

    let tenant = await Tenant.findOne({ slug: 'bakala' });
    if (!tenant) {
      tenant = await Tenant.findOne({ businessType: 'bakala' });
    }
    
    if (!tenant) {
      console.log('Creating Bakala Tenant...');
      tenant = await Tenant.create({
        name: 'Bakala Supermarket',
        slug: 'bakala',
        businessType: 'trading',
        businessTypes: ['trading', 'bakala'],
        business: {
          legalNameAr: 'بقالة سوبر ماركت',
          legalNameEn: 'Bakala Supermarket',
          vatNumber: '300000000000003',
          crNumber: '1010000000',
        }
      });
      console.log('Bakala tenant created.');
    }

    console.log('Tenant ID:', tenant._id);

    const workbook = xlsx.readFile('../saudi-supermarket-data/SA-عينة-منتجات-السوبرماركت.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    let importedCount = 0;
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0]) continue; // Skip empty rows
      
      const nameAr = row[0];
      const name = row[1] || nameAr;
      const category = row[3] || row[2]; // Category1 En or Category1
      const priceStr = row[10]; // e.g. "SAR 20.45"
      let retailPrice = 0;
      if (priceStr && typeof priceStr === 'string') {
        const matches = priceStr.match(/[\d.]+/);
        if (matches) {
          retailPrice = parseFloat(matches[0]);
        }
      } else if (typeof priceStr === 'number') {
        retailPrice = priceStr;
      }
      
      const primaryBarcode = row[12];
      if (!primaryBarcode) continue; // Skip if no barcode
      
      const brand = row[13];
      const imageLink = row[22];

      const productData = {
        tenantId: tenant._id,
        name: name,
        nameAr: nameAr,
        primaryBarcode: primaryBarcode.toString(),
        category: category,
        brand: brand,
        retailPrice: retailPrice,
        taxRate: 15, // Assuming 15% VAT for Saudi
        stockQuantity: 100, // Dummy initial stock
        minimumStockAlertLevel: 10,
        costPrice: retailPrice * 0.7 // Dummy cost price (30% margin)
      };

      try {
        await BakalaProduct.findOneAndUpdate(
          { tenantId: tenant._id, primaryBarcode: primaryBarcode.toString() },
          { $set: productData },
          { upsert: true, new: true }
        );
        importedCount++;
        if (importedCount % 100 === 0) {
          console.log(`Imported ${importedCount} products...`);
        }
      } catch (err) {
        console.error(`Error importing product ${primaryBarcode}:`, err.message);
      }
    }

    console.log(`Successfully imported ${importedCount} products for Bakala tenant!`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

run();
