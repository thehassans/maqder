export const DEFAULT_VISION_2030_LOGO = '/saudi-vision-2030-logo.png'
export const INVOICE_BRANDING_CONTEXTS = ['trading', 'construction', 'travel_agency']
export const INVOICE_FONT_OPTIONS = [
  { value: 'helvetica', labelEn: 'Helvetica', labelAr: 'هيلفيتيكا' },
  { value: 'times', labelEn: 'Times', labelAr: 'تايمز' },
  { value: 'courier', labelEn: 'Courier', labelAr: 'كوريير' },
]

const CONTEXT_TEMPLATE_DEFAULTS = {
  trading: 5,
  construction: 6,
  travel_agency: 4,
}

const DEFAULT_INVOICE_TYPOGRAPHY = {
  bodyFontFamily: 'helvetica',
  headingFontFamily: 'helvetica',
  bodyFontSize: 12,
  headingFontSize: 18,
}

const LEGACY_TRAVEL_HEADER_TEXT_EN = 'Professional travel management and reservation services tailored for corporate and international journeys.'
const LEGACY_TRAVEL_HEADER_TEXT_AR = 'خدمات سفر وحجوزات احترافية مصممة لرحلات الأعمال والرحلات الدولية بثقة عالية.'

const pickLocalizedText = (englishValue, arabicValue, language = 'en') => {
  if (language === 'ar') return arabicValue || englishValue || ''
  return englishValue || arabicValue || ''
}

const pickFirstText = (...values) => values.find((value) => String(value || '').trim()) || ''

const buildDefaultHeaderText = (context, language = 'en') => {
  return ''
}

const buildDefaultContextFooterText = (context, language = 'en') => {
  if (context === 'travel_agency') {
    return language === 'ar'
      ? 'تذاكر طيران • حجوزات فنادق • برامج سفر • دعم احترافي متواصل'
      : 'Air Ticketing • Hotel Reservations • Travel Programs • Professional Support'
  }

  return ''
}

const normalizeInvoiceContext = (businessContext = 'trading') => {
  if (INVOICE_BRANDING_CONTEXTS.includes(businessContext)) return businessContext
  return 'trading'
}

const normalizeFontFamily = (value, fallback = DEFAULT_INVOICE_TYPOGRAPHY.bodyFontFamily) => {
  const normalized = String(value || '').trim().toLowerCase()
  if (INVOICE_FONT_OPTIONS.some((option) => option.value === normalized)) return normalized
  return fallback
}

const normalizeFontSize = (value, fallback) => {
  const size = Number(value)
  if (!Number.isFinite(size)) return fallback
  return Math.min(40, Math.max(9, size))
}

const sanitizeLegacyTravelHeaderText = (value, context) => {
  const raw = String(value || '').trim()
  if (context !== 'travel_agency') return raw
  if (raw === LEGACY_TRAVEL_HEADER_TEXT_EN || raw === LEGACY_TRAVEL_HEADER_TEXT_AR) return ''
  return raw
}

export const getInvoiceTypography = (tenant) => {
  const typography = tenant?.settings?.invoiceBranding?.typography || {}
  return {
    bodyFontFamily: normalizeFontFamily(typography?.bodyFontFamily, DEFAULT_INVOICE_TYPOGRAPHY.bodyFontFamily),
    headingFontFamily: normalizeFontFamily(typography?.headingFontFamily, DEFAULT_INVOICE_TYPOGRAPHY.headingFontFamily),
    bodyFontSize: normalizeFontSize(typography?.bodyFontSize, DEFAULT_INVOICE_TYPOGRAPHY.bodyFontSize),
    headingFontSize: normalizeFontSize(typography?.headingFontSize, DEFAULT_INVOICE_TYPOGRAPHY.headingFontSize),
  }
}

export const getInvoiceCssFontFamily = (fontFamily = 'helvetica') => {
  if (fontFamily === 'times') return '"Times New Roman", Times, serif'
  if (fontFamily === 'courier') return '"Courier New", Courier, monospace'
  return 'Arial, Helvetica, sans-serif'
}

export const getInvoiceBrandingProfile = (tenant, businessContext = 'trading') => {
  const context = normalizeInvoiceContext(businessContext)
  const contextProfiles = tenant?.settings?.invoiceBranding?.contextProfiles || {}
  const profile = contextProfiles?.[context] || {}

  return {
    templateId: Number(profile?.templateId || CONTEXT_TEMPLATE_DEFAULTS[context] || tenant?.settings?.invoicePdfTemplate || 1),
    logo: profile?.logo || '',
    headerTextEn: profile?.headerTextEn || '',
    headerTextAr: profile?.headerTextAr || '',
    footerTextEn: profile?.footerTextEn || '',
    footerTextAr: profile?.footerTextAr || '',
  }
}

const buildDefaultFooterText = (tenant, language = 'en') => {
  const business = tenant?.business || {}
  const address = [
    business?.address?.street,
    business?.address?.district,
    business?.address?.city,
    business?.address?.postalCode,
    business?.address?.country,
  ].filter(Boolean).join(language === 'ar' ? '، ' : ', ')

  return [
    address,
    business?.contactPhone,
    business?.contactEmail,
    business?.website,
  ].filter(Boolean).join(' • ')
}

export const getInvoiceTemplateId = (tenant, businessContext = 'trading', explicitTemplateId) => {
  const context = normalizeInvoiceContext(businessContext)
  return Number(explicitTemplateId || getInvoiceBrandingProfile(tenant, context).templateId || tenant?.settings?.invoicePdfTemplate || 1)
}

export const getInvoiceBranding = (tenant, language = 'en', businessContext = 'trading') => {
  const invoiceBranding = tenant?.settings?.invoiceBranding || {}
  const business = tenant?.business || {}
  const context = normalizeInvoiceContext(businessContext)
  const contextProfile = getInvoiceBrandingProfile(tenant, context)
  const typography = getInvoiceTypography(tenant)

  return {
    businessContext: context,
    templateId: getInvoiceTemplateId(tenant, context),
    companyName: pickLocalizedText(business?.legalNameEn, business?.legalNameAr, language),
    logoSrc: contextProfile.logo || invoiceBranding?.logo || tenant?.branding?.logo || '/maqder-logo.png',
    headerText: pickLocalizedText(
      sanitizeLegacyTravelHeaderText(pickFirstText(contextProfile.headerTextEn, invoiceBranding?.headerTextEn), context) || buildDefaultHeaderText(context, 'en'),
      sanitizeLegacyTravelHeaderText(pickFirstText(contextProfile.headerTextAr, invoiceBranding?.headerTextAr), context) || buildDefaultHeaderText(context, 'ar'),
      language,
    ),
    footerText: pickLocalizedText(
      pickFirstText(contextProfile.footerTextEn, invoiceBranding?.footerTextEn) || buildDefaultContextFooterText(context, 'en'),
      pickFirstText(contextProfile.footerTextAr, invoiceBranding?.footerTextAr) || buildDefaultContextFooterText(context, 'ar'),
      language,
    ) || buildDefaultFooterText(tenant, language),
    showVision2030: invoiceBranding?.showVision2030 !== false,
    vision2030LogoSrc: invoiceBranding?.vision2030Logo || DEFAULT_VISION_2030_LOGO,
    vatNumber: business?.vatNumber || '',
    crNumber: business?.crNumber || '',
    primaryColor: '#0F172A',
    secondaryColor: '#334155',
    typography,
  }
}

export const splitBrandingText = (value) => String(value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
