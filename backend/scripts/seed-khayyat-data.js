import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Tenant from '../models/Tenant.js';
import Supplier from '../models/Supplier.js';
import KhayyatFabric from '../models/khayyat/KhayyatFabric.js';
import KhayyatEmbroideryDesign from '../models/khayyat/KhayyatEmbroideryDesign.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zatca-erp';

const embroideryImages = [
  { name: 'Golden Collar Embroidery', image: '/thawbs/embroidery/embroidery_01_1780726341358.png' },
  { name: 'Silver Geometric Chest', image: '/thawbs/embroidery/embroidery_02_1780726352005.png' },
  { name: 'Navy Islamic Pattern Cuff', image: '/thawbs/embroidery/embroidery_03_1780726362907.png' },
  { name: 'White Tone-on-Tone Floral', image: '/thawbs/embroidery/embroidery_04_1780726378834.png' },
  { name: 'Maroon & Gold Collar', image: '/thawbs/embroidery/embroidery_05_1780726390155.png' },
  { name: 'Subtle Grey Hidden Placket', image: '/thawbs/embroidery/embroidery_06_1780726401240.png' },
  { name: 'White Bespoke Pocket', image: '/thawbs/embroidery/embroidery_07_1780726415676.png' },
  { name: 'Navy & Gold Modern Collar', image: '/thawbs/embroidery/embroidery_08_1780726425634.png' },
  { name: 'Silver Arabesque Cuff', image: '/thawbs/embroidery/embroidery_09_1780726437290.png' },
  { name: 'White Elaborate Placket', image: '/thawbs/embroidery/embroidery_10_1780726448519.png' }
];

const fabricsData = [
  { name: 'Toyobo Premium', madeIn: 'Japan', pricePerRoll: 1200, rollsInStock: 20, stockMeters: 500, code: 'SUP-01' },
  { name: 'Shikibo Classic', madeIn: 'Japan', pricePerRoll: 1350, rollsInStock: 15, stockMeters: 375, code: 'SUP-01' },
  { name: 'Tetoron Blend', madeIn: 'Taiwan', pricePerRoll: 600, rollsInStock: 40, stockMeters: 1000, code: 'SUP-02' },
  { name: 'Winter Wool', madeIn: 'Italy', pricePerRoll: 2500, rollsInStock: 5, stockMeters: 125, code: 'SUP-02' },
  { name: 'Summer Cotton', madeIn: 'India', pricePerRoll: 400, rollsInStock: 30, stockMeters: 750, code: 'SUP-02' },
  { name: 'Kurabo Polyester', madeIn: 'Japan', pricePerRoll: 1100, rollsInStock: 25, stockMeters: 625, code: 'SUP-01' }
];

const suppliersData = [
  { code: 'SUP-01', nameEn: 'Al-Jedaie Japanese Fabrics', nameAr: 'أقمشة الجديعي اليابانية', vatNumber: '300123456789012' },
  { code: 'SUP-02', nameEn: 'Riyadh Textile Co.', nameAr: 'شركة نسيج الرياض', vatNumber: '300987654321012' }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const tenant = await Tenant.findOne({ businessType: 'tailoring' });
    if (!tenant) {
      console.log('No tailoring tenant found. Cannot seed.');
      process.exit(1);
    }
    const tenantId = tenant._id;

    // Seed Suppliers
    const supplierIds = {};
    for (const sup of suppliersData) {
      let supplier = await Supplier.findOne({ tenantId, code: sup.code });
      if (!supplier) {
        supplier = new Supplier({ ...sup, tenantId });
        await supplier.save();
        console.log(`Created supplier: ${sup.nameEn}`);
      }
      supplierIds[sup.code] = supplier._id;
    }

    // Seed Khayyat Fabrics
    for (const f of fabricsData) {
      let fabric = await KhayyatFabric.findOne({ tenantId, name: f.name });
      if (!fabric) {
        const supplierId = supplierIds[f.code];
        fabric = new KhayyatFabric({
          tenantId,
          name: f.name,
          madeIn: f.madeIn,
          pricePerRoll: f.pricePerRoll,
          rollsInStock: f.rollsInStock,
          stockMeters: f.stockMeters,
          supplierId
        });
        await fabric.save();
        console.log(`Created fabric: ${f.name}`);
      }
    }

    // Seed Embroidery Designs
    for (const design of embroideryImages) {
      let existing = await KhayyatEmbroideryDesign.findOne({ tenantId, name: design.name });
      if (!existing) {
        existing = new KhayyatEmbroideryDesign({
          tenantId,
          name: design.name,
          image: design.image,
          price: 15,
          isActive: true
        });
        await existing.save();
        console.log(`Created embroidery design: ${design.name}`);
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
