import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import api from '../../lib/api'
import { Plus, Search, Edit2, Trash2, Package, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'

export default function LaundryServices() {
  const { language } = useSelector(state => state.ui)
  const isRtl = language === 'ar'
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState(null)

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      nameEn: '',
      nameAr: '',
      category: 'wash_fold',
      billingType: 'per_piece',
      basePrice: 0,
      imageUrl: '',
      treatments: ''
    }
  })

  const useFormImageUrl = watch('imageUrl')

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['laundry-services'],
    queryFn: () => api.get('/laundry/services').then(res => res.data)
  })

  const seedMutation = useMutation({
    mutationFn: () => api.post('/laundry/services/seed'),
    onSuccess: () => {
      toast.success(isRtl ? 'تم إضافة الخدمات الافتراضية بنجاح' : 'Default services seeded successfully')
      queryClient.invalidateQueries(['laundry-services'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to seed services')
    }
  })

  const saveMutation = useMutation({
    mutationFn: (data) => {
      // Convert treatments string to array
      const payload = {
        ...data,
        treatments: data.treatments.split(',').map(t => t.trim()).filter(Boolean)
      }
      if (editingService) {
        return api.put(`/laundry/services/${editingService._id}`, payload)
      }
      return api.post('/laundry/services', payload)
    },
    onSuccess: () => {
      toast.success(isRtl ? 'تم حفظ الخدمة' : 'Service saved successfully')
      queryClient.invalidateQueries(['laundry-services'])
      closeModal()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error saving service')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/laundry/services/${id}`),
    onSuccess: () => {
      toast.success(isRtl ? 'تم الحذف' : 'Service deleted')
      queryClient.invalidateQueries(['laundry-services'])
    }
  })

  const openModal = (service = null) => {
    if (service) {
      setEditingService(service)
      setValue('nameEn', service.nameEn)
      setValue('nameAr', service.nameAr)
      setValue('category', service.category)
      setValue('billingType', service.billingType)
      setValue('basePrice', service.basePrice)
      setValue('imageUrl', service.imageUrl || '')
      setValue('treatments', (service.treatments || []).join(', '))
    } else {
      setEditingService(null)
      reset()
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingService(null)
    reset()
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type?.startsWith('image/')) {
      toast.error(isRtl ? 'الملف يجب أن يكون صورة' : 'File must be an image')
      return
    }

    if (file.size > 1024 * 1024 * 2) { // 2MB limit
      toast.error(isRtl ? 'حجم الصورة كبير جداً (الحد 2MB)' : 'Image is too large (max 2MB)')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setValue('imageUrl', reader.result, { shouldDirty: true, shouldValidate: true })
    }
    reader.readAsDataURL(file)
  }

  const filteredServices = services.filter(s => 
    s.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.nameAr.includes(searchTerm)
  )

  const CATEGORIES = {
    wash_fold: isRtl ? 'غسيل وطي' : 'Wash & Fold',
    dry_clean: isRtl ? 'غسيل جاف' : 'Dry Clean',
    ironing: isRtl ? 'كوي' : 'Ironing',
    premium_care: isRtl ? 'عناية فائقة' : 'Premium Care'
  }

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRtl ? 'خدمات المغسلة' : 'Laundry Services'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRtl ? 'إدارة خدمات الغسيل والأسعار والصور' : 'Manage your laundry services, pricing, and images'}
          </p>
        </div>
        <div className="flex gap-2">
          {services.length === 0 && (
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isRtl ? 'إضافة الخدمات الافتراضية' : 'Seed Default Services'}
            </button>
          )}
          <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {isRtl ? 'إضافة خدمة' : 'Add Service'}
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
        <input
          type="text"
          placeholder={isRtl ? 'بحث في الخدمات...' : 'Search services...'}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={`input w-full md:w-96 ${isRtl ? 'pr-10' : 'pl-10'}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredServices.map(service => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={service._id}
            className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden hover:shadow-lg transition-shadow group"
          >
            <div className="h-48 bg-gray-100 dark:bg-dark-700 relative overflow-hidden">
              {service.imageUrl ? (
                <img src={service.imageUrl} alt={service.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <Package className="w-12 h-12 mb-2 opacity-50" />
                  <span>No Image</span>
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(service)} className="p-2 bg-white/90 rounded-lg shadow hover:bg-white text-blue-600 backdrop-blur-sm">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteMutation.mutate(service._id)} className="p-2 bg-white/90 rounded-lg shadow hover:bg-white text-red-600 backdrop-blur-sm">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-xs font-medium">
                {CATEGORIES[service.category]}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
                {isRtl ? service.nameAr : service.nameEn}
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                {service.treatments?.join(' • ') || 'No treatments'}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-bold text-primary-600 text-lg">
                  SAR {service.basePrice.toFixed(2)}
                </span>
                <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-dark-700 rounded-lg text-gray-600 dark:text-gray-300">
                  {service.billingType === 'per_piece' ? (isRtl ? 'للقطعة' : 'Per Piece') : (isRtl ? 'للكيلو' : 'Per KG')}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-dark-700 flex justify-between items-center sticky top-0 bg-white dark:bg-dark-800 z-10">
              <h2 className="text-xl font-bold">
                {editingService ? (isRtl ? 'تعديل الخدمة' : 'Edit Service') : (isRtl ? 'إضافة خدمة' : 'Add Service')}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit(saveMutation.mutate)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">{isRtl ? 'الاسم (إنجليزي)' : 'Name (English)'}</label>
                  <input {...register('nameEn')} className="input" required />
                </div>
                <div>
                  <label className="label">{isRtl ? 'الاسم (عربي)' : 'Name (Arabic)'}</label>
                  <input {...register('nameAr')} className="input" required dir="rtl" />
                </div>
                <div>
                  <label className="label">{isRtl ? 'الفئة' : 'Category'}</label>
                  <select {...register('category')} className="input">
                    <option value="wash_fold">Wash & Fold / غسيل وطي</option>
                    <option value="dry_clean">Dry Clean / غسيل جاف</option>
                    <option value="ironing">Ironing / كوي</option>
                    <option value="premium_care">Premium Care / عناية فائقة</option>
                  </select>
                </div>
                <div>
                  <label className="label">{isRtl ? 'نوع التسعير' : 'Billing Type'}</label>
                  <select {...register('billingType')} className="input">
                    <option value="per_piece">Per Piece / للقطعة</option>
                    <option value="per_kg">Per KG / للكيلو</option>
                  </select>
                </div>
                <div>
                  <label className="label">{isRtl ? 'السعر الأساسي' : 'Base Price (SAR)'}</label>
                  <input type="number" step="0.01" {...register('basePrice')} className="input" required />
                </div>
                <div className="md:col-span-2">
                  <label className="label">{isRtl ? 'صورة الخدمة' : 'Service Image'}</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-dark-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-dark-800">
                      {useFormImageUrl ? (
                        <img src={useFormImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 dark:file:bg-teal-500/10 dark:file:text-teal-400"
                      />
                      <input type="hidden" {...register('imageUrl')} />
                      <p className="text-xs text-gray-500">
                        {isRtl ? 'الحد الأقصى للحجم 2 ميجابايت' : 'Maximum size 2MB'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="label">{isRtl ? 'أنواع المعالجة (مفصولة بفاصلة)' : 'Treatments (comma separated)'}</label>
                  <input {...register('treatments')} className="input" placeholder="Wash & Fold, Dry Clean, Iron Only" />
                  <p className="text-xs text-gray-500 mt-1">e.g., Wash & Fold, Dry Clean, Iron Only</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-dark-700">
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={saveMutation.isPending} className="btn btn-primary">
                  {saveMutation.isPending ? 'Saving...' : (isRtl ? 'حفظ' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
