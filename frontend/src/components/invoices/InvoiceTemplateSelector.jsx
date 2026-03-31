import { invoiceTemplateOptions } from '../../lib/invoiceTemplates'

export default function InvoiceTemplateSelector({ language = 'en', value = 1, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {invoiceTemplateOptions.map((template) => {
        const isActive = Number(value) === template.id
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onChange(template.id)}
            className={`rounded-2xl border p-4 text-start transition-all ${
              isActive
                ? 'border-primary-500 bg-primary-50 shadow-sm dark:bg-primary-900/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-dark-600 dark:hover:border-dark-500'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {language === 'ar' ? template.nameAr : template.nameEn}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? template.descriptionAr : template.descriptionEn}
                </p>
              </div>
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${isActive ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-300'}`}>
                {template.id}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
