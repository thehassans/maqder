import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, UtensilsCrossed } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import SarIcon from '../../components/ui/SarIcon'
import { useLiveTranslation } from '../../lib/liveTranslation'

export default function RestaurantMenuItemForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      sellingPrice: 0,
      taxRate: 15,
      isActive: true,
    },
  })

  useLiveTranslation({
    watch,
    setValue,
    sourceField: 'nameEn',
    targetField: 'nameAr',
    sourceLang: 'en',
    targetLang: 'ar',
  })

  useLiveTranslation({
    watch,
    setValue,
    sourceField: 'nameAr',
    targetField: 'nameEn',
    sourceLang: 'ar',
    targetLang: 'en',
  })

  const { isLoading } = useQuery({
    queryKey: ['restaurant-menu-item', id],
    queryFn: () => api.get(`/restaurant/menu-items/${id}`).then((res) => res.data),
    enabled: isEdit,
    onSuccess: (data) => reset(data),
  })

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data }
      payload.sellingPrice = Number(payload.sellingPrice) || 0
      payload.taxRate = Number(payload.taxRate) || 0
      payload.isActive = payload.isActive !== false
      return isEdit ? api.put(`/restaurant/menu-items/${id}`, payload) : api.post('/restaurant/menu-items', payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? (language === 'ar' ? 'تم تحديث الصنف' : 'Item updated') : language === 'ar' ? 'تم إضافة الصنف' : 'Item added')
      queryClient.invalidateQueries(['restaurant-menu-items'])
      navigate('/app/dashboard/restaurant/menu-items')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? (language === 'ar' ? 'تعديل صنف' : 'Edit Item') : language === 'ar' ? 'إضافة صنف' : 'Add Item'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <UtensilsCrossed className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'معلومات الصنف' : 'Item Info'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'SKU' : 'SKU'}</label>
              <input {...register('sku')} className="input" placeholder="ITEM-001" />
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'التصنيف' : 'Category'}</label>
              <input {...register('category')} className="input" />
            </div>

            <div>
              <label className="label">
                <span className="inline-flex items-center gap-1">
                  {language === 'ar' ? 'السعر' : 'Price'} *
                  <SarIcon className="w-[1em] h-[1em]" />
                </span>
              </label>
              <input type="number" step="0.01" {...register('sellingPrice', { valueAsNumber: true, required: true })} className="input" />
            </div>

            <div className="md:col-span-2">
              <label className="label">{language === 'ar' ? 'الاسم (EN)' : 'Name (EN)'} *</label>
              <input {...register('nameEn', { required: true })} className="input" />
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'الاسم (AR)' : 'Name (AR)'}</label>
              <input {...register('nameAr')} className="input" dir="rtl" />
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'الضريبة %' : 'Tax %'}</label>
              <select {...register('taxRate', { valueAsNumber: true })} className="select">
                <option value={15}>15%</option>
                <option value={0}>0%</option>
              </select>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" {...register('isActive')} defaultChecked />
              <span className="text-sm text-gray-700 dark:text-gray-300">{language === 'ar' ? 'نشط' : 'Active'}</span>
            </div>
          </div>
        </motion.div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            {t('cancel')}
          </button>
          <button type="submit" disabled={mutation.isPending} className="btn btn-primary">
            {mutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('save')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
