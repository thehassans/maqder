import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Package, DollarSign, Warehouse } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import SarIcon from '../../components/ui/SarIcon'
import { useLiveTranslation } from '../../lib/liveTranslation'

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const isEdit = Boolean(id)

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      stocks: [{ warehouseId: '', quantity: 0, reorderPoint: 10 }]
    }
  })

  useLiveTranslation({
    watch,
    setValue,
    sourceField: 'nameEn',
    targetField: 'nameAr',
    sourceLang: 'en',
    targetLang: 'ar'
  })

  useLiveTranslation({
    watch,
    setValue,
    sourceField: 'nameAr',
    targetField: 'nameEn',
    sourceLang: 'ar',
    targetLang: 'en'
  })

  const { isLoading, data: productData } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then(res => res.data),
    enabled: isEdit,
    onSuccess: (data) => {
      // Ensure stocks array has at least one entry for the form
      const formData = { ...data }
      if (!formData.stocks || formData.stocks.length === 0) {
        formData.stocks = [{ warehouseId: '', quantity: 0, reorderPoint: 10 }]
      } else {
        // Normalize warehouseId - it might be populated object or string
        formData.stocks = formData.stocks.map(s => ({
          ...s,
          warehouseId: typeof s.warehouseId === 'object' ? s.warehouseId?._id : s.warehouseId,
          quantity: s.quantity || 0,
          reorderPoint: s.reorderPoint || 10
        }))
      }
      reset(formData)
    }
  })

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/warehouses').then(res => res.data)
  })

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/products/${id}`, data) : api.post('/products', data),
    onSuccess: () => {
      toast.success(isEdit ? (language === 'ar' ? 'تم تحديث المنتج' : 'Product updated') : (language === 'ar' ? 'تم إضافة المنتج' : 'Product added'))
      queryClient.invalidateQueries(['products'])
      navigate('/products')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error saving product')
  })

  if (isEdit && isLoading) {
    return <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? (language === 'ar' ? 'تعديل منتج' : 'Edit Product') : (language === 'ar' ? 'إضافة منتج' : 'Add Product')}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        {/* Basic Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg"><Package className="w-5 h-5 text-primary-600" /></div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'معلومات المنتج' : 'Product Information'}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">{t('sku')} *</label>
              <input {...register('sku', { required: true })} className="input" placeholder="SKU-001" />
            </div>
            <div>
              <label className="label">{t('barcode')}</label>
              <input {...register('barcode')} className="input" placeholder="1234567890123" />
            </div>
            <div>
              <label className="label">{t('category')}</label>
              <input {...register('category')} className="input" />
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <label className="label">{t('productName')} (EN) *</label>
              <input {...register('nameEn', { required: true })} className="input" />
            </div>
            <div className="md:col-span-2 lg:col-span-2">
              <label className="label">{t('productName')} (AR)</label>
              <input {...register('nameAr')} className="input" dir="rtl" />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="label">{language === 'ar' ? 'الوصف' : 'Description'}</label>
              <textarea {...register('descriptionEn')} className="input" rows={2} />
            </div>
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'التسعير' : 'Pricing'}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">
                <span className="inline-flex items-center gap-1">
                  {t('costPrice')}
                  <SarIcon className="w-[1em] h-[1em]" />
                </span>
              </label>
              <input type="number" step="0.01" {...register('costPrice', { valueAsNumber: true })} className="input" />
            </div>
            <div>
              <label className="label">
                <span className="inline-flex items-center gap-1">
                  {t('sellingPrice')} *
                  <SarIcon className="w-[1em] h-[1em]" />
                </span>
              </label>
              <input type="number" step="0.01" {...register('sellingPrice', { valueAsNumber: true, required: true })} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'نسبة الضريبة' : 'Tax Rate'} %</label>
              <select {...register('taxRate', { valueAsNumber: true })} className="select">
                <option value={15}>15% (Standard)</option>
                <option value={0}>0% (Exempt)</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Stock */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><Warehouse className="w-5 h-5 text-blue-600" /></div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'المخزون' : 'Stock'}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'وحدة القياس' : 'Unit of Measure'}</label>
              <select {...register('unitOfMeasure')} className="select">
                <option value="PCE">{language === 'ar' ? 'قطعة' : 'Piece'}</option>
                <option value="KG">{language === 'ar' ? 'كيلوغرام' : 'Kilogram'}</option>
                <option value="LTR">{language === 'ar' ? 'لتر' : 'Liter'}</option>
                <option value="MTR">{language === 'ar' ? 'متر' : 'Meter'}</option>
                <option value="BOX">{language === 'ar' ? 'صندوق' : 'Box'}</option>
              </select>
            </div>
            {warehouses?.length > 0 && (
              <>
                <div>
                  <label className="label">{language === 'ar' ? 'المستودع' : 'Warehouse'}</label>
                  <select {...register('stocks.0.warehouseId')} className="select">
                    {warehouses.map(w => <option key={w._id} value={w._id}>{language === 'ar' ? w.nameAr || w.nameEn : w.nameEn}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'الكمية' : 'Quantity'}</label>
                  <input type="number" {...register('stocks.0.quantity', { valueAsNumber: true })} className="input" />
                </div>
                <div>
                  <label className="label">{t('reorderPoint')}</label>
                  <input type="number" {...register('stocks.0.reorderPoint', { valueAsNumber: true })} className="input" />
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">{t('cancel')}</button>
          <button type="submit" disabled={mutation.isPending} className="btn btn-primary">
            {mutation.isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />{t('save')}</>}
          </button>
        </div>
      </form>
    </div>
  )
}
