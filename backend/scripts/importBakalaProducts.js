import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import BakalaProduct from '../models/BakalaProduct.js';
import Tenant from '../models/Tenant.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const importProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zatca-erp');
    console.log('Connected to MongoDB');

    // Find a tenant with 'bakala' business type
    let tenant = await Tenant.findOne({ businessTypes: 'bakala' });
    if (!tenant) {
      console.log('No Bakala tenant found. Assigning bakala to the first tenant...');
      tenant = await Tenant.findOne();
      if (!tenant) {
        console.log('No tenants found in the database! Creating a default Bakala tenant...');
        tenant = await Tenant.create({
          name: 'Bakala Supermarket',
          slug: 'bakala-supermarket',
          businessType: 'bakala',
          businessTypes: ['bakala'],
          business: {
            legalNameAr: 'سوبر ماركت بقالة',
            legalNameEn: 'Bakala Supermarket',
            vatNumber: '300000000000003',
            crNumber: '1010000000'
          }
        });
      }
      if (!tenant.businessTypes.includes('bakala')) {
        tenant.businessTypes.push('bakala');
        await tenant.save();
      }
    }
    console.log(`Importing products for tenant: ${tenant.name} (${tenant._id})`);

    const results = [];
    const csvFilePath = process.argv[2] || path.join(__dirname, 'bakala_products.csv');

    if (!fs.existsSync(csvFilePath)) {
      console.error(`CSV file not found at: ${csvFilePath}`);
      process.exit(1);
    }

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let count = 0;
        let skipped = 0;

        for (const row of results) {
          const name = row['english items'] || row['english_items'] || 'Unknown Item';
          const nameAr = row['arabic items'] || row['arabic_items'] || '';
          const barcode = row['bracode'] || row['barcode'];
          const costPrice = parseFloat(row['purchase_price']) || 0;
          const retailPrice = parseFloat(row['sale_price']) || 0;
          const minimumStockAlertLevel = parseInt(row['alert_quantity']) || 0;
          const isActive = row['active'] === '1' || row['active'] === 'true' || row['active'] === '';

          if (!barcode) {
            console.log(`Skipping item "${name}" due to missing barcode.`);
            skipped++;
            continue;
          }

          try {
            await BakalaProduct.findOneAndUpdate(
              { tenantId: tenant._id, primaryBarcode: barcode },
              {
                tenantId: tenant._id,
                name,
                nameAr,
                primaryBarcode: barcode,
                barcodes: [barcode],
                costPrice,
                retailPrice,
                minimumStockAlertLevel,
                isActive,
                taxRate: 15 // Assuming standard 15% VAT
              },
              { upsert: true, new: true }
            );
            count++;
          } catch (err) {
            console.error(`Error importing ${barcode}:`, err.message);
          }
        }

        console.log(`Import complete! Successfully imported/updated ${count} products. Skipped: ${skipped}`);
        process.exit(0);
      });
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
};

importProducts();
