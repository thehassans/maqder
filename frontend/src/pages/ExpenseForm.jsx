import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Receipt, CheckCircle2, DollarSign, XCircle, Building2, Users, User } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'
import Money from '../components/ui/Money'
import { useLiveTranslation } from '../lib/liveTranslation'

const statusMeta = {
  draft: { badge: 'badge-neutral', en: 'Draft', ar: 'مسودة' },
  pending_approval: { badge: 'badge-warning', en: 'Pending Approval', ar: 'بانتظار الموافقة' },
  approved: { badge: 'badge-info', en: 'Approved', ar: 'معتمد' },
  paid: { badge: 'badge-success', en: 'Paid', ar: 'مدفوع' },
  cancelled: { badge: 'badge-danger', en: 'Cancelled', ar: 'ملغي' },
}

const formatDateForInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

const categories = [
  { value: 'utilities', en: 'Utilities', ar: 'مرافق' },
  { value: 'rent', en: 'Rent', ar: 'إيجار' },
  { value: 'travel', en: 'Travel', ar: 'سفر' },
  { value: 'marketing', en: 'Marketing', ar: 'تسويق' },
  { value: 'supplies', en: 'Supplies', ar: 'مستلزمات' },
  { value: 'maintenance', en: 'Maintenance', ar: 'صيانة' },
  { value: 'other', en: 'Other', ar: 'أخرى' },
]

