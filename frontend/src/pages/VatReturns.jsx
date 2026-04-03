import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Building2, Calendar, Receipt, RefreshCw, Save, ShieldCheck, Sparkles, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'

const getCurrentPeriod = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

const createEmptyManual = () => ({
  salesStandardRated: { amount: 0, adjustment: 0, vatAmount: 0 },
  salesSpecialCitizen: { amount: 0, adjustment: 0, vatAmount: 0 },
  salesZeroRatedDomestic: { amount: 0, adjustment: 0, vatAmount: 0 },
  salesExports: { amount: 0, adjustment: 0, vatAmount: 0 },
  salesExempt: { amount: 0, adjustment: 0, vatAmount: 0 },
  purchasesStandardRatedDomestic: { amount: 0, adjustment: 0, vatAmount: 0 },
  purchasesImportsCustoms: { amount: 0, adjustment: 0, vatAmount: 0 },
  purchasesImportsReverseCharge: { amount: 0, adjustment: 0, vatAmount: 0 },
  purchasesZeroRated: { amount: 0, adjustment: 0, vatAmount: 0 },
  purchasesExempt: { amount: 0, adjustment: 0, vatAmount: 0 },
})

const toNumber = (value, fallback = 0) => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

const formatMoney = (value, language = 'en', currency = 'SAR') => new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
  style: 'currency',
  currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(toNumber(value))

const buildStatementFromManual = ({ baseStatement, savedManual, currentManual, correctionsPreviousPeriod, vatCreditCarriedForward }) => {
  const getBaseLine = (key) => {
    const finalLine = baseStatement?.[key] || { amount: 0, adjustment: 0, vatAmount: 0 }
    const savedLine = savedManual?.[key] || { amount: 0, adjustment: 0, vatAmount: 0 }
    return {
      amount: toNumber(finalLine.amount) - toNumber(savedLine.amount),
      adjustment: 0,
      vatAmount: toNumber(finalLine.vatAmount) - toNumber(savedLine.vatAmount),
    }
  }

  const mergeLine = (key) => {
    const baseLine = getBaseLine(key)
    const currentLine = currentManual?.[key] || { amount: 0, adjustment: 0, vatAmount: 0 }
    return {
      amount: toNumber(baseLine.amount) + toNumber(currentLine.amount),
      adjustment: toNumber(currentLine.adjustment),
      vatAmount: toNumber(baseLine.vatAmount) + toNumber(currentLine.vatAmount),
    }
  }

  const salesStandardRated = mergeLine('salesStandardRated')
  const salesSpecialCitizen = mergeLine('salesSpecialCitizen')
  const salesZeroRatedDomestic = mergeLine('salesZeroRatedDomestic')
  const salesExports = mergeLine('salesExports')
  const salesExempt = mergeLine('salesExempt')
  const totalSales = {
    amount: salesStandardRated.amount + salesSpecialCitizen.amount + salesZeroRatedDomestic.amount + salesExports.amount + salesExempt.amount,
    adjustment: salesStandardRated.adjustment + salesSpecialCitizen.adjustment + salesZeroRatedDomestic.adjustment + salesExports.adjustment + salesExempt.adjustment,
    vatAmount: salesStandardRated.vatAmount + salesSpecialCitizen.vatAmount + salesZeroRatedDomestic.vatAmount + salesExports.vatAmount + salesExempt.vatAmount,
  }

  const purchasesStandardRatedDomestic = mergeLine('purchasesStandardRatedDomestic')
  const purchasesImportsCustoms = mergeLine('purchasesImportsCustoms')
  const purchasesImportsReverseCharge = mergeLine('purchasesImportsReverseCharge')
  const purchasesZeroRated = mergeLine('purchasesZeroRated')
  const purchasesExempt = mergeLine('purchasesExempt')
  const totalPurchases = {
    amount: purchasesStandardRatedDomestic.amount + purchasesImportsCustoms.amount + purchasesImportsReverseCharge.amount + purchasesZeroRated.amount + purchasesExempt.amount,
    adjustment: purchasesStandardRatedDomestic.adjustment + purchasesImportsCustoms.adjustment + purchasesImportsReverseCharge.adjustment + purchasesZeroRated.adjustment + purchasesExempt.adjustment,
    vatAmount: purchasesStandardRatedDomestic.vatAmount + purchasesImportsCustoms.vatAmount + purchasesImportsReverseCharge.vatAmount + purchasesZeroRated.vatAmount + purchasesExempt.vatAmount,
  }

  const totalVatDueCurrentPeriod = totalSales.vatAmount - totalPurchases.vatAmount
  const corrections = toNumber(correctionsPreviousPeriod)
  const credit = toNumber(vatCreditCarriedForward)
  const netVatDue = totalVatDueCurrentPeriod + corrections - credit

  return {
    salesStandardRated,
    salesSpecialCitizen,
    salesZeroRatedDomestic,
    salesExports,
    salesExempt,
    totalSales,
    purchasesStandardRatedDomestic,
    purchasesImportsCustoms,
    purchasesImportsReverseCharge,
    purchasesZeroRated,
    purchasesExempt,
    totalPurchases,
    totalVatDueCurrentPeriod: { amount: 0, adjustment: 0, vatAmount: totalVatDueCurrentPeriod },
    correctionsPreviousPeriod: { amount: 0, adjustment: 0, vatAmount: corrections },
    vatCreditCarriedForward: { amount: 0, adjustment: 0, vatAmount: credit },
    netVatDue: { amount: 0, adjustment: 0, vatAmount: netVatDue },
  }
}

