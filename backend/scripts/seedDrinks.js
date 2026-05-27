import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import RestaurantMenuItem from '../models/RestaurantMenuItem.js';
import Tenant from '../models/Tenant.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maqder';

const drinks = [
  {
    sku: 'DRK-001',
    nameEn: 'Saudi Champagne',
    nameAr: 'شامبانيا سعودي',
    descriptionEn: 'A refreshing, sparkling mix of apple and soda with fresh fruits and mint.',
    descriptionAr: 'مزيج منعش من التفاح والمياه الغازية مع الفواكه الطازجة والنعناع.',
    category: 'Cold Drinks',
    sellingPrice: 45,
    taxRate: 15,
    hasHalfPlate: false,
    calories: 120,
    prepTime: 5,
    isActive: true,
    localImage: 'saudi_champagne_1779851384570.png'
  },
  {
    sku: 'DRK-002',
    nameEn: 'Lemon Mint',
    nameAr: 'ليمون نعناع',
    descriptionEn: 'Freshly squeezed lemon juice blended with fresh mint leaves and ice.',
    descriptionAr: 'عصير ليمون طازج ممزوج بأوراق النعناع الطازجة والثلج.',
    category: 'Cold Drinks',
    sellingPrice: 22,
    taxRate: 15,
    hasHalfPlate: false,
    calories: 90,
    prepTime: 5,
    isActive: true,
    localImage: 'lemon_mint_1779851403221.png'
  },
  {
    sku: 'DRK-003',
    nameEn: 'Dates Milkshake',
    nameAr: 'ميلك شيك التمر',
    descriptionEn: 'Creamy and rich milkshake made with premium Saudi dates.',
    descriptionAr: 'ميلك شيك كريمي وغني محضر من أجود أنواع التمور السعودية.',
    category: 'Cold Drinks',
    sellingPrice: 28,
    taxRate: 15,
    hasHalfPlate: false,
    calories: 320,
    prepTime: 5,
    isActive: true,
    localImage: 'dates_milkshake_1779851419359.png'
  },
  {
    sku: 'DRK-004',
    nameEn: 'Vimto Ice',
    nameAr: 'فيمتو مثلج',
    descriptionEn: 'The classic berry beverage served ice-cold, a local favorite.',
    descriptionAr: 'مشروب التوت الكلاسيكي يقدم بارداً جداً، المفضل محلياً.',
    category: 'Cold Drinks',
    sellingPrice: 18,
    taxRate: 15,
    hasHalfPlate: false,
    calories: 150,
    prepTime: 3,
    isActive: true,
    localImage: 'vimto_drink_1779851437871.png'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const restaurantTenants = await Tenant.find({ $or: [{ businessTypes: 'restaurant' }, { businessType: 'restaurant' }] });
    console.log(`Found ${restaurantTenants.length} restaurant tenants.`);

    for (const tenant of restaurantTenants) {
      console.log(`Seeding for tenant: ${tenant.name}`);
      const tenantUploadDir = path.join(__dirname, '..', '..', 'backend', 'public', 'uploads', 'restaurant', tenant._id.toString());
      
      // Ensure directory exists
      if (!fs.existsSync(tenantUploadDir)) {
        fs.mkdirSync(tenantUploadDir, { recursive: true });
      }

      for (const drink of drinks) {
        // Find existing
        const existing = await RestaurantMenuItem.findOne({ tenantId: tenant._id, sku: drink.sku });
        
        // Copy image
        const sourceImgPath = path.join('C:\\Users\\kjh\\.gemini\\antigravity\\brain\\6212f9e1-1460-434c-a147-cffe0e805c01', drink.localImage);
        const destImgName = drink.localImage.replace('.png', '.webp');
        const destImgPath = path.join(tenantUploadDir, destImgName);
        const relativeUrl = `/uploads/restaurant/${tenant._id}/${destImgName}`;

        if (fs.existsSync(sourceImgPath)) {
          // Just copy it as png to webp for now since it's already generated 
          // (In production sharp converts it, but here we can just copy)
          fs.copyFileSync(sourceImgPath, destImgPath);
        }

        const itemData = {
          tenantId: tenant._id,
          sku: drink.sku,
          nameEn: drink.nameEn,
          nameAr: drink.nameAr,
          descriptionEn: drink.descriptionEn,
          descriptionAr: drink.descriptionAr,
          category: drink.category,
          sellingPrice: drink.sellingPrice,
          taxRate: drink.taxRate,
          hasHalfPlate: drink.hasHalfPlate,
          calories: drink.calories,
          prepTime: drink.prepTime,
          isActive: drink.isActive,
          imageUrl: fs.existsSync(sourceImgPath) ? relativeUrl : ''
        };

        if (existing) {
          await Object.assign(existing, itemData).save();
          console.log(`Updated ${drink.nameEn}`);
        } else {
          await RestaurantMenuItem.create(itemData);
          console.log(`Created ${drink.nameEn}`);
        }
      }
    }

    console.log('Done seeding drinks.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding drinks:', error);
    process.exit(1);
  }
}

seed();
