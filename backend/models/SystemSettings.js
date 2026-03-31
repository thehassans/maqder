import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global' },
  gemini: {
    enabled: { type: Boolean, default: false },
    apiKey: { type: String },
    model: { type: String, default: 'gemini-2.5-flash' }
  },
  website: {
    brandName: { type: String, default: 'Maqder ERP' },
    domain: { type: String, default: 'maqder.com' },
    contactPhone: { type: String, default: '+966595930045' },
    contactEmail: { type: String, default: 'info@maqder.com' },
    contactAddressEn: { type: String, default: 'Riyadh, Saudi Arabia' },
    contactAddressAr: { type: String, default: 'الرياض، المملكة العربية السعودية' },
    hero: {
      titleEn: { type: String, default: 'Complete ERP System' },
      titleAr: { type: String, default: 'نظام ERP متكامل' },
      subtitleEn: { type: String, default: 'Saudi compliant, ZATCA Phase 2 ready. Invoicing, HR, Payroll, Inventory & more.' },
      subtitleAr: { type: String, default: 'متوافق مع السعودية وجاهز للمرحلة الثانية. فوترة، موارد بشرية، رواتب، مخزون وأكثر.' }
    },
    cta: {
      primaryEn: { type: String, default: 'Start Now' },
      primaryAr: { type: String, default: 'ابدأ الآن' },
      secondaryEn: { type: String, default: 'Live Demo' },
      secondaryAr: { type: String, default: 'عرض مباشر' }
    },
    demo: {
      enabled: { type: Boolean, default: true },
      tenantSlug: { type: String, default: 'demo' },
      email: { type: String, default: 'demo@maqder.com' },
      password: { type: String, default: 'Demo@12345' }
    },
    pricing: {
      currency: { type: String, default: 'SAR' },
      plans: [
        {
          id: { type: String, default: 'starter' },
          nameEn: { type: String, default: 'Starter' },
          nameAr: { type: String, default: 'البداية' },
          priceMonthly: { type: Number, default: 299 },
          priceYearly: { type: Number, default: 2990 },
          popular: { type: Boolean, default: false },
          featuresEn: { type: [String], default: ['ZATCA E-Invoicing', 'Inventory & Warehouses', 'Basic Reports', 'Up to 5 users'] },
          featuresAr: { type: [String], default: ['الفوترة الإلكترونية', 'المخزون والمستودعات', 'تقارير أساسية', 'حتى 5 مستخدمين'] }
        },
        {
          id: { type: String, default: 'professional' },
          nameEn: { type: String, default: 'Professional' },
          nameAr: { type: String, default: 'الاحترافية' },
          priceMonthly: { type: Number, default: 699 },
          priceYearly: { type: Number, default: 6990 },
          popular: { type: Boolean, default: true },
          featuresEn: { type: [String], default: ['Everything in Starter', 'HR & Payroll (GOSI/WPS)', 'Expenses & Finance', 'Advanced Reports', 'Up to 25 users'] },
          featuresAr: { type: [String], default: ['كل ما في البداية', 'الموارد البشرية والرواتب', 'المصروفات والمالية', 'تقارير متقدمة', 'حتى 25 مستخدم'] }
        },
        {
          id: { type: String, default: 'enterprise' },
          nameEn: { type: String, default: 'Enterprise' },
          nameAr: { type: String, default: 'المؤسسات' },
          priceMonthly: { type: Number, default: 0 },
          priceYearly: { type: Number, default: 0 },
          popular: { type: Boolean, default: false },
          featuresEn: { type: [String], default: ['Unlimited users', 'Dedicated support', 'Custom integrations', 'On-premise or private cloud'] },
          featuresAr: { type: [String], default: ['مستخدمون غير محدودين', 'دعم مخصص', 'تكاملات مخصصة', 'خادم خاص أو سحابة خاصة'] }
        }
      ]
    }
  }
}, {
  timestamps: true
});

systemSettingsSchema.index({ key: 1 }, { unique: true });

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export default SystemSettings;
