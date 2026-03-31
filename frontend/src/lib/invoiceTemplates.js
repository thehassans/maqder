export const invoiceTemplateOptions = [
  {
    id: 1,
    nameEn: 'Essential',
    nameAr: 'أساسي',
    descriptionEn: 'Clean layout with balanced spacing',
    descriptionAr: 'تخطيط نظيف بمسافات متوازنة',
  },
  {
    id: 2,
    nameEn: 'Modern',
    nameAr: 'حديث',
    descriptionEn: 'Light corporate accents with refined contrast',
    descriptionAr: 'لمسات مؤسسية خفيفة بتباين أنيق',
  },
  {
    id: 3,
    nameEn: 'Mono',
    nameAr: 'أحادي',
    descriptionEn: 'Monochrome invoice with compact rhythm',
    descriptionAr: 'فاتورة أحادية بإيقاع بصري متماسك',
  },
  {
    id: 4,
    nameEn: 'Air',
    nameAr: 'هواء',
    descriptionEn: 'Open whitespace and subtle dividers',
    descriptionAr: 'مساحات مفتوحة وفواصل هادئة',
  },
  {
    id: 5,
    nameEn: 'Ledger',
    nameAr: 'سجل',
    descriptionEn: 'Formal business layout with crisp rules',
    descriptionAr: 'تصميم أعمال رسمي بخطوط دقيقة',
  },
  {
    id: 6,
    nameEn: 'Signature',
    nameAr: 'توقيع',
    descriptionEn: 'Premium minimalist layout for formal invoices',
    descriptionAr: 'تصميم بسيط فاخر للفواتير الرسمية',
  },
]

export const getInvoiceTemplateLabel = (templateId, language = 'en') => {
  const template = invoiceTemplateOptions.find((item) => item.id === Number(templateId)) || invoiceTemplateOptions[0]
  return language === 'ar' ? template.nameAr : template.nameEn
}
