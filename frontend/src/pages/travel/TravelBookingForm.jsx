import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Plane, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import SarIcon from '../../components/ui/SarIcon'

export default function TravelBookingForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      status: 'confirmed',
      serviceType: 'flight',
      currency: 'SAR',
      subtotal: 0,
      totalTax: 0,
      grandTotal: 0,
    },
  })

  const createInvoiceMutation = useMutation({
    mutationFn: () => api.post(`/travel-bookings/${id}/create-invoice`).then((res) => res.data),
    onSuccess: (data) => {
      const invoiceId = data?.invoice?._id
      if (invoiceId) {
        toast.success(language === 'ar' ? 'تم إنشاء الفاتورة' : 'Invoice created')
        queryClient.invalidateQueries(['travel-booking', id])
        queryClient.invalidateQueries(['invoices'])
        navigate(`/app/dashboard/invoices/${invoiceId}`)
      } else {
        toast.error(language === 'ar' ? 'لم يتم إنشاء الفاتورة' : 'Invoice not created')
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const subtotal = watch('subtotal')
  const totalTax = watch('totalTax')

  useEffect(() => {
    const s = Number(subtotal) || 0
    const tx = Number(totalTax) || 0
    const gt = s + tx
    setValue('grandTotal', gt)
  }, [subtotal, totalTax, setValue])

  const { isLoading } = useQuery({
    queryKey: ['travel-booking', id],
    queryFn: () => api.get(`/travel-bookings/${id}`).then((res) => res.data),
    enabled: isEdit,
    onSuccess: (data) => {
      reset({
        ...data,
        departureDate: data?.departureDate ? String(data.departureDate).slice(0, 10) : '',
        returnDate: data?.returnDate ? String(data.returnDate).slice(0, 10) : '',
      })
    },
  })

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data }
      if (payload.departureDate) payload.departureDate = new Date(payload.departureDate)
      else delete payload.departureDate
      if (payload.returnDate) payload.returnDate = new Date(payload.returnDate)
      else delete payload.returnDate

      payload.subtotal = Number(payload.subtotal) || 0
      payload.totalTax = Number(payload.totalTax) || 0
      payload.grandTotal = Number(payload.grandTotal) || payload.subtotal + payload.totalTax

      return isEdit ? api.put(`/travel-bookings/${id}`, payload) : api.post('/travel-bookings', payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? (language === 'ar' ? 'تم تحديث الحجز' : 'Booking updated') : (language === 'ar' ? 'تم إنشاء الحجز' : 'Booking created'))
      queryClient.invalidateQueries(['travel-bookings'])
      queryClient.invalidateQueries(['dashboard-travel-stats'])
      navigate('/app/dashboard/travel-bookings')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const headerTitle = useMemo(() => {
    if (isEdit) return language === 'ar' ? 'تعديل حجز' : 'Edit Booking'
    return language === 'ar' ? 'حجز جديد' : 'New Booking'
  }, [isEdit, language])

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{headerTitle}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Plane className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'تفاصيل الحجز' : 'Booking Details'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'الحالة' : 'Status'}</label>
              <select {...register('status')} className="select">
                <option value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</option>
                <option value="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</option>
                <option value="ticketed">{language === 'ar' ? 'تم إصدار التذكرة' : 'Ticketed'}</option>
                <option value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
                <option value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</option>
              </select>
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'نوع الخدمة' : 'Service Type'}</label>
              <select {...register('serviceType')} className="select">
                <option value="flight">{language === 'ar' ? 'طيران' : 'Flight'}</option>
                <option value="hotel">{language === 'ar' ? 'فندق' : 'Hotel'}</option>
                <option value="package">{language === 'ar' ? 'باقة' : 'Package'}</option>
                <option value="visa">{language === 'ar' ? 'تأشيرة' : 'Visa'}</option>
                <option value="other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
              </select>
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'العملة' : 'Currency'}</label>
              <input {...register('currency')} className="input" defaultValue="SAR" />
            </div>

            <div className="md:col-span-2">
              <label className="label">{language === 'ar' ? 'اسم العميل' : 'Customer Name'} *</label>
              <input {...register('customerName', { required: true })} className="input" />
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'رقم الجوال' : 'Phone'}</label>
              <input {...register('customerPhone')} className="input" />
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
              <input type="email" {...register('customerEmail')} className="input" />
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'تاريخ المغادرة' : 'Departure Date'}</label>
              <input type="date" {...register('departureDate')} className="input" />
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'تاريخ العودة' : 'Return Date'}</label>
              <input type="date" {...register('returnDate')} className="input" />
            </div>

            <div>
              <label className="label">
                <span className="inline-flex items-center gap-1">
                  {language === 'ar' ? 'المجموع' : 'Subtotal'}
                  <SarIcon className="w-[1em] h-[1em]" />
                </span>
              </label>
              <input type="number" step="0.01" {...register('subtotal', { valueAsNumber: true })} className="input" />
            </div>

            <div>
              <label className="label">
                <span className="inline-flex items-center gap-1">
                  {language === 'ar' ? 'الضريبة' : 'Tax'}
                  <SarIcon className="w-[1em] h-[1em]" />
                </span>
              </label>
              <input type="number" step="0.01" {...register('totalTax', { valueAsNumber: true })} className="input" />
            </div>

            <div>
              <label className="label">
                <span className="inline-flex items-center gap-1">
                  {language === 'ar' ? 'الإجمالي' : 'Total'}
                  <SarIcon className="w-[1em] h-[1em]" />
                </span>
              </label>
              <input type="number" step="0.01" {...register('grandTotal', { valueAsNumber: true })} className="input" readOnly />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="label">{language === 'ar' ? 'ملاحظات' : 'Notes'}</label>
              <textarea {...register('notes')} className="input" rows={3} />
            </div>
          </div>
        </motion.div>

        <div className="flex justify-end gap-3">
          {isEdit && (
            <button
              type="button"
              onClick={() => createInvoiceMutation.mutate()}
              disabled={createInvoiceMutation.isPending}
              className="btn btn-secondary"
            >
              {createInvoiceMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {language === 'ar' ? 'إنشاء فاتورة' : 'Create Invoice'}
            </button>
          )}
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
