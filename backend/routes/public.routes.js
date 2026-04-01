import express from 'express'
import jwt from 'jsonwebtoken'
import Tenant from '../models/Tenant.js'
import User from '../models/User.js'
import SystemSettings from '../models/SystemSettings.js'

const router = express.Router()
const databaseQueryTimeoutMs = 3000

const withQueryTimeout = (query) => query.maxTimeMS(databaseQueryTimeoutMs)

const isDatabaseAvailabilityError = (error) => {
  const message = String(error?.message || '').toLowerCase()

  return message.includes('buffering timed out')
    || message.includes('timed out after')
    || message.includes('server selection')
    || message.includes('ecconnrefused')
    || message.includes('not connected')
}

const sendRouteError = (res, error) => {
  if (isDatabaseAvailabilityError(error)) {
    return res.status(503).json({ error: 'Service temporarily unavailable. Please try again in a moment.' })
  }

  return res.status(500).json({ error: error.message })
}

const createDefaultSettings = () => new SystemSettings({ key: 'global', website: {} })

const getGlobalSettings = async () => {
  const defaultSettings = createDefaultSettings()

  if (SystemSettings.db.readyState !== 1) {
    return defaultSettings
  }

  try {
    const existing = await SystemSettings.findOne({ key: 'global' }).maxTimeMS(3000)
    if (existing) {
      if (!existing.website) {
        existing.website = defaultSettings.website?.toObject?.() || {}
        existing.markModified('website')
        try {
          await existing.save()
        } catch {
        }
      }
      return existing
    }

    try {
      return await SystemSettings.create({ key: 'global', website: {} })
    } catch {
      return defaultSettings
    }
  } catch {
    return defaultSettings
  }
}

const maskSecret = (value) => {
  if (!value) return ''
  const v = String(value)
  if (v.length <= 4) return '****'
  return `${v.slice(0, 2)}***${v.slice(-2)}`
}

const getDefaultPricingPlans = () => [
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
]

const mergeWebsiteDefaults = (website) => {
  const defaultsDoc = new SystemSettings({ key: 'global' })
  const defaults = defaultsDoc.website?.toObject?.() || defaultsDoc.website || {}
  const current = website?.toObject?.() || website || {}
  const currentPlans = current.pricing?.plans
  const hasPlans = Array.isArray(currentPlans) && currentPlans.length > 0
  return {
    ...defaults,
    ...current,
    hero: { ...(defaults.hero || {}), ...(current.hero || {}) },
    cta: { ...(defaults.cta || {}), ...(current.cta || {}) },
    demo: { ...(defaults.demo || {}), ...(current.demo || {}) },
    pricing: {
      ...(defaults.pricing || {}),
      ...(current.pricing || {}),
      plans: hasPlans ? currentPlans : getDefaultPricingPlans()
    },
  }
}

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  })
}

router.get('/website', async (req, res) => {
  try {
    const settings = await getGlobalSettings()
    const website = mergeWebsiteDefaults(settings.website)

    res.json({
      ...website,
      demo: {
        enabled: !!website?.demo?.enabled,
        tenantSlug: website?.demo?.tenantSlug || 'demo',
        email: website?.demo?.email || 'demo@maqder.com',
        hasPassword: !!website?.demo?.password,
        passwordMasked: maskSecret(website?.demo?.password),
      },
    })
  } catch (error) {
    sendRouteError(res, error)
  }
})

router.post('/demo-login', async (req, res) => {
  try {
    if (SystemSettings.db.readyState !== 1) {
      return res.status(503).json({ error: 'Live demo is temporarily unavailable. Please try again in a moment.' })
    }

    const settings = await getGlobalSettings()
    const demo = settings.website?.demo

    if (!demo?.enabled) {
      return res.status(400).json({ error: 'Demo is disabled' })
    }

    const tenantSlug = String(demo.tenantSlug || 'demo').trim().toLowerCase()
    const email = String(demo.email || '').trim().toLowerCase()

    if (!tenantSlug || !email) {
      return res.status(400).json({ error: 'Demo settings are incomplete' })
    }

    let tenant = await withQueryTimeout(Tenant.findOne({ slug: tenantSlug }).select('name slug business settings branding subscription isActive'))

    if (!tenant) {
      const now = Date.now()
      tenant = await Tenant.create({
        name: 'Maqder Demo',
        slug: tenantSlug,
        business: {
          legalNameAr: 'مقدّر - عرض تجريبي',
          legalNameEn: 'Maqder Demo',
          vatNumber: `DEMO-${now}`,
          crNumber: `CR-${now}`
        },
        subscription: {
          plan: 'trial',
          status: 'active',
          maxUsers: 25,
          maxInvoices: 5000,
          billingCycle: 'monthly',
          price: 0
        },
        isActive: true
      })
    }

    if (!tenant.isActive) {
      return res.status(401).json({ error: 'Demo tenant is inactive' })
    }

    let user = await withQueryTimeout(User.findOne({ email, tenantId: tenant._id }))

    if (!user) {
      user = await User.create({
        email,
        password: demo.password || 'Demo@12345',
        firstName: 'Demo',
        lastName: 'User',
        firstNameAr: 'تجريبي',
        lastNameAr: 'مستخدم',
        tenantId: tenant._id,
        role: 'admin',
        isActive: true,
      })
    }

    const token = generateToken(user._id)

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        firstNameAr: user.firstNameAr,
        lastNameAr: user.lastNameAr,
        role: user.role,
        permissions: user.permissions,
        preferences: user.preferences,
        avatar: user.avatar,
      },
      tenant: {
        _id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        businessType: tenant.businessType,
        businessTypes: tenant.businessTypes,
        business: tenant.business,
        settings: tenant.settings,
        branding: tenant.branding,
        subscription: tenant.subscription
      },
    })
  } catch (error) {
    sendRouteError(res, error)
  }
})

export default router
