export const DEFAULT_VISION_2030_LOGO = '/saudi-vision-2030-logo.png'

const pickLocalizedText = (englishValue, arabicValue, language = 'en') => {
  if (language === 'ar') return arabicValue || englishValue || ''
  return englishValue || arabicValue || ''
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

export const getInvoiceBranding = (tenant, language = 'en') => {
  const invoiceBranding = tenant?.settings?.invoiceBranding || {}
  const business = tenant?.business || {}

  return {
    companyName: pickLocalizedText(business?.legalNameEn, business?.legalNameAr, language),
    logoSrc: invoiceBranding?.logo || tenant?.branding?.logo || '/maqder-logo.png',
    headerText: pickLocalizedText(invoiceBranding?.headerTextEn, invoiceBranding?.headerTextAr, language),
    footerText: pickLocalizedText(invoiceBranding?.footerTextEn, invoiceBranding?.footerTextAr, language) || buildDefaultFooterText(tenant, language),
    showVision2030: invoiceBranding?.showVision2030 !== false,
    vision2030LogoSrc: invoiceBranding?.vision2030Logo || DEFAULT_VISION_2030_LOGO,
    vatNumber: business?.vatNumber || '',
    crNumber: business?.crNumber || '',
    primaryColor: '#0F172A',
    secondaryColor: '#334155',
  }
}

export const splitBrandingText = (value) => String(value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
