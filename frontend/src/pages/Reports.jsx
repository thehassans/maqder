import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'
import Money from '../components/ui/Money'
import ExportMenu from '../components/ui/ExportMenu'

export default function Reports() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const [reportType, setReportType] = useState('vat')

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', reportType, month, year],
    queryFn: () =>
      api
        .get(reportType === 'business' ? '/reports/business-summary' : '/reports/vat-return', { params: { month, year } })
        .then((res) => res.data)
  })

  const money = (value) => <Money value={value} minimumFractionDigits={2} maximumFractionDigits={2} />

  const totals = data?.totals
  const byCategory = totals?.byCategory

  const [exportTable, setExportTable] = useState('byCategory')

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
            {reportType === 'business'
              ? (language === 'ar' ? 'تقرير الأعمال' : 'Business Report')
              : (language === 'ar' ? 'تقرير إقرار ضريبة القيمة المضافة' : 'VAT Return Report')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={reportType}
            onChange={(e) => {
              const v = e.target.value
              setReportType(v)
              setExportTable(v === 'business' ? 'salesByTransactionType' : 'byCategory')
            }}
            className="select sm:w-44"
          >
            <option value="vat">{language === 'ar' ? 'VAT' : 'VAT'}</option>
            <option value="business">{language === 'ar' ? 'الأعمال' : 'Business'}</option>
          </select>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-500">
              {language === 'ar' ? 'تصدير جداول التقرير' : 'Export report tables'}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <select value={exportTable} onChange={(e) => setExportTable(e.target.value)} className="select sm:w-56">
                {reportType === 'business' ? (
                  <>
                    <option value="salesByTransactionType">{language === 'ar' ? 'المبيعات حسب النوع' : 'Sales by Type'}</option>
                    <option value="expensesByCategory">{language === 'ar' ? 'المصاريف حسب التصنيف' : 'Expenses by Category'}</option>
                    <option value="topCustomers">{language === 'ar' ? 'أفضل العملاء' : 'Top Customers'}</option>
                  </>
                ) : (
                  <>
                    <option value="byCategory">{language === 'ar' ? 'ملخص حسب التصنيف' : 'Summary by Category'}</option>
                    <option value="byTransactionType">{language === 'ar' ? 'حسب نوع المعاملة' : 'By Transaction Type'}</option>
                    <option value="byTaxCategory">{language === 'ar' ? 'تفاصيل حسب فئة الضريبة' : 'Details by Tax Category'}</option>
                  </>
                )}
              </select>

              <ExportMenu
                language={language}
                t={t}
                rows={
                  reportType === 'business'
                    ? exportTable === 'expensesByCategory'
                      ? (data?.breakdown?.expensesByCategory || []).map((row) => ({
                        category: row._id,
                        count: row.count || 0,
                        totalAmount: row.totalAmount || 0,
                      }))
                      : exportTable === 'topCustomers'
                        ? (data?.breakdown?.topCustomers || []).map((row) => ({
                          customer: row._id,
                          invoiceCount: row.invoiceCount || 0,
                          revenue: row.revenue || 0,
                        }))
                        : (data?.breakdown?.salesByTransactionType || []).map((row) => ({
                          type: row._id,
                          invoiceCount: row.invoiceCount || 0,
                          revenue: row.revenue || 0,
                          tax: row.tax || 0,
                        }))
                    : exportTable === 'byTransactionType'
                      ? (data?.breakdown?.byTransactionType || []).map((row) => ({
                        type: row._id,
                        invoiceCount: row.invoiceCount || 0,
                        totalTax: row.totalTax || 0,
                      }))
                      : exportTable === 'byTaxCategory'
                        ? (data?.breakdown?.byTaxCategory || []).map((row) => ({
                          category: row._id?.taxCategory || '-',
                          rate: row._id?.taxRate ?? 0,
                          taxableAmount: row.taxableAmount || 0,
                          taxAmount: row.taxAmount || 0,
                        }))
                        : categories.map((c) => ({
                          category: c.label,
                          taxableAmount: byCategory?.[c.key]?.taxableAmount || 0,
                          taxAmount: byCategory?.[c.key]?.taxAmount || 0,
                        }))
                }
                columns={
                  reportType === 'business'
                    ? exportTable === 'expensesByCategory'
                      ? [
                        { key: 'category', label: language === 'ar' ? 'التصنيف' : 'Category', value: (r) => r.category },
                        { key: 'count', label: language === 'ar' ? 'العدد' : 'Count', value: (r) => r.count },
                        { key: 'totalAmount', label: language === 'ar' ? 'الإجمالي' : 'Total', value: (r) => r.totalAmount },
                      ]
                      : exportTable === 'topCustomers'
                        ? [
                          { key: 'customer', label: language === 'ar' ? 'العميل' : 'Customer', value: (r) => r.customer },
                          { key: 'invoiceCount', label: language === 'ar' ? 'عدد الفواتير' : 'Invoices', value: (r) => r.invoiceCount },
                          { key: 'revenue', label: language === 'ar' ? 'الإيراد' : 'Revenue', value: (r) => r.revenue },
                        ]
                        : [
                          { key: 'type', label: language === 'ar' ? 'النوع' : 'Type', value: (r) => r.type },
                          { key: 'invoiceCount', label: language === 'ar' ? 'عدد الفواتير' : 'Invoices', value: (r) => r.invoiceCount },
                          { key: 'revenue', label: language === 'ar' ? 'الإيراد' : 'Revenue', value: (r) => r.revenue },
                          { key: 'tax', label: language === 'ar' ? 'الضريبة' : 'Tax', value: (r) => r.tax },
                        ]
                    : exportTable === 'byTransactionType'
                      ? [
                        { key: 'type', label: language === 'ar' ? 'النوع' : 'Type', value: (r) => r.type },
                        { key: 'invoiceCount', label: language === 'ar' ? 'عدد الفواتير' : 'Invoices', value: (r) => r.invoiceCount },
                        { key: 'totalTax', label: language === 'ar' ? 'الضريبة' : 'VAT', value: (r) => r.totalTax },
                      ]
                      : exportTable === 'byTaxCategory'
                        ? [
                          { key: 'category', label: language === 'ar' ? 'الفئة' : 'Category', value: (r) => r.category },
                          { key: 'rate', label: language === 'ar' ? 'النسبة' : 'Rate', value: (r) => `${r.rate}%` },
                          { key: 'taxableAmount', label: language === 'ar' ? 'خاضع للضريبة' : 'Taxable', value: (r) => r.taxableAmount },
                          { key: 'taxAmount', label: language === 'ar' ? 'الضريبة' : 'VAT', value: (r) => r.taxAmount },
                        ]
                        : [
                          { key: 'category', label: language === 'ar' ? 'التصنيف' : 'Category', value: (r) => r.category },
                          { key: 'taxableAmount', label: language === 'ar' ? 'خاضع للضريبة' : 'Taxable', value: (r) => r.taxableAmount },
                          { key: 'taxAmount', label: language === 'ar' ? 'الضريبة' : 'VAT', value: (r) => r.taxAmount },
                        ]
                }
                fileBaseName={
                  reportType === 'business'
                    ? exportTable === 'expensesByCategory'
                      ? (language === 'ar' ? 'تقرير_المصاريف_حسب_التصنيف' : 'Business_Expenses_By_Category')
                      : exportTable === 'topCustomers'
                        ? (language === 'ar' ? 'تقرير_أفضل_العملاء' : 'Business_Top_Customers')
                        : (language === 'ar' ? 'تقرير_المبيعات_حسب_النوع' : 'Business_Sales_By_Type')
                    : exportTable === 'byTransactionType'
                      ? (language === 'ar' ? 'تقرير_حسب_نوع_المعاملة' : 'VAT_Return_By_TransactionType')
                      : exportTable === 'byTaxCategory'
                        ? (language === 'ar' ? 'تفاصيل_حسب_فئة_الضريبة' : 'VAT_Return_By_TaxCategory')
                        : (language === 'ar' ? 'تقرير_الضريبة_حسب_التصنيف' : 'VAT_Return_By_Category')
                }
                title={
                  reportType === 'business'
                    ? exportTable === 'expensesByCategory'
                      ? (language === 'ar' ? 'المصاريف حسب التصنيف' : 'Expenses by Category')
                      : exportTable === 'topCustomers'
                        ? (language === 'ar' ? 'أفضل العملاء' : 'Top Customers')
                        : (language === 'ar' ? 'المبيعات حسب النوع' : 'Sales by Type')
                    : exportTable === 'byTransactionType'
                      ? (language === 'ar' ? 'حسب نوع المعاملة' : 'By Transaction Type')
                      : exportTable === 'byTaxCategory'
                        ? (language === 'ar' ? 'تفاصيل حسب فئة الضريبة' : 'Details by Tax Category')
                        : (language === 'ar' ? 'ملخص حسب التصنيف' : 'Summary by Category')
                }
                disabled={false}
              />
            </div>
          </div>

          {reportType === 'business' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'المبيعات' : 'Sales'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{money(totals?.sales?.grandTotal || 0)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'المشتريات' : 'Purchases'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{money(totals?.purchases?.grandTotal || 0)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'المصاريف' : 'Expenses'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{money(totals?.expenses?.totalAmount || 0)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'صافي الربح' : 'Net Profit'}</p>
                  <p className="text-2xl font-bold text-primary-600">{money(totals?.net || 0)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {language === 'ar' ? 'المبيعات حسب النوع' : 'Sales by Type'}
                  </h3>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{language === 'ar' ? 'النوع' : 'Type'}</th>
                          <th>{language === 'ar' ? 'عدد الفواتير' : 'Invoices'}</th>
                          <th>{language === 'ar' ? 'الإيراد' : 'Revenue'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.breakdown?.salesByTransactionType || []).map((row) => (
                          <tr key={row._id}>
                            <td className="font-medium">{row._id}</td>
                            <td>{(row.invoiceCount || 0).toLocaleString()}</td>
                            <td>{money(row.revenue || 0)}</td>
                          </tr>
                        ))}
                        {(data?.breakdown?.salesByTransactionType || []).length === 0 && (
                          <tr>
                            <td colSpan={3} className="text-center text-gray-500">{t('noData')}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {language === 'ar' ? 'المصاريف حسب التصنيف' : 'Expenses by Category'}
                  </h3>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                          <th>{language === 'ar' ? 'العدد' : 'Count'}</th>
                          <th>{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.breakdown?.expensesByCategory || []).map((row) => (
                          <tr key={row._id}>
                            <td className="font-medium">{row._id}</td>
                            <td>{(row.count || 0).toLocaleString()}</td>
                            <td>{money(row.totalAmount || 0)}</td>
                          </tr>
                        ))}
                        {(data?.breakdown?.expensesByCategory || []).length === 0 && (
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
                  {language === 'ar' ? 'أفضل العملاء' : 'Top Customers'}
                </h3>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{language === 'ar' ? 'العميل' : 'Customer'}</th>
                        <th>{language === 'ar' ? 'عدد الفواتير' : 'Invoices'}</th>
                        <th>{language === 'ar' ? 'الإيراد' : 'Revenue'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.breakdown?.topCustomers || []).map((row, i) => (
                        <tr key={`${row._id}-${i}`}>
                          <td className="font-medium">{row._id}</td>
                          <td>{(row.invoiceCount || 0).toLocaleString()}</td>
                          <td>{money(row.revenue || 0)}</td>
                        </tr>
                      ))}
                      {(data?.breakdown?.topCustomers || []).length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center text-gray-500">{t('noData')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
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
        </>
      )}
    </div>
  )
}
