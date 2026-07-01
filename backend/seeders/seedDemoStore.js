import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tenant from '../models/Tenant.js';
import EcommerceProduct from '../models/EcommerceProduct.js';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zatca-erp';

const DEMO_TENANT_SLUG = 'demo-store';

const demoProducts = [
  {
    title: 'Premium Cotton T-Shirt',
    titleAr: 'تيشيرت قطن فاخر',
    description: 'Ultra-soft premium cotton t-shirt with a modern fit. Perfect for everyday wear.',
    descriptionAr: 'تيشيرت قطني فاخر ناعم بقصة عصرية. مثالي للاستخدام اليومي.',
    category: 'Clothing',
    brand: 'Maqder',
    basePrice: 89,
    compareAtPrice: 129,
    stockQuantity: 50,
    hasVariants: true,
    option1Name: 'Size',
    option2Name: 'Color',
    variants: [
      { option1Value: 'S', option2Value: 'White', price: 89, stockQuantity: 15, trackInventory: true, isActive: true, sku: 'TSH-S-WHT' },
      { option1Value: 'M', option2Value: 'White', price: 89, stockQuantity: 12, trackInventory: true, isActive: true, sku: 'TSH-M-WHT' },
      { option1Value: 'L', option2Value: 'White', price: 95, stockQuantity: 10, trackInventory: true, isActive: true, sku: 'TSH-L-WHT' },
      { option1Value: 'S', option2Value: 'Black', price: 89, stockQuantity: 8, trackInventory: true, isActive: true, sku: 'TSH-S-BLK' },
      { option1Value: 'M', option2Value: 'Black', price: 89, stockQuantity: 5, trackInventory: true, isActive: true, sku: 'TSH-M-BLK' },
      { option1Value: 'L', option2Value: 'Black', price: 95, stockQuantity: 0, trackInventory: true, isActive: true, sku: 'TSH-L-BLK' },
    ],
    images: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', altText: 'Premium Cotton T-Shirt' }],
    tags: ['clothing', 'cotton', 'casual'],
  },
  {
    title: 'Wireless Bluetooth Headphones',
    titleAr: 'سماعات بلوتوث لاسلكية',
    description: 'High-fidelity wireless headphones with active noise cancellation and 30-hour battery life.',
    descriptionAr: 'سماعات لاسلكية عالية الجودة مع إلغاء الضوضاء النشط وبطارية تدوم 30 ساعة.',
    category: 'Electronics',
    brand: 'SoundMax',
    basePrice: 349,
    compareAtPrice: 499,
    stockQuantity: 30,
    hasVariants: true,
    option1Name: 'Color',
    variants: [
      { option1Value: 'Matte Black', price: 349, stockQuantity: 15, trackInventory: true, isActive: true, sku: 'HDP-BLK' },
      { option1Value: 'Silver', price: 349, stockQuantity: 10, trackInventory: true, isActive: true, sku: 'HDP-SLV' },
      { option1Value: 'Rose Gold', price: 379, stockQuantity: 5, trackInventory: true, isActive: true, sku: 'HDP-RGD' },
    ],
    images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', altText: 'Wireless Headphones' }],
    tags: ['electronics', 'audio', 'wireless'],
  },
  {
    title: 'Smart Watch Series 7',
    titleAr: 'ساعة ذكية سيريس 7',
    description: 'Track your fitness, heart rate, and sleep with this premium smartwatch. Water-resistant up to 50m.',
    descriptionAr: 'تتبع لياقتك ومعدل ضربات القلب والنوم مع هذه الساعة الذكية الفاخرة. مقاومة للماء حتى 50 متر.',
    category: 'Electronics',
    brand: 'TechWear',
    basePrice: 599,
    compareAtPrice: 799,
    stockQuantity: 25,
    hasVariants: true,
    option1Name: 'Band',
    option2Name: 'Case Size',
    variants: [
      { option1Value: 'Sport Band', option2Value: '41mm', price: 599, stockQuantity: 10, trackInventory: true, isActive: true, sku: 'SW-S41' },
      { option1Value: 'Sport Band', option2Value: '45mm', price: 649, stockQuantity: 8, trackInventory: true, isActive: true, sku: 'SW-S45' },
      { option1Value: 'Leather Band', option2Value: '41mm', price: 699, stockQuantity: 4, trackInventory: true, isActive: true, sku: 'SW-L41' },
      { option1Value: 'Leather Band', option2Value: '45mm', price: 749, stockQuantity: 3, trackInventory: true, isActive: true, sku: 'SW-L45' },
    ],
    images: [{ url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e0f?w=600', altText: 'Smart Watch' }],
    tags: ['electronics', 'wearable', 'fitness'],
  },
  {
    title: 'Leather Wallet — Minimalist',
    titleAr: 'محفظة جلدية — تصميم بسيط',
    description: 'Handcrafted genuine leather wallet with RFID protection. Slim design fits comfortably in any pocket.',
    descriptionAr: 'محفظة جلدية أصلية مصنوعة يدويًا مع حماية RFID. تصميم نحيف يناسب أي جيب.',
    category: 'Accessories',
    brand: 'Maqder',
    basePrice: 149,
    compareAtPrice: 199,
    stockQuantity: 80,
    images: [{ url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600', altText: 'Leather Wallet' }],
    tags: ['accessories', 'leather', 'rfid'],
  },
  {
    title: 'Aromatic Scented Candle Set',
    titleAr: 'طقم شموع عطرية',
    description: 'Set of 3 premium scented candles with natural soy wax. Long-lasting fragrance for your home.',
    descriptionAr: 'طقم من 3 شموع عطرية فاخرة بشمع الصويا الطبيعي. عطر يدوم طويلاً لمنزلك.',
    category: 'Home & Living',
    brand: 'HomeGlow',
    basePrice: 79,
    compareAtPrice: 99,
    stockQuantity: 100,
    images: [{ url: 'https://images.unsplash.com/photo-1602874801006-5bea6c4c3c1e?w=600', altText: 'Scented Candles' }],
    tags: ['home', 'candles', 'fragrance'],
  },
  {
    title: 'Stainless Steel Water Bottle',
    titleAr: 'زجاجة ماء ستانلس ستيل',
    description: 'Double-walled insulated water bottle keeps drinks cold for 24h or hot for 12h. 750ml capacity.',
    descriptionAr: 'زجاجة ماء معزولة مزدوجة الجدار تحافظ على المشروبات باردة 24 ساعة أو ساخنة 12 ساعة. سعة 750 مل.',
    category: 'Accessories',
    brand: 'EcoFlow',
    basePrice: 59,
    compareAtPrice: 0,
    stockQuantity: 200,
    images: [{ url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600', altText: 'Water Bottle' }],
    tags: ['accessories', 'eco', 'bottle'],
  },
  {
    title: 'Organic Skincare Bundle',
    titleAr: 'حزمة العناية بالبشرة العضوية',
    description: 'Complete skincare set with organic cleanser, toner, and moisturizer. Suitable for all skin types.',
    descriptionAr: 'مجموعة كاملة للعناية بالبشرة مع منظف وتونر ومرطب عضوي. مناسب لجميع أنواع البشرة.',
    category: 'Beauty',
    brand: 'PureGlow',
    basePrice: 199,
    compareAtPrice: 279,
    stockQuantity: 40,
    images: [{ url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600', altText: 'Skincare Bundle' }],
    tags: ['beauty', 'skincare', 'organic'],
  },
  {
    title: 'Designer Sunglasses — UV400',
    titleAr: 'نظارات شمسية مصممة — UV400',
    description: 'Polarized designer sunglasses with UV400 protection. Includes premium case and cleaning cloth.',
    descriptionAr: 'نظارات شمسية مصممة مستقطبة مع حماية UV400. تشمل علبة فاخرة وقماش تنظيف.',
    category: 'Accessories',
    brand: 'VisionStyle',
    basePrice: 179,
    compareAtPrice: 249,
    stockQuantity: 60,
    images: [{ url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600', altText: 'Sunglasses' }],
    tags: ['accessories', 'sunglasses', 'uv400'],
  },
  {
    title: 'Premium Yoga Mat — Non-Slip',
    titleAr: 'ساحة يوغا فاخرة — غير قابلة للانزلاق',
    description: 'Eco-friendly TPE yoga mat with extra cushioning and non-slip surface. Includes carrying strap.',
    descriptionAr: 'ساحة يوغا صديقة للبيئة من مادة TPE مع وسادة إضافية وسطح غير قابل للانزلاق. تشمل حامل حمل.',
    category: 'Sports & Fitness',
    brand: 'FlexFit',
    basePrice: 119,
    compareAtPrice: 159,
    stockQuantity: 70,
    images: [{ url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600', altText: 'Yoga Mat' }],
    tags: ['sports', 'yoga', 'fitness'],
  },
  {
    title: 'Ceramic Coffee Mug Set — 4 Pack',
    titleAr: 'طقم أكواب قهوة سيراميك — 4 قطع',
    description: 'Elegant ceramic coffee mug set with minimalist design. Dishwasher and microwave safe. 350ml each.',
    descriptionAr: 'طقم أكواب قهوة سيراميك أنيق بتصميم بسيط. آمن في غسالة الصحاف والميكروويف. سعة 350 مل لكل كوب.',
    category: 'Home & Living',
    brand: 'HomeGlow',
    basePrice: 99,
    compareAtPrice: 139,
    stockQuantity: 120,
    images: [{ url: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600', altText: 'Coffee Mug Set' }],
    tags: ['home', 'kitchen', 'ceramic'],
  },
  {
    title: 'Portable Power Bank 20000mAh',
    titleAr: 'باور بانك محمول 20000 مللي أمبير',
    description: 'Fast-charging portable power bank with USB-C PD. Charge your devices 4-5 times on a single charge.',
    descriptionAr: 'باور بانك محمول بشحن سريع مع USB-C PD. اشحن أجهزتك 4-5 مرات بشحنة واحدة.',
    category: 'Electronics',
    brand: 'ChargePro',
    basePrice: 129,
    compareAtPrice: 179,
    stockQuantity: 90,
    images: [{ url: 'https://images.unsplash.com/photo-1609592424823-2b1b5c4c0c7e?w=600', altText: 'Power Bank' }],
    tags: ['electronics', 'charging', 'portable'],
  },
  {
    title: 'Linen Bed Sheet Set — Queen',
    titleAr: 'طقم أغطية سرير كتان — كوين',
    description: 'Premium linen bed sheet set with 2 pillowcases. Breathable, hypoallergenic, and ultra-comfortable.',
    descriptionAr: 'طقم أغطية سرير كتان فاخر مع 2 غطاء وسادة. قابل للتنفس، مضاد للحساسية، ومريح للغاية.',
    category: 'Home & Living',
    brand: 'DreamWeave',
    basePrice: 299,
    compareAtPrice: 399,
    stockQuantity: 35,
    images: [{ url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600', altText: 'Bed Sheet Set' }],
    tags: ['home', 'bedding', 'linen'],
  },
];

async function seedDemoStore() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB:', MONGODB_URI);

    // 1. Find or create demo tenant
    let tenant = await Tenant.findOne({ slug: DEMO_TENANT_SLUG });

    if (!tenant) {
      console.log('Creating demo tenant...');
      tenant = new Tenant({
        name: 'Demo Store',
        slug: DEMO_TENANT_SLUG,
        businessTypes: ['ecommerce'],
        isActive: true,
        subscription: {
          plan: 'professional',
          status: 'active',
          maxUsers: 10,
          maxInvoices: 1000,
          features: ['invoicing', 'inventory', 'api_access', 'advanced_reports'],
        },
        businessDetails: {
          legalNameAr: 'متجر تجريبي',
          legalNameEn: 'Demo Store',
          tradeName: 'Demo Store',
          vatNumber: '300000000000003',
          crNumber: '1010000000',
          address: {
            city: 'Riyadh',
            cityAr: 'الرياض',
            country: 'SA',
          },
          contactPhone: '+966500000000',
          contactEmail: 'demo@maqder.com',
        },
        ecommerce: {
          storeStatus: 'live',
          storeName: 'Maqder',
          storeNameAr: 'مقدر',
          subdomain: DEMO_TENANT_SLUG,
          currency: 'SAR',
          defaultTaxRate: 15,
          domains: [{
            hostname: 'localhost',
            type: 'custom',
            status: 'verified',
          }],
          payments: {
            defaultProvider: 'cod',
            codEnabled: true,
          },
          couriers: {
            flatRate: {
              enabled: true,
              price: 25,
            },
          },
          theme: {
            published: {
              header: {
                logoText: 'Maqder',
                showSearch: true,
                showCategories: true,
                sticky: true,
              },
              colors: {
                primary: '#059669',
                secondary: '#10b981',
                accent: '#34d399',
                text: '#111827',
                textMuted: '#6b7280',
                borderColor: '#e5e7eb',
                priceColor: '#059669',
                salePriceColor: '#dc2626',
              },
              hero: {
                enabled: true,
                title: 'Welcome to Maqder',
                subtitle: 'Discover premium products at unbeatable prices',
                buttonText: 'Shop Now',
                buttonLink: '/store/products',
                imageUrl: '',
              },
              footer: {
                showAbout: true,
                showContact: true,
                showSocial: true,
                aboutText: 'Premium products, delivered with excellence across the Kingdom.',
              },
            },
          },
          seo: {
            metaTitle: 'Maqder — Premium Products',
            metaDescription: 'Shop premium products at Maqder. Fast delivery across Saudi Arabia.',
          },
        },
        settings: {
          language: 'en',
          currency: 'SAR',
        },
      });
      await tenant.save();
      console.log('Demo tenant created:', tenant._id);
    } else {
      // Update tenant for localhost access
      const hasLocalhost = (tenant.ecommerce?.domains || []).some(d => d.hostname === 'localhost');
      if (!hasLocalhost) {
        tenant.ecommerce = tenant.ecommerce || {};
        tenant.ecommerce.domains = tenant.ecommerce.domains || [];
        tenant.ecommerce.domains.push({ hostname: 'localhost', type: 'custom', status: 'verified' });
        tenant.ecommerce.storeStatus = 'live';
        tenant.ecommerce.storeName = tenant.ecommerce.storeName || 'Maqder';
        tenant.ecommerce.subdomain = tenant.ecommerce.subdomain || DEMO_TENANT_SLUG;
        tenant.ecommerce.currency = tenant.ecommerce.currency || 'SAR';
        tenant.ecommerce.payments = tenant.ecommerce.payments || { defaultProvider: 'cod', codEnabled: true };
        tenant.ecommerce.couriers = tenant.ecommerce.couriers || { flatRate: { enabled: true, price: 25 } };
        tenant.ecommerce.theme = tenant.ecommerce.theme || { published: {
          header: { logoText: 'Maqder', showSearch: true, showCategories: true, sticky: true },
          colors: { primary: '#059669', secondary: '#10b981', accent: '#34d399', text: '#111827', textMuted: '#6b7280', borderColor: '#e5e7eb', priceColor: '#059669', salePriceColor: '#dc2626' },
          hero: { enabled: true, title: 'Welcome to Maqder', subtitle: 'Discover premium products at unbeatable prices', buttonText: 'Shop Now', buttonLink: '/store/products' },
          footer: { showAbout: true, showContact: true, showSocial: true, aboutText: 'Premium products, delivered with excellence across the Kingdom.' },
          mobileNav: { enabled: true, style: 'default' },
        }};
        tenant.ecommerce.seo = tenant.ecommerce.seo || { metaTitle: 'Maqder — Premium Products', metaDescription: 'Shop premium products at Maqder.' };
        tenant.isActive = true;
        if (!tenant.businessTypes?.includes('ecommerce')) {
          tenant.businessTypes = [...(tenant.businessTypes || []), 'ecommerce'];
        }
        await tenant.save();
      }
      console.log('Demo tenant updated:', tenant._id);
    }

    // 2. Seed products
    const existingCount = await EcommerceProduct.countDocuments({ tenantId: tenant._id });
    if (existingCount > 0) {
      console.log(`Tenant already has ${existingCount} products. Skipping product seed.`);
    } else {
      console.log('Seeding demo products...');
      for (const p of demoProducts) {
        const product = new EcommerceProduct({
          tenantId: tenant._id,
          title: p.title,
          titleAr: p.titleAr,
          description: p.description,
          descriptionAr: p.descriptionAr,
          status: 'active',
          category: p.category,
          brand: p.brand,
          basePrice: p.basePrice,
          compareAtPrice: p.compareAtPrice,
          taxRate: 15,
          taxIncluded: true,
          currency: 'SAR',
          stockQuantity: p.stockQuantity,
          trackInventory: true,
          hasVariants: p.hasVariants || false,
          option1Name: p.option1Name || '',
          option2Name: p.option2Name || '',
          option3Name: p.option3Name || '',
          variants: p.variants || [],
          images: p.images,
          tags: p.tags,
          requiresShipping: true,
          weight: 500,
          weightUnit: 'g',
        });
        await product.save();
      }
      console.log(`Seeded ${demoProducts.length} demo products.`);
    }

    // 3. Ensure super admin exists
    const admin = await User.findOne({ role: 'super_admin' });
    if (!admin) {
      await User.create({
        email: process.env.SUPER_ADMIN_EMAIL || 'admin@zatca-erp.com',
        password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        isActive: true,
      });
      console.log('Super admin created.');
    } else {
      console.log('Super admin already exists:', admin.email);
    }

    console.log('\n========================================');
    console.log('  Demo Store Seeded Successfully!');
    console.log('========================================');
    console.log('  Tenant slug:', DEMO_TENANT_SLUG);
    console.log('  Store URL: http://localhost:5173/store');
    console.log('  Products:', demoProducts.length);
    console.log('  Admin: admin@zatca-erp.com / SuperAdmin@123');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedDemoStore();
