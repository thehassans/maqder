import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Factory, Package, TrendingUp, ArrowUpRight, Edit } from 'lucide-react'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'
import Money from '../components/ui/Money'
import ExportMenu from '../components/ui/ExportMenu'

export default function MRP() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [multiplier, setMultiplier] = useState(2)

  const exportColumns = [
    { key: 'sku', label: 'SKU', value: (r) => r?.sku || '' },
    {
      key: 'name',
      label: language === 'ar' ? 'المنتج' : 'Product',
      value: (r) => (language === 'ar' ? r?.nameAr || r?.nameEn : r?.nameEn || r?.nameAr) || ''
    },
    { key: 'category', label: language === 'ar' ? 'الفئة' : 'Category', value: (r) => r?.category || '' },
    { key: 'currentStock', label: language === 'ar' ? 'الحالي' : 'On Hand', value: (r) => r?.currentStock ?? '' },
    { key: 'incomingQty', label: language === 'ar' ? 'وارد' : 'Incoming', value: (r) => r?.incomingQty ?? '' },
    { key: 'reorderPoint', label: language === 'ar' ? 'نقطة إعادة الطلب' : 'Reorder Point', value: (r) => r?.reorderPoint ?? '' },
    { key: 'targetStock', label: language === 'ar' ? 'الهدف' : 'Target', value: (r) => r?.targetStock ?? '' },
    { key: 'recommendedQty', label: language === 'ar' ? 'مقترح' : 'Suggested', value: (r) => r?.recommendedQty ?? '' },
    { key: 'estimatedCost', label: language === 'ar' ? 'تكلفة' : 'Cost', value: (r) => r?.estimatedCost ?? '' },
  ]

  const { data, isLoading } = useQuery({
    queryKey: ['mrp-suggestions', page, search, multiplier],
    queryFn: () =>
      api
        .get('/mrp/suggestions', {
          params: {
            page,
            limit: 25,
            search,
            multiplier,
          },
        })
        .then((res) => res.data),
  })

  const getExportRows = async () => {
    const limit = 200
    let currentPage = 1
    let all = []

    while (true) {
      const res = await api.get('/mrp/suggestions', {
        params: { page: currentPage, limit, search, multiplier }
      })
      const batch = res.data?.suggestions || []
      all = all.concat(batch)

      const pages = res.data?.pagination?.pages || 1
      if (currentPage >= pages) break
      currentPage += 1

      if (all.length >= 10000) break
    }

    return all
  }

  const { data: stats } = useQuery({
    queryKey: ['mrp-stats', search, multiplier],
    queryFn: () => api.get('/mrp/stats', { params: { search, multiplier } }).then((res) => res.data),
  })

  const suggestions = data?.suggestions || []
  const pagination = data?.pagination

  const totals = stats?.totals
  const byCategory = stats?.byCategory || []

  const summary = useMemo(() => {
    return {
      suggestions: totals?.suggestions || 0,
      recommendedQty: totals?.recommendedQty || 0,
      estimatedCost: totals?.estimatedCost || 0,
      incomingQty: totals?.incomingQty || 0,
    }
  }, [totals])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'تخطيط الاحتياجات (MRP)' : 'MRP'}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar'
              ? 'اقتراحات إعادة الطلب بناءً على المخزون الحالي والطلبات الواردة'
              : 'Reorder suggestions based on stock and incoming purchase orders'}
          </p>
        </div>
        <ExportMenu
          language={language}
          t={t}
          rows={suggestions}
          getRows={getExportRows}
          columns={exportColumns}
          fileBaseName={language === 'ar' ? 'MRP' : 'MRP'}
          title={language === 'ar' ? 'MRP' : 'MRP'}
          disabled={isLoading || suggestions.length === 0}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <Factory className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'اقتراحات' : 'Suggestions'}</p>
            <p className="text-2xl font-bold">{summary.suggestions}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'كمية مقترحة' : 'Recommended Qty'}</p>
            <p className="text-2xl font-bold text-emerald-600">{Number(summary.recommendedQty || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <ArrowUpRight className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'تكلفة تقديرية' : 'Estimated Cost'}</p>
            <p className="text-2xl font-bold text-blue-600">
              <Money value={summary.estimatedCost} minimumFractionDigits={0} maximumFractionDigits={0} />
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Package className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'وارد (PO)' : 'Incoming (PO)'} </p>
            <p className="text-2xl font-bold text-amber-600">{Number(summary.incomingQty || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'بحث بالاسم / SKU / الباركود...' : 'Search by name / SKU / barcode...'}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="input ps-10"
              />
            </div>

            <select
              value={multiplier}
              onChange={(e) => {
                setMultiplier(Number(e.target.value))
                setPage(1)
              }}
              className="select w-full sm:w-56"
            >
              {[1, 2, 3, 4, 5].map((m) => (
                <option key={m} value={m}>
                  {language === 'ar' ? `هدف المخزون: ${m}× نقطة إعادة الطلب` : `Target: ${m}× reorder point`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card p-4">
          <p className="text-sm text-gray-500">{language === 'ar' ? 'أعلى فئات بالتكلفة' : 'Top categories by cost'}</p>
          <div className="mt-3 space-y-2">
            {byCategory.length === 0 ? (
              <p className="text-sm text-gray-500">{t('noData')}</p>
            ) : (
              byCategory.slice(0, 4).map((row) => (
                <div key={row.category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-200 truncate max-w-[60%]">{row.category}</span>
                  <span className="text-sm font-semibold">
                    <Money value={row.estimatedCost || 0} minimumFractionDigits={0} maximumFractionDigits={0} />
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
        {isLoading ? (
          <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'SKU' : 'SKU'}</th>
                  <th>{language === 'ar' ? 'المنتج' : 'Product'}</th>
                  <th>{language === 'ar' ? 'الفئة' : 'Category'}</th>
                  <th>{language === 'ar' ? 'الحالي' : 'On Hand'}</th>
                  <th>{language === 'ar' ? 'وارد' : 'Incoming'}</th>
                  <th>{language === 'ar' ? 'نقطة إعادة الطلب' : 'Reorder Point'}</th>
                  <th>{language === 'ar' ? 'الهدف' : 'Target'}</th>
                  <th>{language === 'ar' ? 'مقترح' : 'Suggested'}</th>
                  <th>{language === 'ar' ? 'تكلفة' : 'Cost'}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s) => (
                  <tr key={s.productId}>
                    <td className="font-mono text-sm">{s.sku}</td>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {language === 'ar' ? s.nameAr || s.nameEn : s.nameEn || s.nameAr}
                        </p>
                        <p className="text-xs text-gray-500">{language === 'ar' ? 'مخزون متوقع:' : 'Projected:'} {Number(s.projectedStock || 0).toLocaleString()}</p>
                      </div>
                    </td>
                    <td>{s.category || '-'}</td>
                    <td className="font-mono text-sm">{Number(s.currentStock || 0).toLocaleString()}</td>
                    <td className="font-mono text-sm">{Number(s.incomingQty || 0).toLocaleString()}</td>
                    <td className="font-mono text-sm">{Number(s.reorderPoint || 0).toLocaleString()}</td>
                    <td className="font-mono text-sm">{Number(s.targetStock || 0).toLocaleString()}</td>
                    <td className="font-mono text-sm font-semibold text-emerald-600">{Number(s.recommendedQty || 0).toLocaleString()}</td>
                    <td className="font-semibold">
                      <Money value={s.estimatedCost || 0} minimumFractionDigits={0} maximumFractionDigits={0} />
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link to={`/products/${s.productId}`} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {pagination?.pages > 1 && (
        <div className="flex items-center justify-between">
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            {language === 'ar' ? 'السابق' : 'Previous'}
          </button>
          <div className="text-sm text-gray-500">
            {language === 'ar' ? 'صفحة' : 'Page'} {page} / {pagination.pages}
          </div>
          <button
            className="btn btn-secondary"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
          >
            {language === 'ar' ? 'التالي' : 'Next'}
          </button>
        </div>
      )}
    </div>
  )
}
