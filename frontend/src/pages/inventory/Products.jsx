import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Package, AlertTriangle, Eye, Edit, QrCode } from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import Money from '../../components/ui/Money'
import ExportMenu from '../../components/ui/ExportMenu'

export default function Products() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ category: '', status: '' })
  const [page, setPage] = useState(1)

  const exportColumns = [
    {
      key: 'name',
      label: t('productName'),
      value: (r) => (language === 'ar' ? r?.nameAr || r?.nameEn : r?.nameEn || r?.nameAr) || ''
    },
    {
      key: 'sku',
      label: t('sku'),
      value: (r) => r?.sku || ''
    },
    {
      key: 'barcode',
      label: t('barcode'),
      value: (r) => r?.barcode || ''
    },
    {
      key: 'category',
      label: t('category'),
      value: (r) => r?.category || ''
    },
    {
      key: 'costPrice',
      label: t('costPrice'),
      value: (r) => r?.costPrice ?? ''
    },
    {
      key: 'sellingPrice',
      label: t('sellingPrice'),
      value: (r) => r?.sellingPrice ?? ''
    },
    {
      key: 'totalStock',
      label: t('quantity'),
      value: (r) => r?.totalStock ?? ''
    },
    {
      key: 'status',
      label: t('status'),
      value: (r) => r?.status || ''
    },
  ]

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, filters],
    queryFn: () => api.get('/products', { params: { page, search, ...filters } }).then(res => res.data)
  })

  const getExportRows = async () => {
    const limit = 200
    let currentPage = 1
    let all = []

    while (true) {
      const res = await api.get('/products', {
        params: { page: currentPage, limit, search, ...filters }
      })
      const batch = res.data?.products || []
      all = all.concat(batch)

      const pages = res.data?.pagination?.pages || 1
      if (currentPage >= pages) break
      currentPage += 1

      if (all.length >= 10000) break
    }

    return all
  }

  const { data: stats } = useQuery({
    queryKey: ['products-stats'],
    queryFn: () => api.get('/products/stats').then(res => res.data)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('products')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة المنتجات والمخزون' : 'Manage products and inventory'}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            language={language}
            t={t}
            rows={data?.products || []}
            getRows={getExportRows}
            columns={exportColumns}
            fileBaseName={language === 'ar' ? 'المنتجات' : 'Products'}
            title={language === 'ar' ? 'المنتجات' : 'Products'}
            disabled={isLoading || (data?.products || []).length === 0}
          />
          <Link to="/products/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'إضافة منتج' : 'Add Product'}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <Package className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}</p>
            <p className="text-2xl font-bold">{stats?.totals?.[0]?.totalProducts || 0}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'إجمالي المخزون' : 'Total Stock'}</p>
            <p className="text-2xl font-bold">{stats?.totals?.[0]?.totalStock?.toLocaleString() || 0}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'قيمة المخزون' : 'Stock Value'}</p>
            <p className="text-xl font-bold"><Money value={stats?.totals?.[0]?.totalValue} /></p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('lowStock')}</p>
            <p className="text-2xl font-bold text-amber-600">{stats?.lowStock?.[0]?.count || 0}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder={`${t('search')} / ${t('barcode')}...`} value={search} onChange={(e) => setSearch(e.target.value)} className="input ps-10" />
          </div>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="select w-full sm:w-40">
            <option value="">{language === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
            <option value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</option>
            <option value="out_of_stock">{t('outOfStock')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
        {isLoading ? (
          <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('productName')}</th>
                  <th>{t('sku')}</th>
                  <th>{t('category')}</th>
                  <th>{t('costPrice')}</th>
                  <th>{t('sellingPrice')}</th>
                  <th>{t('quantity')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data?.products?.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-dark-700 rounded-lg flex items-center justify-center">
                          {product.images?.[0] ? (
                            <img src={product.images[0].url} alt="" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{language === 'ar' ? product.nameAr || product.nameEn : product.nameEn}</p>
                          {product.barcode && <p className="text-xs text-gray-500 flex items-center gap-1"><QrCode className="w-3 h-3" />{product.barcode}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{product.sku}</td>
                    <td>{product.category || '-'}</td>
                    <td><Money value={product.costPrice} /></td>
                    <td className="font-semibold"><Money value={product.sellingPrice} /></td>
                    <td>
                      <span className={`font-semibold ${product.totalStock <= 10 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                        {product.totalStock}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${product.status === 'active' ? 'badge-success' : product.status === 'out_of_stock' ? 'badge-danger' : 'badge-neutral'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link to={`/products/${product._id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"><Eye className="w-4 h-4 text-gray-600" /></Link>
                        <Link to={`/products/${product._id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"><Edit className="w-4 h-4 text-gray-600" /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
