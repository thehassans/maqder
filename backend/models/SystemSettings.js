import mongoose from 'mongoose';

const defaultPlanFeaturesEn = ['ZATCA E-Invoicing', 'Inventory & Warehouses', 'Basic Reports', 'Up to 5 users'];
const defaultPlanFeaturesAr = ['الفوترة الإلكترونية', 'المخزون والمستودعات', 'تقارير أساسية', 'حتى 5 مستخدمين'];

const planSchema = new mongoose.Schema({
  id: { type: String, default: 'starter' },
  nameEn: { type: String, default: 'Starter' },
  nameAr: { type: String, default: 'البداية' },
  priceMonthly: { type: Number, default: 299 },
  priceYearly: { type: Number, default: 2990 },
  popular: { type: Boolean, default: false },
  featuresEn: { type: [String], default: defaultPlanFeaturesEn },
  featuresAr: { type: [String], default: defaultPlanFeaturesAr }
}, { _id: false });

const getDefaultPlans = () => [
  {
    id: 'starter',
    nameEn: 'Starter',
    nameAr: 'البداية',
    priceMonthly: 299,
    priceYearly: 2990,
    popular: false,
    featuresEn: ['ZATCA E-Invoicing', 'Up to 500 invoices/month', 'Inventory & Warehouses', 'Basic Reports', 'Up to 5 users', 'Email Support'],
    featuresAr: ['الفوترة الإلكترونية', 'حتى 500 فاتورة/شهر', 'المخزون والمستودعات', 'تقارير أساسية', 'حتى 5 مستخدمين', 'دعم بالبريد']
  },
  {
    id: 'professional',
    nameEn: 'Professional',
    nameAr: 'الاحترافية',
    priceMonthly: 699,
    priceYearly: 6990,
    popular: true,
    featuresEn: ['Everything in Starter', 'Unlimited Invoices', 'HR & Payroll (GOSI/WPS)', 'Expenses & Finance', 'Projects & Tasks', 'Advanced Reports', 'Up to 25 users', 'Priority Support'],
    featuresAr: ['كل ما في البداية', 'فواتير غير محدودة', 'الموارد البشرية والرواتب', 'المصروفات والمالية', 'المشاريع والمهام', 'تقارير متقدمة', 'حتى 25 مستخدم', 'دعم ذو أولوية']
  },
  {
    id: 'enterprise',
    nameEn: 'Enterprise',
    nameAr: 'المؤسسات',
    priceMonthly: 0,
    priceYearly: 0,
    popular: false,
    featuresEn: ['Everything in Professional', 'Unlimited users', 'Dedicated Account Manager', 'Custom Integrations', 'On-premise Option', '24/7 Phone Support', 'SLA Guarantee'],
    featuresAr: ['كل ما في الاحترافية', 'مستخدمون غير محدودين', 'مدير حساب مخصص', 'تكاملات مخصصة', 'خيار الخادم الخاص', 'دعم هاتفي 24/7', 'ضمان SLA']
  }
];

const systemSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global' },
  gemini: {
    enabled: { type: Boolean, default: false },
    apiKey: { type: String },
    model: { type: String, default: 'gemini-2.5-flash' }
  },
  openai: {
    enabled: { type: Boolean, default: false },
    apiKey: { type: String },
    model: { type: String, default: 'gpt-4o-mini' }
  },
  grok: {
    enabled: { type: Boolean, default: false },
    apiKey: { type: String },
    model: { type: String, default: 'grok-2-latest' }
  },
  groq: {
    enabled: { type: Boolean, default: false },
    apiKey: { type: String },
    model: { type: String, default: 'llama-3.1-8b-instant' }
  },
  glmOcr: {
    enabled: { type: Boolean, default: false },
    baseURL: { type: String, default: 'http://localhost:8000/v1' },
    apiKey: { type: String, default: 'EMPTY' },
    model: { type: String, default: 'glm-ocr' }
  },
  identity: {
    enabled: { type: Boolean, default: false },
    provider: { type: String, default: 'custom_webhook' },
    endpoint: { type: String, default: '' },
    apiKey: { type: String, default: '' },
    ocrEnabled: { type: Boolean, default: false }
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
      plans: { type: [planSchema], default: getDefaultPlans },
      plansByBusinessType: {
        type: [
          {
            businessType: { type: String, required: true },
            plans: { type: [planSchema], default: [] }
          }
        ],
        default: []
      }
    }
  },
  email: {
    enabled: { type: Boolean, default: false },
    provider: { type: String, enum: ['smtp', 'brevo'], default: 'smtp' },
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpSecure: { type: Boolean, default: false },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' },
    brevoApiKey: { type: String, default: '' },
    fromName: { type: String, default: 'Maqder ERP' },
    fromEmail: { type: String, default: '' },
    replyTo: { type: String, default: '' },
    salesEmail: { type: String, default: '' },
    supportEmail: { type: String, default: '' },
    billingEmail: { type: String, default: '' },
    templates: {
      tenantCreated: {
        subjectEn: { type: String, default: 'Your {{brandName}} panel is ready for {{companyName}}' },
        subjectAr: { type: String, default: 'لوحة {{brandName}} أصبحت جاهزة لشركة {{companyName}}' },
        bodyEn: { type: String, default: 'Hello {{contactName}},\n\nYour panel for {{companyName}} has been created successfully.\n\nLogin email: {{loginEmail}}\nTenant slug: {{tenantSlug}}\n\nYou can now sign in and start using {{brandName}}.' },
        bodyAr: { type: String, default: 'مرحباً {{contactName}}،\n\nتم إنشاء لوحة {{brandName}} الخاصة بشركة {{companyName}} بنجاح.\n\nالبريد للدخول: {{loginEmail}}\nرمز الشركة: {{tenantSlug}}\n\nيمكنك الآن تسجيل الدخول والبدء باستخدام {{brandName}}.' }
      },
      invoice: {
        subjectEn: { type: String, default: 'Invoice {{invoiceNumber}} from {{companyName}}' },
        subjectAr: { type: String, default: 'الفاتورة {{invoiceNumber}} من {{companyName}}' },
        bodyEn: { type: String, default: 'Hello {{customerName}},\n\nPlease find your invoice {{invoiceNumber}} dated {{invoiceDate}} with a total of {{invoiceTotal}}.\n\nThank you for your business.\n{{companyName}}' },
        bodyAr: { type: String, default: 'مرحباً {{customerName}}،\n\nنرفق لكم الفاتورة رقم {{invoiceNumber}} بتاريخ {{invoiceDate}} بإجمالي {{invoiceTotal}}.\n\nشكراً لتعاملكم معنا.\n{{companyName}}' }
      }
    }
  },
  errorTracking: {
    enabled: { type: Boolean, default: false },
    provider: { type: String, enum: ['sentry', 'bugsnag', 'custom'], default: 'sentry' },
    dsn: { type: String, default: '' },
    uploadSourceMaps: { type: Boolean, default: false },
  },
  analytics: {
    enabled: { type: Boolean, default: false },
    provider: { type: String, enum: ['posthog', 'mixpanel', 'amplitude', 'custom'], default: 'posthog' },
    apiKey: { type: String, default: '' },
    endpoint: { type: String, default: '' },
    trackEvents: {
      signUp: { type: Boolean, default: true },
      login: { type: Boolean, default: true },
      invoiceCreated: { type: Boolean, default: true },
      posPayment: { type: Boolean, default: true },
      orderCompleted: { type: Boolean, default: true },
    },
  },
  rateLimiting: {
    authMaxRequests: { type: Number, default: 20 },
    authWindowMinutes: { type: Number, default: 15 },
    apiMaxRequests: { type: Number, default: 200 },
    apiWindowMinutes: { type: Number, default: 1 },
  },
  sessionConfig: {
    accessTokenExpiryMinutes: { type: Number, default: 60 },
    refreshTokenExpiryDays: { type: Number, default: 30 },
    sessionTimeoutMinutes: { type: Number, default: 480 },
  },
  xssProtection: { type: Boolean, default: true },
  mongoSanitize: { type: Boolean, default: true },
  payment: {
    moyasar: {
      enabled: { type: Boolean, default: false },
      publishableKey: { type: String, default: '' },
      secretKey: { type: String, default: '' },
      webhookSecret: { type: String, default: '' },
      environment: { type: String, enum: ['test', 'live'], default: 'test' },
    },
    applePay: {
      enabled: { type: Boolean, default: false },
      merchantId: { type: String, default: '' },
      merchantCertificatePath: { type: String, default: '' },
      merchantCertificateKeyPath: { type: String, default: '' },
      environment: { type: String, enum: ['test', 'live'], default: 'test' },
    },
    stcPay: {
      enabled: { type: Boolean, default: false },
      merchantId: { type: String, default: '' },
      apiKey: { type: String, default: '' },
      environment: { type: String, enum: ['test', 'live'], default: 'test' },
    },
    tabby: {
      enabled: { type: Boolean, default: false },
      publicKey: { type: String, default: '' },
      secretKey: { type: String, default: '' },
      merchantCode: { type: String, default: '' },
      environment: { type: String, enum: ['test', 'live'], default: 'test' },
    },
    tamara: {
      enabled: { type: Boolean, default: false },
      apiToken: { type: String, default: '' },
      notificationToken: { type: String, default: '' },
      environment: { type: String, enum: ['test', 'live'], default: 'test' },
    },
  },
}, {
  timestamps: true
});

systemSettingsSchema.index({ key: 1 }, { unique: true });

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export const getDefaultPricingPlans = getDefaultPlans;
export default SystemSettings;
