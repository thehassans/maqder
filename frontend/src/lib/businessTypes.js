export const BUSINESS_TYPES = ['trading', 'construction', 'travel_agency', 'restaurant']

export const getBusinessTypeOptions = (language = 'en') => [
  {
    id: 'trading',
    label: language === 'ar' ? 'التجارة' : 'Trading',
    description: language === 'ar' ? 'المخزون والمستودعات والمشتريات' : 'Inventory, warehouses, and purchasing',
  },
  {
    id: 'construction',
    label: language === 'ar' ? 'المقاولات' : 'Construction',
    description: language === 'ar' ? 'فواتير المشاريع والخدمات والمقاولات' : 'Project, service, and construction billing',
  },
  {
    id: 'travel_agency',
    label: language === 'ar' ? 'وكالة سفر' : 'Travel Agency',
    description: language === 'ar' ? 'حجوزات السفر وفواتير التذاكر' : 'Travel bookings and ticket invoices',
  },
  {
    id: 'restaurant',
    label: language === 'ar' ? 'مطعم' : 'Restaurant',
    description: language === 'ar' ? 'الطلبات ونقاط البيع والمطبخ' : 'Orders, POS, and kitchen flows',
  },
]

export const normalizeBusinessTypes = (input, fallback = 'trading') => {
  const values = Array.isArray(input) ? input : [input]
  const normalized = values
    .map((value) => String(value || '').trim())
    .filter((value) => BUSINESS_TYPES.includes(value))

  if (normalized.length === 0) {
    return BUSINESS_TYPES.includes(fallback) ? [fallback] : ['trading']
  }

  return [...new Set(normalized)]
}

export const getTenantBusinessTypes = (tenant) => {
  if (Array.isArray(tenant?.businessTypes) && tenant.businessTypes.length > 0) {
    return normalizeBusinessTypes(tenant.businessTypes)
  }

  return normalizeBusinessTypes(tenant?.businessType)
}

export const getPrimaryBusinessType = (tenant) => getTenantBusinessTypes(tenant)[0] || 'trading'

export const hasBusinessType = (tenant, businessType) => getTenantBusinessTypes(tenant).includes(businessType)