export default function VatReturns() {
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const isArabic = language === 'ar'
  const [filters, setFilters] = useState(getCurrentPeriod)

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      businessLocation: 'all',
      manual: createEmptyManual(),
      correctionsPreviousPeriod: 0,
      vatCreditCarriedForward: 0,
      notes: '',
      status: 'draft',
    },
  })

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['vat-returns', filters.startDate, filters.endDate],
    queryFn: () => api.get('/reports/vat-return', { params: filters }).then((res) => res.data),
  })

  useEffect(() => {
    if (!data?.vatReturn) return
    reset({
      businessLocation: data.vatReturn.businessLocation || 'all',
      manual: data.vatReturn.manual || createEmptyManual(),
      correctionsPreviousPeriod: toNumber(data.vatReturn.correctionsPreviousPeriod),
      vatCreditCarriedForward: toNumber(data.vatReturn.vatCreditCarriedForward),
      notes: data.vatReturn.notes || '',
      status: data.vatReturn.status || 'draft',
    })
  }, [data, reset])

  const watchedManual = watch('manual') || createEmptyManual()
  const watchedCorrections = watch('correctionsPreviousPeriod')
  const watchedCredit = watch('vatCreditCarriedForward')
  const watchedBusinessLocation = watch('businessLocation')
  const watchedNotes = watch('notes')
  const watchedStatus = watch('status')

  const statement = useMemo(() => buildStatementFromManual({
    baseStatement: data?.vatReturn?.statement || {},
    savedManual: data?.vatReturn?.manual || createEmptyManual(),
    currentManual: watchedManual,
    correctionsPreviousPeriod: watchedCorrections,
    vatCreditCarriedForward: watchedCredit,
  }), [data, watchedManual, watchedCorrections, watchedCredit])

  const currency = data?.currency || 'SAR'
  const saveMutation = useMutation({
    mutationFn: (payload) => api.put('/reports/vat-return', payload).then((res) => res.data),
    onSuccess: () => {
      toast.success(isArabic ? 'تم حفظ إقرار ضريبة القيمة المضافة' : 'VAT return saved successfully')
      queryClient.invalidateQueries(['vat-returns'])
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to save VAT return'),
  })

  const submitReturn = (status = 'draft') => handleSubmit((formData) => {
    saveMutation.mutate({
      startDate: filters.startDate,
      endDate: filters.endDate,
      businessLocation: formData.businessLocation,
      manual: formData.manual,
      correctionsPreviousPeriod: toNumber(formData.correctionsPreviousPeriod),
      vatCreditCarriedForward: toNumber(formData.vatCreditCarriedForward),
      notes: formData.notes,
      status,
    })
  })()

  const rows = [
    { number: 1, key: 'salesStandardRated', labelEn: 'Standard rated Sales', labelAr: 'المبيعات الخاضعة للنسبة الأساسية', manualKey: 'salesStandardRated', section: 'sales' },
    { number: 2, key: 'salesSpecialCitizen', labelEn: 'Private Healthcare / Private Education / First house sales to citizens', labelAr: 'الرعاية الصحية الخاصة / التعليم الخاص / بيع المسكن الأول للمواطنين', manualKey: 'salesSpecialCitizen', section: 'sales' },
    { number: 3, key: 'salesZeroRatedDomestic', labelEn: 'Zero rated domestic sales', labelAr: 'المبيعات المحلية الخاضعة لنسبة الصفر', manualKey: 'salesZeroRatedDomestic', section: 'sales' },
    { number: 4, key: 'salesExports', labelEn: 'Exports', labelAr: 'الصادرات', manualKey: 'salesExports', section: 'sales' },
    { number: 5, key: 'salesExempt', labelEn: 'Exempt sales', labelAr: 'المبيعات المعفاة', manualKey: 'salesExempt', section: 'sales' },
    { number: 6, key: 'totalSales', labelEn: 'Total Sales', labelAr: 'إجمالي المبيعات', section: 'sales', readOnly: true },
    { number: 7, key: 'purchasesStandardRatedDomestic', labelEn: 'Standard rated domestic purchases', labelAr: 'المشتريات المحلية الخاضعة للنسبة الأساسية', manualKey: 'purchasesStandardRatedDomestic', section: 'purchases' },
    { number: 8, key: 'purchasesImportsCustoms', labelEn: 'Imports subject to VAT paid at customs', labelAr: 'الواردات الخاضعة لضريبة القيمة المضافة والمدفوعة في الجمارك', manualKey: 'purchasesImportsCustoms', section: 'purchases' },
    { number: 9, key: 'purchasesImportsReverseCharge', labelEn: 'Imports subject to VAT accounted for through the reverse charge mechanism', labelAr: 'الواردات الخاضعة للضريبة عبر آلية الاحتساب العكسي', manualKey: 'purchasesImportsReverseCharge', section: 'purchases' },
    { number: 10, key: 'purchasesZeroRated', labelEn: 'Zero rated purchases', labelAr: 'المشتريات الخاضعة لنسبة الصفر', manualKey: 'purchasesZeroRated', section: 'purchases' },
    { number: 11, key: 'purchasesExempt', labelEn: 'Exempt purchases', labelAr: 'المشتريات المعفاة', manualKey: 'purchasesExempt', section: 'purchases' },
    { number: 12, key: 'totalPurchases', labelEn: 'Total Purchases', labelAr: 'إجمالي المشتريات', section: 'purchases', readOnly: true },
    { number: 13, key: 'totalVatDueCurrentPeriod', labelEn: 'Total VAT due for current period', labelAr: 'إجمالي ضريبة القيمة المضافة المستحقة للفترة الحالية', section: 'settlement', vatOnly: true, readOnly: true },
    { number: 14, key: 'correctionsPreviousPeriod', labelEn: 'Corrections from previous period (between SAR ± 5000)', labelAr: 'تصحيحات من الفترة السابقة (بين ± 5000 ريال)', section: 'settlement', vatOnly: true, topLevelField: 'correctionsPreviousPeriod' },
    { number: 15, key: 'vatCreditCarriedForward', labelEn: 'VAT credit carried forward from previous period(s)', labelAr: 'رصيد ضريبة القيمة المضافة المرحل من فترات سابقة', section: 'settlement', vatOnly: true, topLevelField: 'vatCreditCarriedForward' },
    { number: 16, key: 'netVatDue', labelEn: 'Net VAT due (or reclaimed)', labelAr: 'صافي ضريبة القيمة المضافة المستحقة أو المستردة', section: 'settlement', vatOnly: true, readOnly: true },
  ]

  const summaryCards = [
    {
      title: isArabic ? 'إجمالي المبيعات' : 'Total Sales',
      value: formatMoney(statement.totalSales?.amount, language, currency),
      icon: TrendingUp,
      tone: 'from-emerald-500 to-teal-600',
    },
    {
      title: isArabic ? 'إجمالي المشتريات' : 'Total Purchases',
      value: formatMoney(statement.totalPurchases?.amount, language, currency),
      icon: Wallet,
      tone: 'from-amber-500 to-orange-600',
    },
    {
      title: isArabic ? 'الضريبة المستحقة للفترة' : 'VAT Due This Period',
      value: formatMoney(statement.totalVatDueCurrentPeriod?.vatAmount, language, currency),
      icon: Receipt,
      tone: 'from-sky-500 to-indigo-600',
    },
    {
      title: isArabic ? 'الصافي النهائي' : 'Net VAT Position',
      value: formatMoney(statement.netVatDue?.vatAmount, language, currency),
      icon: TrendingDown,
      tone: 'from-[#163b27] to-[#245138]',
    },
  ]

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[2rem] border border-emerald-950/10 bg-gradient-to-br from-[#163b27] via-[#1d492f] to-[#2a6140] text-white shadow-[0_30px_70px_-35px_rgba(22,59,39,0.75)]">
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1.4fr_1fr] lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur">
              <Sparkles className="h-4 w-4" />
              {isArabic ? 'مركز إقرار ضريبة القيمة المضافة' : 'VAT Return Control Center'}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">{isArabic ? 'VAT Returns' : 'VAT Returns'}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 lg:text-base">
              {isArabic
                ? 'لوحة احترافية لإدارة إقرار ضريبة القيمة المضافة اعتماداً على بيانات الفواتير والمصروفات مع إمكانية إضافة التعديلات اليدوية وحفظها لكل فترة.'
                : 'A premium workspace to prepare VAT returns from invoice and expense data, apply manual adjustments, and preserve each filing period professionally.'}
            </p>
          </div>
          <div className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">{isArabic ? 'الفترة' : 'Period'}</p>
              <p className="mt-2 text-lg font-semibold">{filters.startDate} - {filters.endDate}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">{isArabic ? 'آخر مزامنة' : 'Last Sync'}</p>
              <p className="mt-2 text-lg font-semibold">{data?.vatReturn?.lastImportedAt ? new Date(data.vatReturn.lastImportedAt).toLocaleString(isArabic ? 'ar-SA' : 'en-GB') : (isArabic ? 'غير متوفر' : 'Not synced yet')}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">{isArabic ? 'الحالة' : 'Status'}</p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
                <ShieldCheck className="h-4 w-4" />
                {data?.vatReturn?.status === 'submitted' ? (isArabic ? 'تم الإرسال' : 'Submitted') : (isArabic ? 'مسودة' : 'Draft')}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-5 sm:p-6">
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="label flex items-center gap-2"><Building2 className="h-4 w-4" />{isArabic ? 'موقع العمل' : 'Business Location'}</label>
            <select {...register('businessLocation')} className="select">
              <option value="all">{isArabic ? 'كل المواقع' : 'All locations'}</option>
              <option value="head-office">{isArabic ? 'المكتب الرئيسي' : 'Head Office'}</option>
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label flex items-center gap-2"><Calendar className="h-4 w-4" />{isArabic ? 'من تاريخ' : 'From Date'}</label>
              <input type="date" value={filters.startDate} onChange={(e) => setFilters((current) => ({ ...current, startDate: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label flex items-center gap-2"><Calendar className="h-4 w-4" />{isArabic ? 'إلى تاريخ' : 'To Date'}</label>
              <input type="date" value={filters.endDate} onChange={(e) => setFilters((current) => ({ ...current, endDate: e.target.value }))} className="input" />
            </div>
          </div>
          <div className="flex flex-col gap-3 self-end sm:flex-row xl:flex-col">
            <button type="button" onClick={() => refetch()} className="btn btn-secondary" disabled={isFetching}>
              {isFetching ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" /> : <RefreshCw className="h-4 w-4" />}
              {isArabic ? 'استيراد المبيعات والمشتريات' : 'Import Purchases and Sales'}
            </button>
            <button type="button" onClick={() => submitReturn('draft')} className="btn btn-primary" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
              {isArabic ? 'حفظ' : 'Save'}
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, index) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + (index * 0.04) }} className="card overflow-hidden p-0">
            <div className={`bg-gradient-to-r ${card.tone} p-5 text-white`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-white/80">{card.title}</p>
                  <p className="mt-3 text-2xl font-bold">{card.value}</p>
                </div>
                <div className="rounded-2xl bg-white/15 p-3">
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <form onSubmit={(event) => {
        event.preventDefault()
        submitReturn('draft')
      }} className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-sm dark:border-dark-700 dark:bg-dark-800">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-dark-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isArabic ? 'بيان ضريبة القيمة المضافة' : 'VAT Return Statement'}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'القيم المعروضة تشمل الأرقام المحسوبة من النظام بالإضافة إلى أي تعديلات يدوية تدخِلها هنا.' : 'Displayed values combine system-calculated amounts with your manual filing adjustments.'}</p>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[1080px]">
              <div className="grid grid-cols-[72px_minmax(340px,1fr)_180px_180px_180px] border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:border-dark-700 dark:bg-dark-900/50 dark:text-gray-400">
                <div>#</div>
                <div>{isArabic ? 'البند' : 'VAT Line Item'}</div>
                <div>{isArabic ? 'المبلغ (SAR)' : 'Amount (SAR)'}</div>
                <div>{isArabic ? 'التعديل (SAR)' : 'Adjustment (SAR)'}</div>
                <div>{isArabic ? 'قيمة الضريبة (SAR)' : 'VAT Amount (SAR)'}</div>
              </div>

              {rows.map((row) => {
                const line = statement?.[row.key] || { amount: 0, adjustment: 0, vatAmount: 0 }
                const savedManualLine = data?.vatReturn?.manual?.[row.manualKey] || { amount: 0, adjustment: 0, vatAmount: 0 }
                const baseAmount = row.manualKey ? toNumber((data?.vatReturn?.statement?.[row.key]?.amount || 0) - savedManualLine.amount) : toNumber(line.amount)
                const baseVat = row.manualKey ? toNumber((data?.vatReturn?.statement?.[row.key]?.vatAmount || 0) - savedManualLine.vatAmount) : toNumber(line.vatAmount)
                const editablePrefix = row.manualKey ? `manual.${row.manualKey}` : null
                const sectionTone = row.section === 'sales'
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/10'
                  : row.section === 'purchases'
                    ? 'bg-amber-50/70 dark:bg-amber-950/10'
                    : 'bg-slate-50/70 dark:bg-dark-900/30'

                return (
                  <div key={row.key} className={`grid grid-cols-[72px_minmax(340px,1fr)_180px_180px_180px] items-stretch border-b border-gray-100 px-5 py-3 last:border-b-0 dark:border-dark-700 ${sectionTone}`}>
                    <div className="flex items-center text-sm font-semibold text-gray-500 dark:text-gray-300">{row.number}</div>
                    <div className="pr-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{isArabic ? row.labelAr : row.labelEn}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{isArabic ? row.labelEn : row.labelAr}</p>
                      {row.manualKey ? (
                        <div className="mt-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-gray-600 shadow-sm ring-1 ring-gray-200 dark:bg-dark-700 dark:text-gray-200 dark:ring-dark-600">
                          {isArabic ? 'محسوب من النظام' : 'System Calculated'}: {formatMoney(baseAmount, language, currency)} / {formatMoney(baseVat, language, currency)}
                        </div>
                      ) : null}
                    </div>
                    <div className="px-2">
                      {row.vatOnly || row.readOnly ? (
                        <div className="flex h-full items-center rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 dark:border-dark-600 dark:bg-dark-700 dark:text-white">{row.vatOnly ? '—' : formatMoney(line.amount, language, currency)}</div>
                      ) : (
                        <input type="number" step="0.01" {...register(`${editablePrefix}.amount`, { valueAsNumber: true })} className="input h-12" />
                      )}
                    </div>
                    <div className="px-2">
                      {row.vatOnly || row.readOnly ? (
                        <div className="flex h-full items-center rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 dark:border-dark-600 dark:bg-dark-700 dark:text-white">{row.vatOnly ? '—' : formatMoney(line.adjustment, language, currency)}</div>
                      ) : (
                        <input type="number" step="0.01" {...register(`${editablePrefix}.adjustment`, { valueAsNumber: true })} className="input h-12" />
                      )}
                    </div>
                    <div className="px-2">
                      {row.readOnly ? (
                        <div className="flex h-full items-center rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 dark:border-dark-600 dark:bg-dark-700 dark:text-white">{formatMoney(line.vatAmount, language, currency)}</div>
                      ) : row.topLevelField ? (
                        <input type="number" step="0.01" {...register(row.topLevelField, { valueAsNumber: true })} className="input h-12" />
                      ) : row.vatOnly ? (
                        <div className="flex h-full items-center rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 dark:border-dark-600 dark:bg-dark-700 dark:text-white">{formatMoney(line.vatAmount, language, currency)}</div>
                      ) : (
                        <input type="number" step="0.01" {...register(`${editablePrefix}.vatAmount`, { valueAsNumber: true })} className="input h-12" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{isArabic ? 'ملاحظات الإقرار' : 'Return Notes'}</h3>
            <textarea {...register('notes')} rows={8} className="input mt-4 min-h-[220px]" placeholder={isArabic ? 'أضف ملاحظات داخلية أو تفاصيل توضيحية تخص هذه الفترة...' : 'Add internal filing notes or explanatory details for this period...'} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
              <p className="text-sm text-white/70">{isArabic ? 'صافي الإقرار' : 'Net Filing Position'}</p>
              <p className="mt-3 text-3xl font-bold">{formatMoney(statement.netVatDue?.vatAmount, language, currency)}</p>
              <p className="mt-3 text-sm text-white/75">{statement.netVatDue?.vatAmount >= 0
                ? (isArabic ? 'ضريبة مستحقة للدفع' : 'VAT due to be paid')
                : (isArabic ? 'رصيد قابل للاسترداد' : 'Recoverable VAT credit')}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 dark:border-dark-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'الموقع المحدد' : 'Selected Location'}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{watchedBusinessLocation === 'all' ? (isArabic ? 'كل المواقع' : 'All locations') : watchedBusinessLocation}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 dark:border-dark-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'الحالة الحالية' : 'Current Status'}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{watchedStatus === 'submitted' ? (isArabic ? 'تم الإرسال' : 'Submitted') : (isArabic ? 'مسودة' : 'Draft')}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => submitReturn('draft')} className="btn btn-secondary flex-1" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" /> : <Save className="h-4 w-4" />}
                {isArabic ? 'حفظ كمسودة' : 'Save Draft'}
              </button>
              <button type="button" onClick={() => submitReturn('submitted')} className="btn btn-primary flex-1" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <ShieldCheck className="h-4 w-4" />}
                {isArabic ? 'اعتماد الإقرار' : 'Submit Return'}
              </button>
            </div>
            <input type="hidden" {...register('status')} value={watchedStatus || 'draft'} readOnly />
          </motion.div>
        </div>
      </form>
    </div>
  )
}
