import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Car, DollarSign, FileText, ChevronRight, Fuel } from 'lucide-react'
import api from '../../lib/api'
import DamageMatrix from './components/DamageMatrix'

const FUEL_LEVELS = ['empty', 'quarter', 'half', 'three_quarters', 'full']
const FUEL_ICONS  = { empty: '○○○○○', quarter: '●○○○○', half: '●●○○○', three_quarters: '●●●○○', full: '●●●●●' }
const FUEL_LABEL  = { empty: 'Empty', quarter: '¼ Tank', half: '½ Tank', three_quarters: '¾ Tank', full: 'Full' }

// ─── Fuel gauge bar ────────────────────────────────────────────────────────────
const FuelGauge = ({ level, label }) => {
  const idx   = FUEL_LEVELS.indexOf(level)
  const pct   = idx >= 0 ? (idx / (FUEL_LEVELS.length - 1)) * 100 : 100
  const color = pct > 60 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-400' : 'bg-red-500'
  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
          <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
        </div>
        <Fuel className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-14 text-right">{FUEL_LABEL[level] || level}</span>
      </div>
    </div>
  )
}

// ─── Settlement row ────────────────────────────────────────────────────────────
const Row = ({ label, value, highlight, sub }) => (
  <div className={`flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-dark-700 last:border-0 ${highlight ? '' : ''}`}>
    <div>
      <span className={`text-sm ${highlight ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{label}</span>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
    <span className={`text-sm font-bold tabular-nums ${
      highlight ? 'text-gray-900 dark:text-white text-base' :
      value < 0 ? 'text-emerald-600 dark:text-emerald-400' :
      value > 0 ? 'text-red-600 dark:text-red-400' :
      'text-gray-500 dark:text-gray-400'
    }`}>
      {value > 0 ? '+' : ''}{typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value} SAR
    </span>
  </div>
)

export default function CheckinPOS() {
  const navigate     = useNavigate()
  const { id }       = useParams()
  const { language } = useSelector(s => s.ui)
  const isAr  = language === 'ar'
  const t     = (en, ar) => isAr ? ar : en

  const [contract,   setContract]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [settlement, setSettlement] = useState(null)
  const [invoiceId,  setInvoiceId]  = useState(null)
  const [invoiceNumber, setInvoiceNumber] = useState(null)
  const [error,      setError]      = useState('')

  const [form, setForm] = useState({
    odometerIn: '', fuelLevelIn: 'full',
    actualReturnDateTime: new Date().toISOString().slice(0, 16),
    damageNotes: '', damagePins: [], damageCharge: 0, discountAmount: 0, discountReason: '',
  })
  const [preview, setPreview] = useState(null)

  const fetchContract = useCallback(async () => {
    try {
      const { data } = await api.get(`/rental/contracts/${id}`)
      setContract(data)
      setForm(f => ({ ...f, odometerIn: data.car?.currentOdometer || data.outboundCondition?.odometer || '', fuelLevelIn: data.outboundCondition?.fuelLevel || 'full' }))
    } catch (_) { setError(t('Contract not found', 'العقد غير موجود')) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchContract() }, [fetchContract])

  // Live preview
  useEffect(() => {
    if (!contract || !form.odometerIn || !form.actualReturnDateTime) return
    const start = new Date(contract.startDateTime)
    const ret   = new Date(form.actualReturnDateTime)
    const msPerDay = 86400000
    const rentedDays = Math.max(1, Math.ceil((ret - start) / msPerDay))
    const baseCharge = contract.dailyRate * rentedDays
    const odomOut    = contract.outboundCondition?.odometer || 0
    const actualKm   = Math.max(0, parseFloat(form.odometerIn) - odomOut)
    const allowedKm  = contract.allowedKmPerDay * rentedDays
    const excessKm   = Math.max(0, actualKm - allowedKm)
    const extraMileage = excessKm * (contract.perKmOverageRate || 0)
    let latePenalty = 0
    const expected = new Date(contract.expectedReturnDateTime)
    if (ret > expected && contract.hourlyLateRate > 0) {
      latePenalty = Math.ceil((ret - expected) / 3600000) * contract.hourlyLateRate
    }
    const FVAL = { empty: 0, quarter: 0.25, half: 0.5, three_quarters: 0.75, full: 1 }
    const levelDiff = (FVAL[contract.outboundCondition?.fuelLevel || 'full'] || 1) - (FVAL[form.fuelLevelIn] || 1)
    const fuelPenalty = levelDiff > 0 ? Math.round(levelDiff / 0.25) * 50 : 0
    const dmg = parseFloat(form.damageCharge) || 0
    const discount = parseFloat(form.discountAmount) || 0
    const subtotal = baseCharge + extraMileage + latePenalty + fuelPenalty + dmg - discount
    const totalVat  = Math.round(subtotal * 0.15 * 100) / 100
    const grandTotal = Math.round((subtotal + totalVat) * 100) / 100
    const finalBalance = Math.round((grandTotal - (contract.securityDeposit || 0)) * 100) / 100
    setPreview({ rentedDays, actualKm, allowedKm, excessKm, baseCharge, extraMileage, latePenalty, fuelPenalty, dmg, discount, subtotal, totalVat, grandTotal, finalBalance })
  }, [form, contract])

  const handleCheckin = async () => {
    if (!form.odometerIn) return setError(t('Odometer reading is required', 'قراءة العداد مطلوبة'))
    try {
      setSubmitting(true); setError('')
      const { data } = await api.post(`/rental/contracts/${id}/checkin`, form)
      setSettlement(data.settlement)
      setContract(data.contract)
      if (data.invoiceId)     setInvoiceId(data.invoiceId)
      if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber)
    } catch (e) { setError(e.response?.data?.error || t('Check-in failed', 'فشل الإرجاع')) }
    finally { setSubmitting(false) }
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-400 transition-all"
  const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5"

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 w-56 bg-gray-200 dark:bg-dark-600 rounded-xl" />
      <div className="h-64 bg-gray-200 dark:bg-dark-600 rounded-2xl" />
    </div>
  )

  // ── Settlement receipt view ────────────────────────────────────────────────
  if (settlement) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto space-y-5">

        {/* Success header */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
            className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </motion.div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t('Check-In Complete', 'تم الإرجاع')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">#{contract?.contractNumber}</p>
          {invoiceNumber && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">{t('Invoice', 'فاتورة')}: {invoiceNumber}</p>
          )}
        </div>

        {/* Settlement breakdown */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 text-base">{t('Final Settlement', 'التسوية النهائية')}</h2>
          <Row label={`${t('Base Charge', 'الإيجار الأساسي')} (${settlement.rentedDays}d × ${contract?.dailyRate} SAR)`} value={settlement.baseCharge} />
          {settlement.extraMileageCharge > 0 && <Row label={t('Extra KM', 'كم إضافي')} sub={`${settlement.excessKm} km overage`} value={settlement.extraMileageCharge} />}
          {settlement.latePenalty > 0        && <Row label={t('Late Return', 'تأخير')} value={settlement.latePenalty} />}
          {settlement.fuelPenalty > 0        && <Row label={t('Fuel Penalty', 'غرامة وقود')} value={settlement.fuelPenalty} />}
          {settlement.damageCharge > 0       && <Row label={t('Damage Charges', 'رسوم أضرار')} value={settlement.damageCharge} />}
          {settlement.discountAmount > 0     && <Row label={t('Discount', 'خصم')} value={-settlement.discountAmount} />}
          <div className="my-2 h-px bg-gray-100 dark:bg-dark-700" />
          <Row label={t('Subtotal', 'المجموع')} value={settlement.subtotal} />
          <Row label="VAT 15%" value={settlement.totalVat} />
          <Row label={t('Grand Total', 'الإجمالي')} value={settlement.grandTotal} highlight />
          <Row label={`− ${t('Security Deposit', 'الضمان')}`} value={-settlement.securityDeposit} />

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className={`mt-4 p-5 rounded-2xl border-2 text-center
              ${settlement.isRefund
                ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-700'
                : 'border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-700'}`}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2 text-gray-500 dark:text-gray-400">
              {settlement.isRefund ? t('Refund Due to Customer', 'مبلغ الاسترداد') : t('Balance Due from Customer', 'المبلغ المستحق')}
            </p>
            <p className={`text-5xl font-black ${settlement.isRefund ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {Math.abs(settlement.finalBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">SAR</p>
          </motion.div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate(`/app/rental/contracts/${contract._id}`)}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-dark-600 font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
            {t('View Contract', 'عرض العقد')}
          </button>
          {invoiceId && (
            <button onClick={() => navigate(`/app/rental/invoices/${invoiceId}`)}
              className="flex-1 py-3 rounded-xl border border-emerald-300 dark:border-emerald-700 font-semibold text-sm text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center justify-center gap-2 transition-colors">
              <FileText className="w-4 h-4" />
              {t('View Invoice', 'عرض الفاتورة')}
            </button>
          )}
          <button onClick={() => navigate('/app/rental/active')}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all">
            {t('Active Rentals', 'التأجيرات النشطة')}
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t('Vehicle Return', 'إرجاع المركبة')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">#{contract?.contractNumber}</p>
      </div>

      {/* Contract summary card */}
      {contract && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Car className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 dark:text-white">{contract.car?.make} {contract.car?.model} · <span className="font-mono text-gray-500">{contract.car?.plateNumber}</span></p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{contract.customer?.fullName} · {contract.customer?.mobile}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('Expected Return', 'إرجاع متوقع')}</p>
              <p className={`text-sm font-bold ${new Date() > new Date(contract.expectedReturnDateTime) ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {new Date(contract.expectedReturnDateTime).toLocaleString()}
              </p>
              {new Date() > new Date(contract.expectedReturnDateTime) && (
                <span className="text-xs text-red-500 font-bold">⚠ {t('OVERDUE', 'متأخر')}</span>
              )}
            </div>
          </div>
          {/* Out condition summary */}
          <div className="mt-4 pt-4 border-t border-gray-50 dark:border-dark-700 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold">{t('Out Odometer', 'العداد')}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{contract.outboundCondition?.odometer?.toLocaleString()} km</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold">{t('Fuel Out', 'الوقود')}</p>
              <div className="mt-1">
                <FuelGauge level={contract.outboundCondition?.fuelLevel || 'full'} />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold">{t('Daily Rate', 'السعر اليومي')}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{contract.dailyRate} SAR</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
        </motion.div>
      )}

      {/* Main grid: input + live preview */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* Input panel */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5 space-y-5">
          <h2 className="font-bold text-gray-900 dark:text-white">{t('Inbound Condition', 'حالة الإرجاع')}</h2>

          <div>
            <label className={labelCls}>{t('Actual Return Date/Time', 'وقت الإرجاع')}</label>
            <input type="datetime-local" value={form.actualReturnDateTime} onChange={e => setForm(f => ({ ...f, actualReturnDateTime: e.target.value }))} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>{t('Odometer In (km)', 'العداد')}</label>
            <input type="number" value={form.odometerIn} onChange={e => setForm(f => ({ ...f, odometerIn: e.target.value }))} placeholder="0" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>{t('Fuel Level In', 'مستوى الوقود')}</label>
            <select value={form.fuelLevelIn} onChange={e => setForm(f => ({ ...f, fuelLevelIn: e.target.value }))} className={inputCls}>
              {FUEL_LEVELS.map(f => <option key={f} value={f}>{FUEL_ICONS[f]} {FUEL_LABEL[f]}</option>)}
            </select>
            <div className="mt-2">
              <FuelGauge level={form.fuelLevelIn} />
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('New Damage', 'أضرار جديدة')}</label>
            <div className="rounded-xl border border-gray-200 dark:border-dark-600 p-4 mb-2 bg-gray-50 dark:bg-dark-700/50">
              <DamageMatrix initialPins={form.damagePins} onPinsChange={pins => setForm(f => ({ ...f, damagePins: pins }))} />
            </div>
            <textarea value={form.damageNotes} onChange={e => setForm(f => ({ ...f, damageNotes: e.target.value }))} rows={2}
              placeholder={t('Damage notes…', 'ملاحظات…')}
              className={`${inputCls} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('Damage Charge (SAR)', 'رسوم الأضرار')}</label>
              <input type="number" value={form.damageCharge} onChange={e => setForm(f => ({ ...f, damageCharge: e.target.value }))} placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('Discount (SAR)', 'خصم')}</label>
              <input type="number" value={form.discountAmount} onChange={e => setForm(f => ({ ...f, discountAmount: e.target.value }))} placeholder="0" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Live preview panel */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5 space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <h2 className="font-bold text-gray-900 dark:text-white">{t('Live Preview', 'معاينة حية')}</h2>
          </div>
          {preview ? (
            <>
              <Row label={`${t('Base', 'أساسي')} (${preview.rentedDays}d × ${contract?.dailyRate} SAR)`} value={preview.baseCharge} />
              <Row label={t('Mileage', 'مسافة')} sub={`${preview.actualKm} km driven · ${preview.allowedKm} allowed`} value={preview.extraMileage} />
              {preview.latePenalty > 0  && <Row label={t('Late Return', 'تأخير')} value={preview.latePenalty} />}
              {preview.fuelPenalty > 0  && <Row label={t('Fuel Penalty', 'وقود')} value={preview.fuelPenalty} />}
              {preview.dmg > 0          && <Row label={t('Damage', 'أضرار')} value={preview.dmg} />}
              {preview.discount > 0     && <Row label={t('Discount', 'خصم')} value={-preview.discount} />}
              <div className="my-2 h-px bg-gray-100 dark:bg-dark-700" />
              <Row label={t('Subtotal', 'المجموع')} value={preview.subtotal} />
              <Row label="VAT 15%" value={preview.totalVat} />
              <Row label={t('Grand Total', 'الإجمالي')} value={preview.grandTotal} highlight />
              <Row label={`− ${t('Deposit', 'الضمان')}`} value={-(contract?.securityDeposit || 0)} />
              <motion.div
                key={preview.finalBalance}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-3 p-4 rounded-xl border text-center ${preview.finalBalance < 0 ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/10 dark:border-emerald-700' : 'bg-red-50 border-red-300 dark:bg-red-900/10 dark:border-red-700'}`}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                  {preview.finalBalance < 0 ? t('REFUND', 'استرداد') : t('DUE', 'مستحق')}
                </p>
                <p className={`text-3xl font-black tabular-nums ${preview.finalBalance < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {Math.abs(preview.finalBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs font-semibold text-gray-400 mt-0.5">SAR</p>
              </motion.div>
            </>
          ) : (
            <div className="py-12 flex flex-col items-center gap-3 text-gray-400">
              <DollarSign className="w-8 h-8 opacity-30" />
              <p className="text-sm text-center">{t('Enter odometer & return time to see live settlement', 'أدخل العداد ووقت الإرجاع')}</p>
            </div>
          )}
        </div>
      </div>

      <button onClick={handleCheckin} disabled={submitting || !form.odometerIn}
        className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-black text-base shadow-xl shadow-emerald-500/30 transition-all active:scale-[0.98]">
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            {t('Processing…', 'جاري المعالجة…')}
          </span>
        ) : `✓ ${t('Complete Check-In', 'إتمام الإرجاع')}`}
      </button>
    </div>
  )
}
