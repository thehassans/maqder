import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Car, DollarSign } from 'lucide-react'
import api from '../../lib/api'

const FUEL_LEVELS = ['empty', 'quarter', 'half', 'three_quarters', 'full']
const FUEL_ICONS = { empty: '○○○○○', quarter: '●○○○○', half: '●●○○○', three_quarters: '●●●○○', full: '●●●●●' }

const SettlementRow = ({ label, value, highlight, negative }) => (
  <div className={`flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-700 last:border-0 ${highlight ? 'font-bold' : ''}`}>
    <span className={`text-sm ${highlight ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{label}</span>
    <span className={`text-sm font-semibold ${highlight ? 'text-xl text-gray-900 dark:text-white' : negative ? 'text-emerald-600 dark:text-emerald-400' : value > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
      {value > 0 ? '+' : ''}{value?.toLocaleString(undefined, { maximumFractionDigits: 2 })} SAR
    </span>
  </div>
)

export default function CheckinPOS() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { language } = useSelector(s => s.ui)
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en

  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [settlement, setSettlement] = useState(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    odometerIn: '', fuelLevelIn: 'full',
    actualReturnDateTime: new Date().toISOString().slice(0, 16),
    damageNotes: '', damageCharge: 0,
    discountAmount: 0, discountReason: '',
  })

  const [preview, setPreview] = useState(null)

  const fetchContract = useCallback(async () => {
    try {
      const { data } = await api.get(`/rental/contracts/${id}`)
      setContract(data)
      setForm(f => ({
        ...f,
        odometerIn: data.car?.currentOdometer || data.outboundCondition?.odometer || '',
        fuelLevelIn: data.outboundCondition?.fuelLevel || 'full',
      }))
    } catch (_) { setError(t('Contract not found', 'العقد غير موجود')) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchContract() }, [fetchContract])

  // Live preview calculation
  useEffect(() => {
    if (!contract || !form.odometerIn || !form.actualReturnDateTime) return

    const start = new Date(contract.startDateTime)
    const ret = new Date(form.actualReturnDateTime)
    const msPerDay = 1000 * 60 * 60 * 24
    const rentedDays = Math.max(1, Math.ceil((ret - start) / msPerDay))

    const baseCharge = contract.dailyRate * rentedDays

    const odomOut = contract.outboundCondition?.odometer || 0
    const actualKm = Math.max(0, parseFloat(form.odometerIn) - odomOut)
    const allowedKm = contract.allowedKmPerDay * rentedDays
    const excessKm = Math.max(0, actualKm - allowedKm)
    const extraMileage = excessKm * (contract.perKmOverageRate || 0)

    let latePenalty = 0
    const expected = new Date(contract.expectedReturnDateTime)
    if (ret > expected && contract.hourlyLateRate > 0) {
      const hoursLate = Math.ceil((ret - expected) / (1000 * 60 * 60))
      latePenalty = hoursLate * contract.hourlyLateRate
    }

    const FUEL_VALUES = { empty: 0, quarter: 0.25, half: 0.5, three_quarters: 0.75, full: 1 }
    const levelDiff = (FUEL_VALUES[contract.outboundCondition?.fuelLevel || 'full'] || 1) - (FUEL_VALUES[form.fuelLevelIn] || 1)
    const fuelPenalty = levelDiff > 0 ? Math.round(levelDiff / 0.25) * 50 : 0

    const dmg = parseFloat(form.damageCharge) || 0
    const discount = parseFloat(form.discountAmount) || 0
    const subtotal = baseCharge + extraMileage + latePenalty + fuelPenalty + dmg - discount
    const totalVat = Math.round(subtotal * 0.15 * 100) / 100
    const grandTotal = Math.round((subtotal + totalVat) * 100) / 100
    const finalBalance = Math.round((grandTotal - contract.securityDeposit) * 100) / 100

    setPreview({ rentedDays, actualKm, allowedKm, excessKm, baseCharge, extraMileage, latePenalty, fuelPenalty, dmg, discount, subtotal, totalVat, grandTotal, finalBalance })
  }, [form, contract])

  const handleCheckin = async () => {
    if (!form.odometerIn) return setError(t('Odometer reading is required', 'قراءة العداد مطلوبة'))
    try {
      setSubmitting(true); setError('')
      const { data } = await api.post(`/rental/contracts/${id}/checkin`, form)
      setSettlement(data.settlement)
      setContract(data.contract)
    } catch (e) { setError(e.response?.data?.error || t('Check-in failed', 'فشل الإرجاع')) }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-gray-200 dark:bg-dark-600 rounded" /><div className="h-96 bg-gray-200 dark:bg-dark-600 rounded-2xl" /></div>

  // Settlement view (after successful check-in)
  if (settlement) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t('Check-In Complete', 'تم الإرجاع')}</h1>
          <p className="text-gray-500">#{contract?.contractNumber}</p>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">{t('Final Settlement', 'التسوية النهائية')}</h2>
          <SettlementRow label={`${t('Base Charge', 'الإيجار الأساسي')} (${settlement.rentedDays} ${t('days', 'أيام')})`} value={settlement.baseCharge} />
          {settlement.extraMileageCharge > 0 && <SettlementRow label={`${t('Extra KM', 'كم إضافي')} (${settlement.excessKm} km)`} value={settlement.extraMileageCharge} />}
          {settlement.latePenalty > 0 && <SettlementRow label={t('Late Return Penalty', 'غرامة التأخير')} value={settlement.latePenalty} />}
          {settlement.fuelPenalty > 0 && <SettlementRow label={t('Fuel Penalty', 'غرامة الوقود')} value={settlement.fuelPenalty} />}
          {settlement.damageCharge > 0 && <SettlementRow label={t('Damage Charges', 'رسوم الأضرار')} value={settlement.damageCharge} />}
          {settlement.discountAmount > 0 && <SettlementRow label={t('Discount', 'خصم')} value={-settlement.discountAmount} />}
          <SettlementRow label={t('Subtotal', 'المجموع قبل الضريبة')} value={settlement.subtotal} />
          <SettlementRow label={t('VAT (15%)', 'ضريبة القيمة المضافة (15%)')} value={settlement.totalVat} />
          <SettlementRow label={t('Grand Total', 'الإجمالي الكلي')} value={settlement.grandTotal} highlight />
          <SettlementRow label={`${t('Security Deposit Paid', 'الضمان المدفوع')}`} value={-settlement.securityDeposit} />

          <div className={`mt-4 p-4 rounded-xl border-2 ${settlement.finalBalance < 0 ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-700' : 'border-red-400 bg-red-50 dark:bg-red-900/10 dark:border-red-700'}`}>
            <p className="text-sm font-bold text-gray-600 dark:text-gray-400">{settlement.isRefund ? t('Refund Due to Customer', 'مبلغ الاسترداد للعميل') : t('Balance Due from Customer', 'المبلغ المستحق من العميل')}</p>
            <p className={`text-4xl font-black ${settlement.isRefund ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {Math.abs(settlement.finalBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} SAR
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate(`/app/rental/contracts/${contract._id}`)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-dark-600 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">
            {t('View Contract', 'عرض العقد')}
          </button>
          <button onClick={() => navigate('/app/rental/active')} className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/30">
            {t('Back to Active Rentals', 'التأجيرات النشطة')}
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Vehicle Return / Check-In', 'إرجاع المركبة')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">#{contract?.contractNumber}</p>
      </div>

      {contract && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
              <Car className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{contract.car?.make} {contract.car?.model} · {contract.car?.plateNumber}</p>
              <p className="text-sm text-gray-500">{contract.customer?.fullName} · {contract.customer?.mobile}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-500">{t('Expected Return', 'الإرجاع المتوقع')}</p>
              <p className={`text-sm font-bold ${new Date() > new Date(contract.expectedReturnDateTime) ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {new Date(contract.expectedReturnDateTime).toLocaleString()}
                {new Date() > new Date(contract.expectedReturnDateTime) && <span className="ml-2 text-xs">⚠ {t('OVERDUE', 'متأخر')}</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5 space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-white">{t('Inbound Condition', 'حالة الإرجاع')}</h2>
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('Actual Return Date/Time', 'وقت الإرجاع الفعلي')}</label>
            <input type="datetime-local" value={form.actualReturnDateTime} onChange={e => setForm(f => ({ ...f, actualReturnDateTime: e.target.value }))}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('Odometer In (km)', 'العداد عند الإرجاع')}</label>
            <input type="number" value={form.odometerIn} onChange={e => setForm(f => ({ ...f, odometerIn: e.target.value }))}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('Fuel Level In', 'مستوى الوقود')}</label>
            <select value={form.fuelLevelIn} onChange={e => setForm(f => ({ ...f, fuelLevelIn: e.target.value }))}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
              {FUEL_LEVELS.map(f => <option key={f} value={f}>{FUEL_ICONS[f]} {f.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('New Damage Notes', 'ملاحظات الأضرار الجديدة')}</label>
            <textarea value={form.damageNotes} onChange={e => setForm(f => ({ ...f, damageNotes: e.target.value }))} rows={2}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('Damage Charge (SAR)', 'رسوم الأضرار')}</label>
              <input type="number" value={form.damageCharge} onChange={e => setForm(f => ({ ...f, damageCharge: e.target.value }))}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('Discount (SAR)', 'خصم')}</label>
              <input type="number" value={form.discountAmount} onChange={e => setForm(f => ({ ...f, discountAmount: e.target.value }))}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5 space-y-2">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" /> {t('Live Settlement Preview', 'معاينة التسوية')}
          </h2>
          {preview ? (
            <>
              <SettlementRow label={`${t('Base', 'الأساسي')} (${preview.rentedDays}d × ${contract?.dailyRate} SAR)`} value={preview.baseCharge} />
              <SettlementRow label={`${t('Mileage', 'المسافة')}: ${preview.actualKm} km (${preview.allowedKm} ${t('allowed', 'مسموح')})`} value={preview.extraMileage} />
              <SettlementRow label={t('Late Return', 'تأخير')} value={preview.latePenalty} />
              <SettlementRow label={t('Fuel Penalty', 'وقود')} value={preview.fuelPenalty} />
              {preview.dmg > 0 && <SettlementRow label={t('Damage', 'أضرار')} value={preview.dmg} />}
              {preview.discount > 0 && <SettlementRow label={t('Discount', 'خصم')} value={-preview.discount} />}
              <div className="border-t border-gray-200 dark:border-dark-600 my-2" />
              <SettlementRow label={t('Subtotal', 'المجموع')} value={preview.subtotal} />
              <SettlementRow label="VAT 15%" value={preview.totalVat} />
              <SettlementRow label={t('Grand Total', 'الإجمالي')} value={preview.grandTotal} highlight />
              <SettlementRow label={`- ${t('Deposit', 'الضمان')}`} value={-contract?.securityDeposit} />
              <div className={`mt-2 p-3 rounded-xl border ${preview.finalBalance < 0 ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/10 dark:border-emerald-700' : 'bg-red-50 border-red-300 dark:bg-red-900/10 dark:border-red-700'}`}>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{preview.finalBalance < 0 ? t('REFUND', 'استرداد') : t('DUE', 'مستحق')}</p>
                <p className={`text-2xl font-black ${preview.finalBalance < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {Math.abs(preview.finalBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} SAR
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">{t('Enter odometer & return time to preview', 'أدخل العداد ووقت الإرجاع لرؤية التسوية')}</p>
          )}
        </div>
      </div>

      <button onClick={handleCheckin} disabled={submitting || !form.odometerIn}
        className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-lg disabled:opacity-60 shadow-xl shadow-amber-500/30 transition-all">
        {submitting ? t('Processing...', 'جاري المعالجة...') : t('✓ Complete Check-In', '✓ إتمام الإرجاع')}
      </button>
    </div>
  )
}
