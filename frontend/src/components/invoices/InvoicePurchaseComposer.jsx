import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useFieldArray, useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import Money from '../ui/Money'
import { getPrimaryBusinessType, getTenantBusinessTypes } from '../../lib/businessTypes'
import InvoiceLivePreview from './InvoiceLivePreview'
import InvoiceTemplateSelector from './InvoiceTemplateSelector'
import TravelInvoiceFields from './TravelInvoiceFields'

const emptyLine = { productId: '', productName: '', productNameAr: '', unitCode: 'PCE', quantity: 1, unitPrice: 0, taxRate: 15 }
const purchaseContexts = ['trading', 'construction', 'travel_agency']

export default function InvoicePurchaseComposer() {
  const navigate = useNavigate()
  const { language } = useSelector((state) => state.ui)
  const { tenant } = useSelector((state) => state.auth)
  const { t } = useTranslation(language)
  const [transactionType, setTransactionType] = useState('B2B')
  const tenantBusinessTypes = getTenantBusinessTypes(tenant)
  const defaultBusinessContext = useMemo(() => {
    const primary = getPrimaryBusinessType(tenant)
    if (purchaseContexts.includes(primary)) return primary
    return tenantBusinessTypes.find((type) => purchaseContexts.includes(type)) || 'trading'
  }, [tenant, tenantBusinessTypes])

  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      businessContext: defaultBusinessContext,
      invoiceSubtype: tenantBusinessTypes.includes('travel_agency') ? 'travel_ticket' : 'standard',
      pdfTemplateId: Number(tenant?.settings?.invoicePdfTemplate || 1),
      transactionType: 'B2B',
      invoiceTypeCode: '0100000',
      warehouseId: '',
      supplierId: '',
      seller: {},
      buyer: {},
      travelDetails: {},
      notes: '',
      lineItems: [emptyLine],
    }
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' })
  const values = watch()
  const lineItems = Array.isArray(values.lineItems) ? values.lineItems : []
  const businessContext = values.businessContext || defaultBusinessContext
  const invoiceSubtype = values.invoiceSubtype || 'standard'
  const selectedTemplateId = Number(values.pdfTemplateId || tenant?.settings?.invoicePdfTemplate || 1)
  const isTradingContext = businessContext === 'trading'
  const isTravelContext = businessContext === 'travel_agency'

  useEffect(() => {
    setValue('businessContext', defaultBusinessContext)
  }, [defaultBusinessContext, setValue])

  useEffect(() => {
    if (!isTravelContext && invoiceSubtype === 'travel_ticket') {
      setValue('invoiceSubtype', 'standard')
    }
  }, [invoiceSubtype, isTravelContext, setValue])

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

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-lookup'],
    queryFn: () => api.get('/suppliers', { params: { limit: 200 } }).then((res) => res.data.suppliers),
    enabled: isTradingContext,
  })

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/invoices/purchase', payload),
    onSuccess: (res) => {
      toast.success(language === 'ar' ? 'تم إنشاء فاتورة الشراء بنجاح' : 'Purchase invoice created successfully')
      navigate(`/app/dashboard/invoices/${res.data._id}`)
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to create purchase invoice'),
  })

  const onSelectProduct = (index, productId) => {
    const product = (products || []).find((item) => item._id === productId)
    if (!product) return
    setValue(`lineItems.${index}.productId`, product._id)
    setValue(`lineItems.${index}.productName`, product.nameEn)
    setValue(`lineItems.${index}.productNameAr`, product.nameAr || product.nameEn)
    setValue(`lineItems.${index}.unitCode`, product.unitOfMeasure || 'PCE')
    setValue(`lineItems.${index}.taxRate`, typeof product.taxRate === 'number' ? product.taxRate : 15)
    if (typeof product.costPrice === 'number' && product.costPrice > 0) {
      setValue(`lineItems.${index}.unitPrice`, product.costPrice)
    }
  }

  const onSelectSupplier = (supplierId) => {
    const supplier = (suppliers || []).find((item) => item._id === supplierId)
    if (!supplier) return
    setValue('supplierId', supplier._id)
    setValue('seller.name', supplier.nameEn)
    setValue('seller.nameAr', supplier.nameAr || supplier.nameEn)
    setValue('seller.vatNumber', supplier.vatNumber || '')
    setValue('seller.crNumber', supplier.crNumber || '')
    setValue('seller.contactPhone', supplier.phone || '')
    setValue('seller.contactEmail', supplier.email || '')
    setValue('seller.address.city', supplier.address?.city || '')
    setValue('seller.address.district', supplier.address?.district || '')
    setValue('seller.address.street', supplier.address?.street || '')
  }

  const calculateLineTotal = (index) => {
    const line = lineItems[index]
    if (!line) return { subtotal: 0, tax: 0, total: 0 }
    const subtotal = Number(line.quantity || 0) * Number(line.unitPrice || 0)
    const tax = subtotal * (Number(line.taxRate || 15) / 100)
    return { subtotal, tax, total: subtotal + tax }
  }

  const totals = useMemo(() => lineItems.reduce((acc, _, index) => {
    const calc = calculateLineTotal(index)
    acc.subtotal += calc.subtotal
    acc.totalTax += calc.tax
    acc.grandTotal += calc.total
    return acc
  }, { subtotal: 0, totalTax: 0, grandTotal: 0 }), [lineItems])

  const onSubmit = (data) => {
    const payload = {
      ...data,
      flow: 'purchase',
      businessContext,
      invoiceSubtype,
      pdfTemplateId: selectedTemplateId,
      transactionType,
      invoiceTypeCode: transactionType === 'B2C' ? '0200000' : '0100000',
      issueDate: new Date(),
      lineItems: (data.lineItems || []).map((line, index) => ({
        ...line,
        lineNumber: index + 1,
        taxCategory: 'S',
        productId: isTradingContext ? line.productId || undefined : undefined,
      })),
    }

    if (!isTradingContext) {
      delete payload.warehouseId
      delete payload.supplierId
    }
    if (invoiceSubtype !== 'travel_ticket') delete payload.travelDetails
    createMutation.mutate(payload)
  }

  const previewInvoice = {
    ...values,
    invoiceNumber: 'DRAFT-PURCHASE',
    issueDate: new Date(),
    flow: 'purchase',
    transactionType,
    invoiceSubtype,
    pdfTemplateId: selectedTemplateId,
    subtotal: totals.subtotal,
    totalTax: totals.totalTax,
    grandTotal: totals.grandTotal,
    buyer: {
      name: tenant?.business?.legalNameEn,
      nameAr: tenant?.business?.legalNameAr,
      vatNumber: tenant?.business?.vatNumber,
      address: tenant?.business?.address,
    },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/app/dashboard/invoices/new')} className="btn btn-ghost btn-icon"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'فاتورة شراء جديدة' : 'New Purchase Invoice'}</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">{language === 'ar' ? 'تدعم الشراء التجاري والخدمي وفواتير السفر' : 'Supports trading, service, and travel purchase invoices'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="card p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'سياق الشراء' : 'Purchase Context'}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {tenantBusinessTypes.filter((type) => purchaseContexts.includes(type)).map((type) => (
                <button key={type} type="button" onClick={() => setValue('businessContext', type)} className={`rounded-2xl border p-4 text-start ${businessContext === type ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}>
                  <p className="font-semibold text-gray-900 dark:text-white">{type === 'trading' ? (language === 'ar' ? 'تجارة' : 'Trading') : type === 'construction' ? (language === 'ar' ? 'مقاولات' : 'Construction') : (language === 'ar' ? 'سفر' : 'Travel Agency')}</p>
                </button>
              ))}
            </div>
            <input type="hidden" {...register('businessContext')} />
          </div>

          <div className="card p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'الإعدادات الأساسية' : 'Basic Settings'}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="label">{language === 'ar' ? 'النوع' : 'Type'}</label>
                <select value={transactionType} onChange={(e) => { setTransactionType(e.target.value); setValue('transactionType', e.target.value) }} className="select">
                  <option value="B2B">{t('b2bInvoice')}</option>
                  <option value="B2C">{t('b2cInvoice')}</option>
                </select>
              </div>
              {isTradingContext && (
                <>
                  <div>
                    <label className="label">{language === 'ar' ? 'المستودع' : 'Warehouse'} *</label>
                    <select {...register('warehouseId', { required: isTradingContext })} className="select"><option value="">{language === 'ar' ? 'اختر' : 'Select'}</option>{(warehouses || []).map((item) => <option key={item._id} value={item._id}>{language === 'ar' ? (item.nameAr || item.nameEn) : item.nameEn}</option>)}</select>
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'المورد' : 'Supplier'} *</label>
                    <select {...register('supplierId', { required: isTradingContext, onChange: (e) => onSelectSupplier(e.target.value) })} className="select"><option value="">{language === 'ar' ? 'اختر' : 'Select'}</option>{(suppliers || []).map((item) => <option key={item._id} value={item._id}>{language === 'ar' ? (item.nameAr || item.nameEn) : item.nameEn}</option>)}</select>
                  </div>
                </>
              )}
            </div>
            {isTravelContext && (
              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                <button type="button" onClick={() => setValue('invoiceSubtype', 'travel_ticket')} className={`rounded-2xl border p-4 text-start ${invoiceSubtype === 'travel_ticket' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}><p className="font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'فاتورة سفر / تذاكر' : 'Travel / Ticket Invoice'}</p></button>
                <button type="button" onClick={() => setValue('invoiceSubtype', 'standard')} className={`rounded-2xl border p-4 text-start ${invoiceSubtype === 'standard' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}><p className="font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'فاتورة قياسية' : 'Standard Invoice'}</p></button>
              </div>
            )}
            <input type="hidden" {...register('invoiceSubtype')} />
          </div>

          <div className="card p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'قالب ومعاينة' : 'Template & Preview'}</h3>
            <InvoiceTemplateSelector language={language} value={selectedTemplateId} onChange={(id) => setValue('pdfTemplateId', id)} />
            <input type="hidden" {...register('pdfTemplateId')} />
          </div>

          <div className="card p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'بيانات المورد / البائع' : 'Vendor / Seller Details'}</h3>
            {invoiceSubtype === 'travel_ticket' ? (
              <TravelInvoiceFields language={language} register={register} partyPrefix="seller" partyNameLabel={language === 'ar' ? 'اسم المورد / الجهة' : 'Vendor / Supplier Name'} />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div><label className="label">{language === 'ar' ? 'الاسم / الشركة' : 'Name / Company'}</label><input {...register('seller.name', { required: true })} className="input" /></div>
                <div><label className="label">{language === 'ar' ? 'الرقم الضريبي' : 'VAT Number'}</label><input {...register('seller.vatNumber')} className="input" /></div>
                <div><label className="label">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label><input {...register('seller.contactPhone')} className="input" /></div>
                <div><label className="label">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label><input type="email" {...register('seller.contactEmail')} className="input" /></div>
                <div><label className="label">{language === 'ar' ? 'المدينة' : 'City'}</label><input {...register('seller.address.city')} className="input" /></div>
                <div><label className="label">{language === 'ar' ? 'الحي' : 'District'}</label><input {...register('seller.address.district')} className="input" /></div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'بنود الفاتورة' : 'Line Items'}</h3><button type="button" onClick={() => append({ ...emptyLine })} className="btn btn-secondary"><Plus className="w-4 h-4" />{t('add')}</button></div>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <motion.div key={field.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-gray-50 p-4 dark:bg-dark-700">
                  <input type="hidden" {...register(`lineItems.${index}.productNameAr`)} />
                  <input type="hidden" {...register(`lineItems.${index}.unitCode`)} />
                  <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
                    <div className="md:col-span-4">
                      <label className="label">{language === 'ar' ? 'الوصف' : 'Description'} *</label>
                      {isTradingContext ? (
                        <>
                          <select {...register(`lineItems.${index}.productId`, { required: true, onChange: (e) => onSelectProduct(index, e.target.value) })} className="select"><option value="">{language === 'ar' ? 'اختر المنتج' : 'Select product'}</option>{(products || []).map((item) => <option key={item._id} value={item._id}>{language === 'ar' ? (item.nameAr || item.nameEn) : item.nameEn}</option>)}</select>
                          <input {...register(`lineItems.${index}.productName`, { required: true })} className="input mt-2" readOnly placeholder={language === 'ar' ? 'اسم المنتج' : 'Product name'} />
                        </>
                      ) : (
                        <input {...register(`lineItems.${index}.productName`, { required: true })} className="input" placeholder={language === 'ar' ? 'اسم الخدمة' : 'Service name'} />
                      )}
                    </div>
                    <div className="md:col-span-2"><label className="label">{t('quantity')}</label><input type="number" min="1" {...register(`lineItems.${index}.quantity`, { valueAsNumber: true, required: true, min: 1 })} className="input" /></div>
                    <div className="md:col-span-2"><label className="label">{t('unitPrice')}</label><input type="number" step="0.01" {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true, required: true, min: 0 })} className="input" /></div>
                    <div className="md:col-span-2"><label className="label">{t('tax')} %</label><select {...register(`lineItems.${index}.taxRate`, { valueAsNumber: true })} className="select"><option value={15}>15%</option><option value={0}>0%</option></select></div>
                    <div className="md:col-span-2 flex items-center gap-2"><div className="flex-1 text-end"><p className="mb-1 text-xs text-gray-500">{t('total')}</p><p className="font-semibold"><Money value={calculateLineTotal(index).total} /></p></div>{fields.length > 1 && <button type="button" onClick={() => remove(index)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></button>}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div><label className="label">{language === 'ar' ? 'ملاحظات' : 'Notes'}</label><textarea {...register('notes')} className="input" rows={3} /></div>
            <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2 md:w-64"><div className="flex justify-between text-sm"><span className="text-gray-500">{t('subtotal')}</span><span><Money value={totals.subtotal} /></span></div><div className="flex justify-between text-sm"><span className="text-gray-500">{t('tax')}</span><span><Money value={totals.totalTax} /></span></div><div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold dark:border-dark-600"><span>{t('total')}</span><span className="text-primary-600"><Money value={totals.grandTotal} /></span></div></div>
              <div className="flex gap-3"><button type="button" onClick={() => navigate('/app/dashboard/invoices/new')} className="btn btn-secondary">{t('cancel')}</button><button type="submit" disabled={createMutation.isPending} className="btn btn-primary">{createMutation.isPending ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <><Save className="w-4 h-4" />{t('save')}</>}</button></div>
            </div>
          </div>
        </form>

        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="card p-4"><h3 className="text-base font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'المعاينة المباشرة' : 'Live Preview'}</h3><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'تعرض المعاينة شكل الطباعة النهائي تقريباً.' : 'The preview closely reflects the final printed layout.'}</p></div>
          <InvoiceLivePreview invoice={previewInvoice} tenant={tenant} language={language} templateId={selectedTemplateId} />
        </div>
      </div>
    </div>
  )
}