export default function ExpenseForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { language } = useSelector((state) => state.ui)
  const { tenant } = useSelector((state) => state.auth)
  const { t } = useTranslation(language)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      expenseNumber: '',
      expenseDate: formatDateForInput(new Date()),
      category: 'other',
      categoryAr: '',
      description: '',
      descriptionAr: '',
      payeeType: 'supplier',
      supplierId: '',
      employeeId: '',
      customerId: '',
      payeeName: '',
      currency: tenant?.settings?.currency || 'SAR',
      amount: 0,
      taxAmount: 0,
      paymentMethod: 'bank_transfer',
      paymentReference: '',
      paymentDate: '',
      notes: '',
    },
  })

  useLiveTranslation({
    watch,
    setValue,
    sourceField: 'description',
    targetField: 'descriptionAr',
    sourceLang: 'en',
    targetLang: 'ar',
  })

  useLiveTranslation({
    watch,
    setValue,
    sourceField: 'descriptionAr',
    targetField: 'description',
    sourceLang: 'ar',
    targetLang: 'en',
  })

  const payeeType = watch('payeeType')

  useEffect(() => {
    if (payeeType === 'supplier') {
      setValue('employeeId', '')
      setValue('customerId', '')
      setValue('payeeName', '')
    } else if (payeeType === 'employee') {
      setValue('supplierId', '')
      setValue('customerId', '')
      setValue('payeeName', '')
    } else if (payeeType === 'customer') {
      setValue('supplierId', '')
      setValue('employeeId', '')
      setValue('payeeName', '')
    } else {
      setValue('supplierId', '')
      setValue('employeeId', '')
      setValue('customerId', '')
    }
  }, [payeeType, setValue])

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => api.get(`/expenses/${id}`).then((res) => res.data),
    enabled: isEdit,
    onSuccess: (data) => {
      const initialPayeeType = data?.supplierId
        ? 'supplier'
        : data?.employeeId
          ? 'employee'
          : data?.customerId
            ? 'customer'
            : 'other'

      reset({
        expenseNumber: data?.expenseNumber || '',
        expenseDate: formatDateForInput(data?.expenseDate),
        category: data?.category || 'other',
        categoryAr: data?.categoryAr || '',
        description: data?.description || '',
        descriptionAr: data?.descriptionAr || '',
        payeeType: initialPayeeType,
        supplierId: data?.supplierId?._id || data?.supplierId || '',
        employeeId: data?.employeeId?._id || data?.employeeId || '',
        customerId: data?.customerId?._id || data?.customerId || '',
        payeeName: data?.payeeName || '',
        currency: data?.currency || tenant?.settings?.currency || 'SAR',
        amount: data?.amount ?? 0,
        taxAmount: data?.taxAmount ?? 0,
        paymentMethod: data?.paymentMethod || 'bank_transfer',
        paymentReference: data?.paymentReference || '',
        paymentDate: formatDateForInput(data?.paymentDate),
        notes: data?.notes || '',
      })
    },
  })

  const currentStatus = expense?.status || (isEdit ? 'draft' : 'draft')
  const statusLabel = statusMeta[currentStatus] || statusMeta.draft

  const isLocked = isEdit && ['paid', 'cancelled'].includes(currentStatus)

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-lookup'],
    queryFn: () => api.get('/suppliers', { params: { limit: 200 } }).then((res) => res.data.suppliers),
    enabled: payeeType === 'supplier',
    retry: false,
  })

  const { data: employees } = useQuery({
    queryKey: ['employees-lookup'],
    queryFn: () => api.get('/employees', { params: { limit: 200 } }).then((res) => res.data.employees),
    enabled: payeeType === 'employee',
    retry: false,
  })

  const { data: customers } = useQuery({
    queryKey: ['customers-lookup'],
    queryFn: () => api.get('/customers', { params: { limit: 200 } }).then((res) => res.data.customers),
    enabled: payeeType === 'customer',
    retry: false,
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => (isEdit ? api.put(`/expenses/${id}`, payload) : api.post('/expenses', payload)),
    onSuccess: (res) => {
      toast.success(
        isEdit
          ? language === 'ar'
            ? 'تم تحديث المصروف'
            : 'Expense updated'
          : language === 'ar'
            ? 'تم إنشاء المصروف'
            : 'Expense created'
      )
      queryClient.invalidateQueries(['expenses'])
      queryClient.invalidateQueries(['expense-stats'])
      queryClient.invalidateQueries(['dashboard-expenses'])
      queryClient.invalidateQueries(['finance-expenses'])
      queryClient.invalidateQueries(['expense', id])

      if (!isEdit) {
        const newId = res?.data?._id
        if (newId) navigate(`/expenses/${newId}`)
        else navigate('/expenses')
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const submitMutation = useMutation({
    mutationFn: () => api.put(`/expenses/${id}/submit`),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم إرسال المصروف للموافقة' : 'Submitted for approval')
      queryClient.invalidateQueries(['expense', id])
      queryClient.invalidateQueries(['expenses'])
      queryClient.invalidateQueries(['expense-stats'])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const approveMutation = useMutation({
    mutationFn: () => api.put(`/expenses/${id}/approve`),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم اعتماد المصروف' : 'Expense approved')
      queryClient.invalidateQueries(['expense', id])
      queryClient.invalidateQueries(['expenses'])
      queryClient.invalidateQueries(['expense-stats'])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const payMutation = useMutation({
    mutationFn: (payload) => api.put(`/expenses/${id}/pay`, payload),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم تسجيل الدفع' : 'Marked as paid')
      queryClient.invalidateQueries(['expense', id])
      queryClient.invalidateQueries(['expenses'])
      queryClient.invalidateQueries(['expense-stats'])
      queryClient.invalidateQueries(['dashboard-expenses'])
      queryClient.invalidateQueries(['finance-expenses'])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => api.put(`/expenses/${id}/cancel`),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم إلغاء المصروف' : 'Expense cancelled')
      queryClient.invalidateQueries(['expense', id])
      queryClient.invalidateQueries(['expenses'])
      queryClient.invalidateQueries(['expense-stats'])
      queryClient.invalidateQueries(['dashboard-expenses'])
      queryClient.invalidateQueries(['finance-expenses'])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const amount = Number(watch('amount') || 0)
  const taxAmount = Number(watch('taxAmount') || 0)

  const totals = useMemo(() => {
    const total = amount + taxAmount
    return {
      amount,
      taxAmount,
      total,
    }
  }, [amount, taxAmount])

  const canSubmit = isEdit && currentStatus === 'draft'
  const canApprove = isEdit && ['draft', 'pending_approval'].includes(currentStatus)
  const canPay = isEdit && currentStatus === 'approved'
  const canCancel = isEdit && !['paid', 'cancelled'].includes(currentStatus)

  const onSubmit = (data) => {
    const payload = {
      expenseNumber: data.expenseNumber,
      expenseDate: data.expenseDate,
      category: data.category,
      categoryAr: data.categoryAr,
      description: data.description,
      descriptionAr: data.descriptionAr,
      currency: data.currency,
      amount: Number(data.amount || 0),
      taxAmount: Number(data.taxAmount || 0),
      paymentMethod: data.paymentMethod,
      paymentReference: data.paymentReference,
      paymentDate: data.paymentDate || undefined,
      notes: data.notes,
      supplierId: data.payeeType === 'supplier' ? data.supplierId : undefined,
      employeeId: data.payeeType === 'employee' ? data.employeeId : undefined,
      customerId: data.payeeType === 'customer' ? data.customerId : undefined,
      payeeName: data.payeeType === 'other' ? data.payeeName : undefined,
    }

    saveMutation.mutate(payload)
  }

  const triggerPay = () => {
    const values = getValues()
    payMutation.mutate({
      paymentMethod: values.paymentMethod,
      paymentReference: values.paymentReference,
      paymentDate: values.paymentDate || undefined,
    })
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
          <button onClick={() => navigate('/expenses')} className="btn btn-ghost btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? (language === 'ar' ? 'تعديل مصروف' : 'Edit Expense') : language === 'ar' ? 'مصروف جديد' : 'New Expense'}
            </h1>
            {isEdit && (
              <div className="mt-1 flex items-center gap-2">
                <span className={`badge ${statusLabel.badge}`}>{language === 'ar' ? statusLabel.ar : statusLabel.en}</span>
                {expense?.expenseNumber && <span className="text-sm text-gray-500 font-mono">{expense.expenseNumber}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          {canCancel && (
            <button type="button" onClick={() => cancelMutation.mutate()} className="btn btn-secondary" disabled={cancelMutation.isPending}>
              <XCircle className="w-4 h-4" />
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          )}

          {canSubmit && (
            <button type="button" onClick={() => submitMutation.mutate()} className="btn btn-secondary" disabled={submitMutation.isPending}>
              <Receipt className="w-4 h-4" />
              {language === 'ar' ? 'إرسال للموافقة' : 'Submit'}
            </button>
          )}

          {canApprove && (
            <button type="button" onClick={() => approveMutation.mutate()} className="btn btn-secondary" disabled={approveMutation.isPending}>
              <CheckCircle2 className="w-4 h-4" />
              {language === 'ar' ? 'اعتماد' : 'Approve'}
            </button>
          )}

          {canPay && (
            <button type="button" onClick={triggerPay} className="btn btn-secondary" disabled={payMutation.isPending}>
              <DollarSign className="w-4 h-4" />
              {language === 'ar' ? 'تسجيل الدفع' : 'Mark Paid'}
            </button>
          )}

          {!isLocked && (
            <button type="button" onClick={handleSubmit(onSubmit)} className="btn btn-primary" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t('save')}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Receipt className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'معلومات المصروف' : 'Expense Details'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'تاريخ المصروف' : 'Expense Date'} *</label>
              <input type="date" {...register('expenseDate', { required: true })} className="input" disabled={isLocked} />
              {errors.expenseDate && <p className="mt-1 text-sm text-red-500">{language === 'ar' ? 'مطلوب' : 'Required'}</p>}
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'الفئة' : 'Category'}</label>
              <select {...register('category')} className="select" disabled={isLocked}>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {language === 'ar' ? c.ar : c.en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'الفئة (AR)' : 'Category (AR)'}</label>
              <input {...register('categoryAr')} className="input" dir="rtl" disabled={isLocked} />
            </div>

            <div className="md:col-span-2">
              <label className="label">{language === 'ar' ? 'الوصف (EN)' : 'Description (EN)'}</label>
              <input {...register('description')} className="input" disabled={isLocked} />
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'الوصف (AR)' : 'Description (AR)'}</label>
              <input {...register('descriptionAr')} className="input" dir="rtl" disabled={isLocked} />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              {payeeType === 'supplier' ? (
                <Building2 className="w-5 h-5 text-blue-600" />
              ) : payeeType === 'employee' ? (
                <Users className="w-5 h-5 text-blue-600" />
              ) : (
                <User className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'الجهة' : 'Payee'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'نوع الجهة' : 'Payee Type'}</label>
              <select {...register('payeeType')} className="select" disabled={isLocked}>
                <option value="supplier">{language === 'ar' ? 'مورد' : 'Supplier'}</option>
                <option value="employee">{language === 'ar' ? 'موظف' : 'Employee'}</option>
                <option value="customer">{language === 'ar' ? 'عميل' : 'Customer'}</option>
                <option value="other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
              </select>
            </div>

            {payeeType === 'supplier' && (
              <div className="md:col-span-2">
                <label className="label">{language === 'ar' ? 'المورد' : 'Supplier'}</label>
                <select {...register('supplierId')} className="select" disabled={isLocked}>
                  <option value="">{language === 'ar' ? 'اختر مورد' : 'Select supplier'}</option>
                  {(suppliers || []).map((s) => (
                    <option key={s._id} value={s._id}>
                      {language === 'ar' ? s.nameAr || s.nameEn : s.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {payeeType === 'employee' && (
              <div className="md:col-span-2">
                <label className="label">{language === 'ar' ? 'الموظف' : 'Employee'}</label>
                <select {...register('employeeId')} className="select" disabled={isLocked}>
                  <option value="">{language === 'ar' ? 'اختر موظف' : 'Select employee'}</option>
                  {(employees || []).map((e) => {
                    const en = `${e.firstNameEn || ''} ${e.lastNameEn || ''}`.trim()
                    const ar = `${e.firstNameAr || ''} ${e.lastNameAr || ''}`.trim()
                    return (
                      <option key={e._id} value={e._id}>
                        {(language === 'ar' ? ar || en : en || ar) + (e.employeeId ? ` (${e.employeeId})` : '')}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}

            {payeeType === 'customer' && (
              <div className="md:col-span-2">
                <label className="label">{language === 'ar' ? 'العميل' : 'Customer'}</label>
                <select {...register('customerId')} className="select" disabled={isLocked}>
                  <option value="">{language === 'ar' ? 'اختر عميل' : 'Select customer'}</option>
                  {(customers || []).map((c) => (
                    <option key={c._id} value={c._id}>
                      {language === 'ar' ? c.nameAr || c.name : c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {payeeType === 'other' && (
              <div className="md:col-span-2">
                <label className="label">{language === 'ar' ? 'اسم الجهة' : 'Payee Name'}</label>
                <input {...register('payeeName')} className="input" disabled={isLocked} />
              </div>
            )}
          </div>

        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'المبلغ والدفع' : 'Amounts & Payment'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'العملة' : 'Currency'}</label>
              <input {...register('currency')} className="input" disabled />
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'المبلغ' : 'Amount'} *</label>
              <input
                type="number"
                step="0.01"
                {...register('amount', { required: true, min: 0 })}
                className="input"
                disabled={isLocked}
              />
              {errors.amount && <p className="mt-1 text-sm text-red-500">{language === 'ar' ? 'مطلوب' : 'Required'}</p>}
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'الضريبة' : 'Tax'}</label>
              <input type="number" step="0.01" {...register('taxAmount', { min: 0 })} className="input" disabled={isLocked} />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-sm text-gray-500">{language === 'ar' ? 'الإجمالي' : 'Total'}</div>
                <div className="text-lg font-semibold">
                  <Money value={totals.total} minimumFractionDigits={0} maximumFractionDigits={0} />
                </div>
              </div>
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</label>
              <select {...register('paymentMethod')} className="select" disabled={isLocked}>
                <option value="bank_transfer">{language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                <option value="cash">{language === 'ar' ? 'نقداً' : 'Cash'}</option>
                <option value="cheque">{language === 'ar' ? 'شيك' : 'Cheque'}</option>
                <option value="card">{language === 'ar' ? 'بطاقة' : 'Card'}</option>
                <option value="other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
              </select>
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'مرجع الدفع' : 'Payment Reference'}</label>
              <input {...register('paymentReference')} className="input" disabled={isLocked} />
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'تاريخ الدفع' : 'Payment Date'}</label>
              <input type="date" {...register('paymentDate')} className="input" disabled={isLocked} />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="label">{language === 'ar' ? 'ملاحظات' : 'Notes'}</label>
              <textarea {...register('notes')} className="input" rows={3} disabled={isLocked} />
            </div>
          </div>
        </motion.div>
      </form>
    </div>
  )
}
