export const invoiceTemplateOptions = [
  {
    id: 1,
    nameEn: 'Classic Minimal',
    nameAr: 'كلاسيكي بسيط',
    descriptionEn: 'Balanced layout with clean borders',
    descriptionAr: 'تخطيط متوازن بحدود نظيفة',
  },
  {
    id: 2,
    nameEn: 'Soft Gradient',
    nameAr: 'تدرج ناعم',
    descriptionEn: 'Minimal gradient header with light accents',
    descriptionAr: 'ترويسة متدرجة بلمسات خفيفة',
  },
  {
    id: 3,
    nameEn: 'Sidebar Mono',
    nameAr: 'شريط جانبي أحادي',
    descriptionEn: 'Slim side accent and airy spacing',
    descriptionAr: 'شريط جانبي رفيع ومساحات مريحة',
  },
  {
    id: 4,
    nameEn: 'Ultra Minimal',
    nameAr: 'فائق البساطة',
    descriptionEn: 'Subtle dividers and monochrome styling',
    descriptionAr: 'فواصل خفيفة وتصميم أحادي هادئ',
  },
  {
    id: 5,
    nameEn: 'Executive Dark',
    nameAr: 'تنفيذي داكن',
    descriptionEn: 'High-contrast elegant corporate style',
    descriptionAr: 'تصميم تنفيذي عالي التباين',
  },
  {
    id: 6,
    nameEn: 'Outline Grid',
    nameAr: 'شبكة محددة',
    descriptionEn: 'Structured boxed layout inspired by formal tax invoices',
    descriptionAr: 'تصميم شبكي مستلهم من الفواتير الضريبية الرسمية',
  },
]

export const getInvoiceTemplateLabel = (templateId, language = 'en') => {
  const template = invoiceTemplateOptions.find((item) => item.id === Number(templateId)) || invoiceTemplateOptions[0]
  return language === 'ar' ? template.nameAr : template.nameEn
}
