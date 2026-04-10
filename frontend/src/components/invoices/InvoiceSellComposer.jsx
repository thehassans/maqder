import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useFieldArray, useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import Money from '../ui/Money'
import { getPrimaryBusinessType, getTenantBusinessTypes } from '../../lib/businessTypes'
import { calculateInvoiceSummary, toNumber } from '../../lib/invoiceDocument'
import { getInvoiceTemplateId } from '../../lib/invoiceBranding'
import InvoiceLivePreview from './InvoiceLivePreview'
import InvoiceTemplateSelector from './InvoiceTemplateSelector'
import TravelInvoiceFields from './TravelInvoiceFields'

const emptyLine = { productId: '', productName: '', productNameAr: '', unitCode: 'PCE', quantity: 1, unitPrice: 0, taxRate: 15 }
const selectableContexts = ['trading', 'construction', 'travel_agency', 'restaurant']

const sanitizeTravelDetails = (travelDetails = {}) => ({
  passengerTitle: ['mr', 'mrs', 'ms'].includes(travelDetails?.passengerTitle) ? travelDetails.passengerTitle : 'mr',
  travelerName: String(travelDetails?.travelerName || '').trim(),
  passportNumber: String(travelDetails?.passportNumber || '').trim(),
  ticketNumber: String(travelDetails?.ticketNumber || '').trim(),
  pnr: String(travelDetails?.pnr || '').trim(),
  airlineName: String(travelDetails?.airlineName || '').trim(),
  routeFrom: String(travelDetails?.routeFrom || '').trim(),
  routeTo: String(travelDetails?.routeTo || '').trim(),
  segments: (Array.isArray(travelDetails?.segments) ? travelDetails.segments : [])
    .map((segment) => ({
      from: String(segment?.from || '').trim(),
      to: String(segment?.to || '').trim(),
    }))
    .filter((segment) => segment.from || segment.to),
  departureDate: travelDetails?.departureDate || '',
  hasReturnDate: Boolean(travelDetails?.hasReturnDate && travelDetails?.returnDate),
  returnDate: travelDetails?.hasReturnDate && travelDetails?.returnDate ? travelDetails.returnDate : '',
  layoverStay: String(travelDetails?.layoverStay || '').trim(),
  passengers: (Array.isArray(travelDetails?.passengers) ? travelDetails.passengers : [])
    .map((passenger) => ({
      title: ['mr', 'mrs', 'ms'].includes(passenger?.title) ? passenger.title : 'mr',
      name: String(passenger?.name || '').trim(),
      passportNumber: String(passenger?.passportNumber || '').trim(),
    }))
    .filter((passenger) => passenger.name || passenger.passportNumber),
})

