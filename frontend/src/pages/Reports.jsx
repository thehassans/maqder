import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'
import Money from '../components/ui/Money'

export default function Reports() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const { data, isLoading, error } = useQuery({
    queryKey: ['vat-return', month, year],
    queryFn: () => api.get('/reports/vat-return', { params: { month, year } }).then((res) => res.data)
  })

  const money = (value) => <Money value={value} minimumFractionDigits={2} maximumFractionDigits={2} />

  const totals = data?.totals
  const byCategory = totals?.byCategory

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  const categories = [
    {
      key: 'standardRated',
      label: language === 'ar' ? 'خاضع للضريبة (Standard)' : 'Standard Rated'
    },
    {
      key: 'zeroRated',
      label: language === 'ar' ? 'صفرية (Zero)' : 'Zero Rated'
    },
    {
      key: 'exempt',
      label: language === 'ar' ? 'معفاة (Exempt)' : 'Exempt'
    },
    {
      key: 'outOfScope',
      label: language === 'ar' ? 'خارج النطاق (Out of Scope)' : 'Out of Scope'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'تقرير إقرار ضريبة القيمة المضافة' : 'VAT Return Report'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="select sm:w-44">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2024, m - 1).toLocaleString(language === 'ar' ? 'ar' : 'en', { month: 'long' })}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="select sm:w-32">
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="card p-6 text-red-600">
          {language === 'ar' ? 'فشل تحميل التقرير' : 'Failed to load report'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-sm text-gray-500">{language === 'ar' ? 'عدد الفواتير' : 'Invoices'}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{(totals?.invoiceCount || 0).toLocaleString()}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500">{language === 'ar' ? 'المبلغ الخاضع للضريبة' : 'Taxable Amount'}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{money(totals?.taxableAmount || 0)}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500">{language === 'ar' ? 'إجمالي ضريبة القيمة المضافة' : 'Total VAT'}</p>
              <p className="text-2xl font-bold text-primary-600">{money(totals?.totalTax || 0)}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500">{language === 'ar' ? 'الإجمالي' : 'Grand Total'}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{money(totals?.grandTotal || 0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'ar' ? 'ملخص حسب التصنيف' : 'Summary by Category'}
              </h3>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                      <th>{language === 'ar' ? 'خاضع للضريبة' : 'Taxable'}</th>
                      <th>{language === 'ar' ? 'الضريبة' : 'VAT'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.key}>
                        <td className="font-medium">{c.label}</td>
                        <td>{money(byCategory?.[c.key]?.taxableAmount || 0)}</td>
                        <td>{money(byCategory?.[c.key]?.taxAmount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'ar' ? 'حسب نوع المعاملة' : 'By Transaction Type'}
              </h3>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{language === 'ar' ? 'النوع' : 'Type'}</th>
                      <th>{language === 'ar' ? 'عدد الفواتير' : 'Invoices'}</th>
                      <th>{language === 'ar' ? 'الضريبة' : 'VAT'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.breakdown?.byTransactionType || []).map((row) => (
                      <tr key={row._id}>
                        <td className="font-medium">{row._id}</td>
                        <td>{(row.invoiceCount || 0).toLocaleString()}</td>
                        <td>{money(row.totalTax || 0)}</td>
                      </tr>
                    ))}
                    {(data?.breakdown?.byTransactionType || []).length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center text-gray-500">{t('noData')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {language === 'ar' ? 'تفاصيل حسب فئة الضريبة' : 'Details by Tax Category'}
            </h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{language === 'ar' ? 'الفئة' : 'Category'}</th>
                    <th>{language === 'ar' ? 'النسبة' : 'Rate'}</th>
                    <th>{language === 'ar' ? 'خاضع للضريبة' : 'Taxable'}</th>
                    <th>{language === 'ar' ? 'الضريبة' : 'VAT'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.breakdown?.byTaxCategory || []).map((row, i) => (
                    <tr key={`${row._id?.taxCategory}-${row._id?.taxRate}-${i}`}>
                      <td className="font-medium">{row._id?.taxCategory || '-'}</td>
                      <td>{row._id?.taxRate ?? 0}%</td>
                      <td>{money(row.taxableAmount || 0)}</td>
                      <td>{money(row.taxAmount || 0)}</td>
                    </tr>
                  ))}
                  {(data?.breakdown?.byTaxCategory || []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-gray-500">{t('noData')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
