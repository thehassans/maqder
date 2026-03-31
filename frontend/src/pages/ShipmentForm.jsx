import { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm, useFieldArray } from 'react-hook-form'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Save,
  Truck,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Building,
  Warehouse as WarehouseIcon,
  Package,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'

export default function ShipmentForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const formatDateForInput = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 10)
  }

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      shipmentNumber: '',
      type: 'inbound',
      status: 'draft',
      supplierId: '',
      purchaseOrderId: '',
      warehouseId: '',
      carrier: '',
      trackingNumber: '',
      shippedAt: '',
      expectedDelivery: '',
      notes: '',
      lineItems: [{ productId: '', description: '', quantity: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' })

  const shipmentType = watch('type')
  const shipmentStatus = watch('status')
  const warehouseId = watch('warehouseId')

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-lookup'],
    queryFn: () => api.get('/suppliers', { params: { limit: 200 } }).then((res) => res.data.suppliers),
  })

  const { data: purchaseOrders } = useQuery({
    queryKey: ['purchase-orders-lookup'],
    queryFn: () => api.get('/purchase-orders', { params: { page: 1, limit: 200 } }).then((res) => res.data.purchaseOrders),
  })

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/warehouses').then((res) => res.data),
  })

  const { data: products } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => api.get('/products', { params: { limit: 200 } }).then((res) => res.data.products),
  })

  const { data: shipment, isLoading } = useQuery({
    queryKey: ['shipment', id],
    queryFn: () => api.get(`/shipments/${id}`).then((res) => res.data),
    enabled: isEdit,
    onSuccess: (data) => {
      reset({
        shipmentNumber: data?.shipmentNumber || '',
        type: data?.type || 'inbound',
        status: data?.status || 'draft',
        supplierId: data?.supplierId?._id || data?.supplierId || '',
        purchaseOrderId: data?.purchaseOrderId?._id || data?.purchaseOrderId || '',
        warehouseId: data?.warehouseId?._id || data?.warehouseId || '',
        carrier: data?.carrier || '',
        trackingNumber: data?.trackingNumber || '',
        shippedAt: formatDateForInput(data?.shippedAt),
        expectedDelivery: formatDateForInput(data?.expectedDelivery),
        notes: data?.notes || '',
        lineItems: (data?.lineItems || []).map((li) => ({
          productId: li?.productId?._id || li?.productId || '',
          description: li?.description || '',
          quantity: li?.quantity ?? 0,
        })),
      })
    },
  })

  const isLocked = isEdit && ['delivered', 'cancelled'].includes(shipment?.status)

  const statusBadge = useMemo(() => {
    const status = shipment?.status || shipmentStatus
    if (status === 'delivered') return 'badge-success'
    if (status === 'in_transit') return 'badge-info'
    if (status === 'cancelled') return 'badge-danger'
    return 'badge-neutral'
  }, [shipment?.status, shipmentStatus])

  const statusLabel = (status) => {
    if (language === 'ar') {
      if (status === 'draft') return 'مسودة'
      if (status === 'in_transit') return 'بالطريق'
      if (status === 'delivered') return 'تم التسليم'
      if (status === 'cancelled') return 'ملغي'
      return status
    }
    return status
  }

  const saveMutation = useMutation({
    mutationFn: (data) => (isEdit ? api.put(`/shipments/${id}`, data) : api.post('/shipments', data)),
    onSuccess: (res) => {
      toast.success(
        isEdit
          ? language === 'ar'
            ? 'تم تحديث الشحنة'
            : 'Shipment updated'
          : language === 'ar'
            ? 'تم إنشاء الشحنة'
            : 'Shipment created'
      )
      queryClient.invalidateQueries(['shipments'])
      queryClient.invalidateQueries(['shipments-stats'])

      if (!isEdit) {
        navigate(`/shipments/${res.data?._id}`)
      } else {
        queryClient.invalidateQueries(['shipment', id])
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const inTransitMutation = useMutation({
    mutationFn: () => api.post(`/shipments/${id}/mark-in-transit`),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم تحديث الحالة إلى بالطريق' : 'Marked in transit')
      queryClient.invalidateQueries(['shipments'])
      queryClient.invalidateQueries(['shipments-stats'])
      queryClient.invalidateQueries(['shipment', id])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const deliveredMutation = useMutation({
    mutationFn: () => api.post(`/shipments/${id}/mark-delivered`),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم تحديث الحالة إلى تم التسليم' : 'Marked delivered')
      queryClient.invalidateQueries(['shipments'])
      queryClient.invalidateQueries(['shipments-stats'])
      queryClient.invalidateQueries(['shipment', id])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/shipments/${id}/cancel`),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم إلغاء الشحنة' : 'Shipment cancelled')
      queryClient.invalidateQueries(['shipments'])
      queryClient.invalidateQueries(['shipments-stats'])
      queryClient.invalidateQueries(['shipment', id])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  useEffect(() => {
    if (!warehouseId && Array.isArray(warehouses) && warehouses.length > 0) {
      const primary = warehouses.find((w) => w.isPrimary)
      setValue('warehouseId', primary?._id || warehouses[0]._id)
    }
  }, [warehouseId, warehouses, setValue])

  const onSubmit = (data) => {
    const payload = {
      shipmentNumber: data.shipmentNumber || undefined,
      type: data.type,
      status: data.status,
      supplierId: data.supplierId || undefined,
      purchaseOrderId: data.purchaseOrderId || undefined,
      warehouseId: data.warehouseId || undefined,
      carrier: data.carrier || undefined,
      trackingNumber: data.trackingNumber || undefined,
      shippedAt: data.shippedAt ? new Date(data.shippedAt) : undefined,
      expectedDelivery: data.expectedDelivery ? new Date(data.expectedDelivery) : undefined,
      notes: data.notes || undefined,
      lineItems: (data.lineItems || []).map((li) => ({
        productId: li.productId || undefined,
        description: li.description || undefined,
        quantity: Number(li.quantity || 0),
      })),
    }

    saveMutation.mutate(payload)
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? (language === 'ar' ? 'تعديل شحنة' : 'Edit Shipment') : language === 'ar' ? 'إضافة شحنة' : 'Add Shipment'}
            </h1>
            {isEdit && (
              <p className="text-sm text-gray-500 mt-1">
                {language === 'ar' ? 'الحالة:' : 'Status:'} <span className={`badge ${statusBadge}`}>{statusLabel(shipment?.status)}</span>
              </p>
            )}
          </div>
        </div>

        {isEdit && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inTransitMutation.mutate()}
              disabled={inTransitMutation.isPending || ['in_transit', 'delivered', 'cancelled'].includes(shipment?.status)}
              className="btn btn-secondary"
            >
              {inTransitMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  {language === 'ar' ? 'بالطريق' : 'In Transit'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => deliveredMutation.mutate()}
              disabled={deliveredMutation.isPending || ['delivered', 'cancelled'].includes(shipment?.status)}
              className="btn btn-secondary"
            >
              {deliveredMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {language === 'ar' ? 'تم التسليم' : 'Delivered'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending || ['delivered', 'cancelled'].includes(shipment?.status)}
              className="btn btn-danger"
            >
              {cancelMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Truck className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'معلومات الشحنة' : 'Shipment Information'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'رقم الشحنة' : 'Shipment #'}</label>
              <input
                {...register('shipmentNumber')}
                className="input"
                placeholder={language === 'ar' ? 'تلقائي إذا تركته فارغاً' : 'Auto if left empty'}
                disabled={isEdit}
              />
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'النوع' : 'Type'}</label>
              <select {...register('type')} className="select" disabled={isLocked}>
                <option value="inbound">{language === 'ar' ? 'وارد' : 'Inbound'}</option>
                <option value="outbound">{language === 'ar' ? 'صادر' : 'Outbound'}</option>
              </select>
            </div>

            <div>
              <label className="label">{t('status')}</label>
              <select {...register('status')} className="select" disabled>
                <option value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</option>
                <option value="in_transit">{language === 'ar' ? 'بالطريق' : 'In Transit'}</option>
                <option value="delivered">{language === 'ar' ? 'تم التسليم' : 'Delivered'}</option>
                <option value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</option>
              </select>
            </div>

            {shipmentType === 'inbound' && (
              <div>
                <label className="label">{language === 'ar' ? 'المورد' : 'Supplier'}</label>
                <select {...register('supplierId')} className="select" disabled={isLocked}>
                  <option value="">{language === 'ar' ? 'اختياري' : 'Optional'}</option>
                  {(suppliers || []).map((s) => (
                    <option key={s._id} value={s._id}>
                      {(language === 'ar' ? s.nameAr || s.nameEn : s.nameEn) || s.code}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {shipmentType === 'inbound' && (
              <div>
                <label className="label">{language === 'ar' ? 'طلب شراء' : 'Purchase Order'}</label>
                <select {...register('purchaseOrderId')} className="select" disabled={isLocked}>
                  <option value="">{language === 'ar' ? 'اختياري' : 'Optional'}</option>
                  {(purchaseOrders || []).map((po) => (
                    <option key={po._id} value={po._id}>
                      {po.poNumber}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">{language === 'ar' ? 'المستودع' : 'Warehouse'} *</label>
              <select {...register('warehouseId', { required: true })} className="select" disabled={isLocked}>
                <option value="">{language === 'ar' ? 'اختر مستودع' : 'Select warehouse'}</option>
                {(warehouses || []).map((w) => (
                  <option key={w._id} value={w._id}>
                    {language === 'ar' ? w.nameAr || w.nameEn : w.nameEn}
                  </option>
                ))}
              </select>
              {errors.warehouseId && <p className="text-xs text-red-600 mt-1">{language === 'ar' ? 'المستودع مطلوب' : 'Warehouse is required'}</p>}
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'شركة الشحن' : 'Carrier'}</label>
              <input {...register('carrier')} className="input" disabled={isLocked} />
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'رقم التتبع' : 'Tracking Number'}</label>
              <input {...register('trackingNumber')} className="input" disabled={isLocked} />
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'تاريخ الشحن' : 'Shipped At'}</label>
              <div className="relative">
                <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="date" {...register('shippedAt')} className="input ps-10" disabled={isLocked} />
              </div>
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'تاريخ متوقع' : 'Expected Delivery'}</label>
              <div className="relative">
                <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="date" {...register('expectedDelivery')} className="input ps-10" disabled={isLocked} />
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="label">{language === 'ar' ? 'ملاحظات' : 'Notes'}</label>
              <textarea {...register('notes')} className="input" rows={3} disabled={isLocked} />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">{language === 'ar' ? 'بنود الشحنة' : 'Shipment Items'}</h3>
            </div>

            {!isLocked && (
              <button type="button" onClick={() => append({ productId: '', description: '', quantity: 1 })} className="btn btn-secondary">
                <Plus className="w-4 h-4" />
                {language === 'ar' ? 'إضافة بند' : 'Add item'}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                  <div className="lg:col-span-5">
                    <label className="label">{language === 'ar' ? 'المنتج' : 'Product'}</label>
                    <select {...register(`lineItems.${index}.productId`)} className="select" disabled={isLocked}>
                      <option value="">{language === 'ar' ? 'اختياري' : 'Optional'}</option>
                      {(products || []).map((p) => (
                        <option key={p._id} value={p._id}>
                          {(language === 'ar' ? p.nameAr || p.nameEn : p.nameEn) || p.sku}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-3">
                    <label className="label">{t('quantity')} *</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      {...register(`lineItems.${index}.quantity`, { valueAsNumber: true, required: true, min: 0 })}
                      className="input"
                      disabled={isLocked}
                    />
                  </div>

                  <div className="lg:col-span-4 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="label">{language === 'ar' ? 'وصف' : 'Description'}</label>
                      <input {...register(`lineItems.${index}.description`)} className="input" disabled={isLocked} />
                    </div>

                    {!isLocked && fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            {t('cancel')}
          </button>
          <button type="submit" disabled={saveMutation.isPending || isLocked} className="btn btn-primary">
            {saveMutation.isPending ? (
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

      {isEdit && shipment && (
        <div className="card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">{language === 'ar' ? 'المورد:' : 'Supplier:'}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {shipment.supplierId ? (language === 'ar' ? shipment.supplierId.nameAr || shipment.supplierId.nameEn : shipment.supplierId.nameEn || shipment.supplierId.nameAr) : '-'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <WarehouseIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">{language === 'ar' ? 'المستودع:' : 'Warehouse:'}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {shipment.warehouseId ? (language === 'ar' ? shipment.warehouseId.nameAr || shipment.warehouseId.nameEn : shipment.warehouseId.nameEn) : '-'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">{language === 'ar' ? 'النوع:' : 'Type:'}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {language === 'ar' ? (shipment.type === 'inbound' ? 'وارد' : 'صادر') : shipment.type}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