export default function InvoiceSellComposer() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const { tenant } = useSelector((state) => state.auth)
  const { t } = useTranslation(language)
  const [invoiceType, setInvoiceType] = useState('B2C')
  const tenantBusinessTypes = getTenantBusinessTypes(tenant)
  const defaultBusinessContext = useMemo(() => {
    const primary = getPrimaryBusinessType(tenant)
    if (selectableContexts.includes(primary)) return primary
    return tenantBusinessTypes.find((type) => selectableContexts.includes(type)) || 'trading'
  }, [tenant, tenantBusinessTypes])

  const { register, control, handleSubmit, watch, setValue, getValues } = useForm({
    defaultValues: {
      businessContext: defaultBusinessContext,
      invoiceSubtype: tenantBusinessTypes.includes('travel_agency') ? 'travel_ticket' : 'standard',
      pdfTemplateId: getInvoiceTemplateId(tenant, defaultBusinessContext),
      transactionType: 'B2C',
      invoiceTypeCode: '0200000',
      paymentMethod: 'cash',
      customerId: '',
      warehouseId: '',
      restaurantOrderId: '',
      travelBookingId: '',
      contractNumber: '',
      notes: '',
      invoiceDiscount: 0,
      buyer: {},
      travelDetails: { passengerTitle: 'mr', layoverStay: '', hasReturnDate: false, segments: [{ from: '', to: '' }], passengers: [] },
      lineItems: [emptyLine],
    }
  })

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'lineItems' })
  const values = watch()
  const lineItems = Array.isArray(values.lineItems) ? values.lineItems : []
  const businessContext = values.businessContext || defaultBusinessContext
  const invoiceSubtype = values.invoiceSubtype || 'standard'
  const selectedTemplateId = Number(values.pdfTemplateId || getInvoiceTemplateId(tenant, businessContext))
  const selectedWarehouseId = values.warehouseId || ''
  const isTradingContext = businessContext === 'trading'
  const isTravelContext = businessContext === 'travel_agency'
  const isRestaurantContext = businessContext === 'restaurant'
  const [sourceId, setSourceId] = useState('')

  useEffect(() => {
    setValue('businessContext', defaultBusinessContext)
  }, [defaultBusinessContext, setValue])

  useEffect(() => {
    if (isTravelContext) {
      setInvoiceType('B2C')
      setValue('transactionType', 'B2C')
      setValue('invoiceTypeCode', '0200000')
      if (invoiceSubtype !== 'travel_ticket') {
        setValue('invoiceSubtype', 'travel_ticket')
      }
    } else if (invoiceSubtype === 'travel_ticket') {
      setValue('invoiceSubtype', 'standard')
    }
    if (isTravelContext && !invoiceSubtype) {
      setValue('invoiceSubtype', 'travel_ticket')
    }
  }, [invoiceSubtype, isTravelContext, setValue])

  useEffect(() => {
    setSourceId('')
    setValue('restaurantOrderId', '')
    setValue('travelBookingId', '')
    setValue('contractNumber', '')
    setValue('pdfTemplateId', getInvoiceTemplateId(tenant, businessContext))
  }, [businessContext, setValue])

  const { data: products } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => api.get('/products', { params: { limit: 200 } }).then((res) => res.data.products),
    enabled: isTradingContext,
  })

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/warehouses').then((res) => res.data),
    enabled: isTradingContext,
  })

  const { data: customers } = useQuery({
    queryKey: ['customers-lookup'],
    queryFn: () => api.get('/customers', { params: { limit: 200 } }).then((res) => res.data.customers),
  })

  const { data: restaurantOrders } = useQuery({
    queryKey: ['restaurant-orders-lookup'],
    queryFn: () => api.get('/restaurant/orders', { params: { page: 1, limit: 200 } }).then((res) => res.data.orders || []),
    enabled: tenantBusinessTypes.includes('restaurant') && isRestaurantContext,
  })

  const { data: travelBookings } = useQuery({
    queryKey: ['travel-bookings-lookup'],
    queryFn: () => api.get('/travel-bookings', { params: { page: 1, limit: 200 } }).then((res) => res.data.bookings || []),
    enabled: tenantBusinessTypes.includes('travel_agency') && isTravelContext,
  })

  const importSourceMutation = useMutation({
    mutationFn: async () => {
      if (!sourceId) throw new Error('Missing sourceId')
      if (isRestaurantContext) {
        return api.get(`/restaurant/orders/${sourceId}`).then((res) => ({ type: 'restaurant', data: res.data }))
      }
      if (isTravelContext) {
        return api.get(`/travel-bookings/${sourceId}`).then((res) => ({ type: 'travel', data: res.data }))
      }
      throw new Error('Unsupported business context')
    },
    onSuccess: ({ type, data }) => {
      setInvoiceType('B2C')
      setValue('transactionType', 'B2C')
      setValue('invoiceTypeCode', '0200000')

      if (type === 'restaurant') {
        const items = (Array.isArray(data?.lineItems) ? data.lineItems : []).map((li) => ({
          ...emptyLine,
          productName: li?.name || '',
          productNameAr: li?.nameAr || '',
          quantity: li?.quantity ?? 1,
          unitPrice: li?.unitPrice ?? 0,
          taxRate: li?.taxRate ?? 15,
        }))
        replace(items.length ? items : [emptyLine])
        setValue('buyer.name', data?.customerName || 'Cash Customer')
        setValue('buyer.contactPhone', data?.customerPhone || '')
        setValue('restaurantOrderId', data?._id || '')
        setValue('travelBookingId', '')
        setValue('contractNumber', data?.orderNumber || '')
        setValue('paymentMethod', data?.paymentMethod === 'transfer' ? 'bank_transfer' : data?.paymentMethod === 'card' ? 'card' : 'cash')
        toast.success(language === 'ar' ? 'تم استيراد الطلب' : 'Order imported')
        return
      }

      const subtotal = Number(data?.subtotal) || 0
      const totalTax = Number(data?.totalTax) || 0
      const grandTotal = Number(data?.grandTotal) || subtotal + totalTax
      const taxableAmount = subtotal > 0 ? subtotal : Math.max(0, grandTotal - totalTax)
      const taxRate = taxableAmount > 0 ? Math.round((totalTax / taxableAmount) * 10000) / 100 : 0
      replace([{ ...emptyLine, productName: `Travel Booking ${data?.bookingNumber || ''}`.trim(), quantity: 1, unitPrice: taxableAmount, taxRate }])
      setValue('invoiceSubtype', 'travel_ticket')
      setValue('buyer.name', data?.customerName || 'Cash Customer')
      setValue('buyer.contactEmail', data?.customerEmail || '')
      setValue('buyer.contactPhone', data?.customerPhone || '')
      setValue('travelBookingId', data?._id || '')
      setValue('restaurantOrderId', '')
      setValue('contractNumber', data?.bookingNumber || '')
      setValue('travelDetails.travelerName', data?.travelerName || data?.customerName || '')
      setValue('travelDetails.passportNumber', data?.passportNumber || '')
      setValue('travelDetails.ticketNumber', data?.ticketNumber || '')
      setValue('travelDetails.pnr', data?.pnr || '')
      setValue('travelDetails.airlineName', data?.airlineName || '')
      setValue('travelDetails.routeFrom', data?.routeFrom || '')
      setValue('travelDetails.routeTo', data?.routeTo || '')
      setValue('travelDetails.segments', Array.isArray(data?.segments) && data.segments.length > 0 ? data.segments : [{ from: data?.routeFrom || '', to: data?.routeTo || '' }])
      setValue('travelDetails.departureDate', data?.departureDate ? String(data.departureDate).slice(0, 10) : '')
      setValue('travelDetails.hasReturnDate', Boolean(data?.hasReturnDate && data?.returnDate))
      setValue('travelDetails.returnDate', data?.hasReturnDate && data?.returnDate ? String(data.returnDate).slice(0, 10) : '')
      setValue('travelDetails.layoverStay', data?.layoverStay || '')
      setValue('travelDetails.passengerTitle', 'mr')
      setValue('travelDetails.passengers', Array.isArray(data?.passengers) ? data.passengers : [])
      toast.success(language === 'ar' ? 'تم استيراد الحجز' : 'Booking imported')
    },
    onError: (error) => toast.error(error?.response?.data?.error || error.message || 'Failed'),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/invoices/sell', data),
    onSuccess: (res) => {
      toast.success(language === 'ar' ? 'تم إنشاء فاتورة البيع بنجاح' : 'Sell invoice created successfully')
      queryClient.invalidateQueries(['invoices'])
      queryClient.invalidateQueries(['dashboard'])
      queryClient.invalidateQueries(['dashboard-revenue'])
      queryClient.invalidateQueries(['travel-bookings'])
      queryClient.invalidateQueries(['travel-bookings-lookup'])
      queryClient.invalidateQueries(['customers'])
      queryClient.invalidateQueries(['customers-lookup'])
      navigate(`/app/dashboard/invoices/${res.data._id}`)
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to create invoice'),
  })

  const onSelectProduct = (index, productId) => {
    const product = (products || []).find((item) => item._id === productId)
    if (!product) return
    setValue(`lineItems.${index}.productId`, product._id)
    setValue(`lineItems.${index}.productName`, product.nameEn)
    setValue(`lineItems.${index}.productNameAr`, product.nameAr || product.nameEn)
    setValue(`lineItems.${index}.unitCode`, product.unitOfMeasure || 'PCE')
    setValue(`lineItems.${index}.taxRate`, typeof product.taxRate === 'number' ? product.taxRate : 15)
    if (typeof product.sellingPrice === 'number') {
      setValue(`lineItems.${index}.unitPrice`, product.sellingPrice)
    }
  }

  const onSelectCustomer = (customerId) => {
    const customer = (customers || []).find((item) => item._id === customerId)
    if (!customer) return
    setValue('customerId', customer._id)
    setValue('buyer.name', customer.name)
    setValue('buyer.nameAr', customer.nameAr || customer.name)
    setValue('buyer.vatNumber', customer.vatNumber || '')
    setValue('buyer.crNumber', customer.crNumber || '')
    setValue('buyer.address.city', customer.address?.city || '')
    setValue('buyer.address.district', customer.address?.district || '')
    setValue('buyer.address.street', customer.address?.street || '')
    setValue('buyer.address.postalCode', customer.address?.postalCode || '')
    setValue('buyer.address.country', customer.address?.country || 'SA')
    setValue('buyer.address.buildingNumber', customer.address?.buildingNumber || '')
    setValue('buyer.address.additionalNumber', customer.address?.additionalNumber || '')
    setValue('buyer.contactPhone', customer.phone || getValues('buyer.contactPhone') || '')
    setValue('buyer.contactEmail', customer.email || getValues('buyer.contactEmail') || '')
  }

  const calculateLineTotal = (index) => {
    const summary = calculateInvoiceSummary({ lineItems, invoiceDiscount: values?.invoiceDiscount })
    const line = summary.lines[index]
    if (!line) return { subtotal: 0, tax: 0, total: 0 }
    return { subtotal: line.lineTotal, tax: line.taxAmount, total: line.lineTotalWithTax }
  }

  const totals = calculateInvoiceSummary({ lineItems, invoiceDiscount: values?.invoiceDiscount })

  const onSubmit = (data) => {
    const transactionType = isTravelContext ? 'B2C' : invoiceType
    const invoiceTypeCode = transactionType === 'B2C' ? '0200000' : '0100000'
    const payload = {
      ...data,
      flow: 'sell',
      businessContext,
      invoiceSubtype: isTravelContext ? 'travel_ticket' : invoiceSubtype,
      pdfTemplateId: selectedTemplateId,
      transactionType,
      invoiceTypeCode,
      invoiceDiscount: Math.max(0, toNumber(data?.invoiceDiscount, 0)),
      issueDate: new Date(),
      lineItems: (data.lineItems || []).map((line, index) => ({
        ...line,
        lineNumber: index + 1,
        taxCategory: 'S',
        productId: isTradingContext ? line.productId || undefined : undefined,
      })),
    }

    if (!payload.restaurantOrderId) delete payload.restaurantOrderId
    if (!payload.travelBookingId) delete payload.travelBookingId
    if (!payload.contractNumber) delete payload.contractNumber
    if (!isTradingContext) delete payload.warehouseId
    if (isTravelContext || invoiceSubtype === 'travel_ticket') {
      payload.travelDetails = sanitizeTravelDetails({
        ...data.travelDetails,
        travelerName: data?.buyer?.name || data?.travelDetails?.travelerName || '',
      })
    } else {
      delete payload.travelDetails
    }
    createMutation.mutate(payload)
  }

  const previewInvoice = {
    ...values,
    invoiceNumber: 'DRAFT-PREVIEW',
    issueDate: new Date(),
    flow: 'sell',
    transactionType: isTravelContext ? 'B2C' : invoiceType,
    invoiceSubtype: isTravelContext ? 'travel_ticket' : invoiceSubtype,
    pdfTemplateId: selectedTemplateId,
    invoiceDiscount: Math.max(0, toNumber(values?.invoiceDiscount, 0)),
    subtotal: totals.subtotal,
    totalDiscount: totals.totalDiscount,
    taxableAmount: totals.taxableAmount,
    totalTax: totals.totalTax,
    grandTotal: totals.grandTotal,
    lineItems: totals.lines.map((line, index) => ({
      ...line.raw,
      lineNumber: index + 1,
      lineTotal: line.lineTotal,
      taxAmount: line.taxAmount,
      lineTotalWithTax: line.lineTotalWithTax,
    })),
    seller: {
      name: tenant?.business?.legalNameEn,
      nameAr: tenant?.business?.legalNameAr,
      vatNumber: tenant?.business?.vatNumber,
      address: tenant?.business?.address,
      contactPhone: tenant?.business?.contactPhone,
      contactEmail: tenant?.business?.contactEmail,
    },
    travelDetails: sanitizeTravelDetails({
      ...values.travelDetails,
      travelerName: values?.buyer?.name || values?.travelDetails?.travelerName || '',
    }),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/app/dashboard/invoices/new')} className="btn btn-ghost btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'فاتورة بيع جديدة' : 'New Sell Invoice'}</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">{language === 'ar' ? 'اختر النشاط، القالب، وشاهد المعاينة المباشرة قبل الحفظ' : 'Choose the business flow, template, and see a live preview before saving'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="card p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'سياق الفاتورة' : 'Invoice Context'}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {tenantBusinessTypes.filter((type) => selectableContexts.includes(type)).map((type) => {
                const active = businessContext === type
                const labels = {
                  trading: language === 'ar' ? 'تجارة' : 'Trading',
                  construction: language === 'ar' ? 'مقاولات' : 'Construction',
                  travel_agency: language === 'ar' ? 'سفر' : 'Travel Agency',
                  restaurant: language === 'ar' ? 'مطعم' : 'Restaurant',
                }
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue('businessContext', type)}
                    className={`rounded-2xl border p-4 text-start ${active ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}
                  >
                    <p className="font-semibold text-gray-900 dark:text-white">{labels[type]}</p>
                  </button>
                )
              })}
            </div>
            <input type="hidden" {...register('businessContext')} />
          </div>

          {(isRestaurantContext || isTravelContext) && (
            <div className="card p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'مصدر الفاتورة' : 'Invoice Source'}</h3>
              {isRestaurantContext && (
                <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
                  <div className="md:col-span-9">
                    <label className="label">{language === 'ar' ? 'طلب مطعم' : 'Restaurant Order'}</label>
                    <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="select">
                      <option value="">{language === 'ar' ? 'اختر طلب' : 'Select order'}</option>
                      {(restaurantOrders || []).map((item) => <option key={item._id} value={item._id}>{item.orderNumber} - {Number(item.grandTotal || 0).toFixed(2)}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <button type="button" className="btn btn-secondary w-full" disabled={!sourceId || importSourceMutation.isPending} onClick={() => importSourceMutation.mutate()}>
                      {importSourceMutation.isPending ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" /> : (language === 'ar' ? 'استيراد' : 'Import')}
                    </button>
                  </div>
                </div>
              )}
              {isTravelContext && (
                <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
                  <div className="md:col-span-9">
                    <label className="label">{language === 'ar' ? 'حجز سفر' : 'Travel Booking'}</label>
                    <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="select">
                      <option value="">{language === 'ar' ? 'اختر حجز' : 'Select booking'}</option>
                      {(travelBookings || []).map((item) => <option key={item._id} value={item._id}>{item.bookingNumber} - {Number(item.grandTotal || 0).toFixed(2)}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <button type="button" className="btn btn-secondary w-full" disabled={!sourceId || importSourceMutation.isPending} onClick={() => importSourceMutation.mutate()}>
                      {importSourceMutation.isPending ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" /> : (language === 'ar' ? 'استيراد' : 'Import')}
                    </button>
                  </div>
                </div>
              )}
              <input type="hidden" {...register('restaurantOrderId')} />
              <input type="hidden" {...register('travelBookingId')} />
              <input type="hidden" {...register('contractNumber')} />
            </div>
          )}

          <div className="card p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'نوع الفاتورة' : 'Invoice Type'}</h3>
            {isTravelContext ? (
              <div className="rounded-2xl border-2 border-primary-500 bg-primary-50 p-4 text-start dark:bg-primary-900/20">
                <p className="font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'فاتورة سفر / تذاكر' : 'Travel / Ticket Invoice'}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'لفواتير السفر يتم استخدام صيغة B2C فقط' : 'Travel invoices use the B2C ticket-invoice format only'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <button type="button" onClick={() => setInvoiceType('B2C')} className={`rounded-2xl border-2 p-4 text-start ${invoiceType === 'B2C' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}>
                  <p className="font-semibold text-gray-900 dark:text-white">{t('b2cInvoice')}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'مبيعات نقدية أو مباشرة' : 'Cash or direct sale invoices'}</p>
                </button>
                <button type="button" onClick={() => setInvoiceType('B2B')} className={`rounded-2xl border-2 p-4 text-start ${invoiceType === 'B2B' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}>
                  <p className="font-semibold text-gray-900 dark:text-white">{t('b2bInvoice')}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'فواتير الشركات والجهات' : 'Invoices for business customers'}</p>
                </button>
              </div>
            )}
            <input type="hidden" {...register('invoiceSubtype')} />
          </div>

          <div className="card p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'قالب ومعاينة' : 'Template & Preview'}</h3>
            <InvoiceTemplateSelector language={language} value={selectedTemplateId} onChange={(id) => setValue('pdfTemplateId', id)} />
            <input type="hidden" {...register('pdfTemplateId')} />
          </div>

          {isTradingContext && (
            <div className="card p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="flex-1">
                  <label className="label">{language === 'ar' ? 'المستودع' : 'Warehouse'} *</label>
                  <select {...register('warehouseId', { required: isTradingContext })} className="select">
                    <option value="">{language === 'ar' ? 'بدون تحديد حالياً' : 'No warehouse selected yet'}</option>
                    {(warehouses || []).map((item) => <option key={item._id} value={item._id}>{language === 'ar' ? (item.nameAr || item.nameEn) : item.nameEn}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setValue('warehouseId', '')} disabled={!selectedWarehouseId}>
                    {language === 'ar' ? 'إلغاء التحديد' : 'Clear'}
                  </button>
                  <button type="button" className="btn btn-action-dark" onClick={() => navigate(`/app/dashboard/warehouses/new?returnTo=${encodeURIComponent('/app/dashboard/invoices/new/sell')}`)}>
                    {language === 'ar' ? 'إضافة مستودع' : 'Add Warehouse'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'بيانات العميل' : 'Customer Details'}</h3>
            </div>
            <div className="mb-4">
              <label className="label">{language === 'ar' ? 'اختر عميل موجود' : 'Select Existing Customer'}</label>
              <select onChange={(e) => onSelectCustomer(e.target.value)} className="select">
                <option value="">{language === 'ar' ? 'اختياري: اختر عميل' : 'Optional: Select customer'}</option>
                {(customers || []).map((item) => <option key={item._id} value={item._id}>{language === 'ar' ? (item.nameAr || item.name) : item.name}</option>)}
              </select>
            </div>
            <input type="hidden" {...register('customerId')} />
            {invoiceSubtype === 'travel_ticket' ? (
              <TravelInvoiceFields language={language} register={register} control={control} watch={watch} setValue={setValue} />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="label">{language === 'ar' ? 'الاسم / الشركة' : 'Name / Company'}</label>
                  <input {...register('buyer.name', { required: invoiceType === 'B2B' })} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'الرقم الضريبي' : 'VAT Number'}</label>
                  <input {...register('buyer.vatNumber', { required: invoiceType === 'B2B' })} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                  <input {...register('buyer.contactPhone')} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input type="email" {...register('buyer.contactEmail')} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'المدينة' : 'City'}</label>
                  <input {...register('buyer.address.city')} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'الحي' : 'District'}</label>
                  <input {...register('buyer.address.district')} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'الشارع' : 'Street'}</label>
                  <input {...register('buyer.address.street')} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'الرمز البريدي' : 'Postal Code'}</label>
                  <input {...register('buyer.address.postalCode')} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'الدولة' : 'Country'}</label>
                  <input {...register('buyer.address.country')} className="input" placeholder="SA" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'رقم المبنى' : 'Building Number'}</label>
                  <input {...register('buyer.address.buildingNumber')} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'الرقم الإضافي' : 'Additional Number'}</label>
                  <input {...register('buyer.address.additionalNumber')} className="input" />
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'بنود الفاتورة' : 'Line Items'}</h3>
              <button type="button" onClick={() => append({ ...emptyLine })} className="btn btn-secondary"><Plus className="w-4 h-4" />{t('add')}</button>
            </div>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <motion.div key={field.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-gray-50 p-4 dark:bg-dark-700">
                  <input type="hidden" {...register(`lineItems.${index}.productNameAr`)} />
                  <input type="hidden" {...register(`lineItems.${index}.unitCode`)} />
                  <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
                    <div className="md:col-span-4">
                      <label className="label">{t('productName')} *</label>
                      {isTradingContext ? (
                        <>
                          <select {...register(`lineItems.${index}.productId`, { onChange: (e) => onSelectProduct(index, e.target.value) })} className="select">
                            <option value="">{language === 'ar' ? 'اختياري: اختر منتج' : 'Optional: Select product'}</option>
                            {(products || []).map((item) => <option key={item._id} value={item._id}>{language === 'ar' ? (item.nameAr || item.nameEn) : item.nameEn}</option>)}
                          </select>
                          <input {...register(`lineItems.${index}.productName`, { required: true })} className="input mt-2" readOnly={Boolean(lineItems?.[index]?.productId)} placeholder={language === 'ar' ? 'اسم المنتج أو الخدمة' : 'Product or service name'} />
                        </>
                      ) : (
                        <input {...register(`lineItems.${index}.productName`, { required: true })} className="input" placeholder={language === 'ar' ? 'اسم الخدمة' : 'Service name'} />
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">{t('quantity')}</label>
                      <input type="number" min="1" {...register(`lineItems.${index}.quantity`, { valueAsNumber: true, required: true, min: 1 })} className="input" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">{t('unitPrice')}</label>
                      <input type="number" step="0.01" {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true, required: true, min: 0 })} className="input" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">{t('tax')} %</label>
                      <select {...register(`lineItems.${index}.taxRate`, { valueAsNumber: true })} className="select"><option value={15}>15%</option><option value={0}>0%</option></select>
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <div className="flex-1 text-end"><p className="mb-1 text-xs text-gray-500">{t('total')}</p><p className="font-semibold"><Money value={calculateLineTotal(index).total} /></p></div>
                      {fields.length > 1 && <button type="button" onClick={() => remove(index)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div>
              <label className="label">{language === 'ar' ? 'ملاحظات' : 'Notes'}</label>
              <textarea {...register('notes')} className="input" rows={3} />
            </div>
            <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3 md:w-80">
                <div>
                  <label className="label">{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</label>
                  <select {...register('paymentMethod')} className="select">
                    <option value="cash">{language === 'ar' ? 'نقداً' : 'Cash'}</option>
                    <option value="card">{language === 'ar' ? 'بطاقة' : 'Card'}</option>
                    <option value="bank_transfer">{language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                  </select>
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'خصم الفاتورة' : 'Invoice Discount'}</label>
                  <input type="number" min="0" step="0.01" {...register('invoiceDiscount', { valueAsNumber: true, min: 0 })} className="input" />
                </div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t('subtotal')}</span><span><Money value={totals.subtotal} /></span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t('discount')}</span><span><Money value={totals.totalDiscount} /></span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">{language === 'ar' ? 'المبلغ الخاضع للضريبة' : 'Taxable Amount'}</span><span><Money value={totals.taxableAmount} /></span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t('tax')}</span><span><Money value={totals.totalTax} /></span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold dark:border-dark-600"><span>{t('total')}</span><span className="text-primary-600"><Money value={totals.grandTotal} /></span></div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => navigate('/app/dashboard/invoices/new')} className="btn btn-secondary">{t('cancel')}</button>
                <button type="submit" disabled={createMutation.isPending} className="btn btn-action-dark">{createMutation.isPending ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <><Save className="w-4 h-4" />{t('save')}</>}</button>
              </div>
            </div>
          </div>
        </form>

        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="card p-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'المعاينة المباشرة' : 'Live Preview'}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'تتحدث المعاينة فوراً مع تغيير القالب والبيانات.' : 'Preview updates instantly as you change the template and form data.'}</p>
          </div>
          <InvoiceLivePreview invoice={previewInvoice} tenant={tenant} language={language} templateId={selectedTemplateId} bilingual={previewInvoice?.invoiceSubtype === 'travel_ticket' || ['travel_agency', 'trading', 'construction'].includes(previewInvoice?.businessContext)} />
        </div>
      </div>
    </div>
  )
}
