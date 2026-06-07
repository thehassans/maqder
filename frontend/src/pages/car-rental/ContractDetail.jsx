import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Car, User, FileText, DollarSign, ArrowLeft, ClipboardCheck, QrCode, AlertTriangle, Fuel, Gauge, Calendar, Clock, Shield, ChevronRight, ExternalLink } from 'lucide-react'
import api from '../../lib/api'

const statusConfig = {
  OPEN:      { label: 'Open',      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',       dot: 'bg-blue-500' },
  CLOSED:    { label: 'Closed',    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400',           dot: 'bg-gray-400' },
}

const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50 dark:border-dark-700">
      <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
      </div>
      <h3 className="font-bold text-sm text-gray-900 dark:text-white">{title}</h3>
    </div>
    <div className="p-5 space-y-0">{children}</div>
  </div>
)

const DetailRow = ({ label, value, accent }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-gray-50 dark:border-dark-700 last:border-0">
    <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[140px]">{label}</span>
    <span className={`text-sm font-semibold text-right ${accent ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>{value ?? '—'}</span>
  </div>
)

const FinanceRow = ({ label, value, highlight, negative }) => (
  <div className={`flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-dark-700 last:border-0 ${highlight ? 'font-bold' : ''}`}>
    <span className={`text-sm ${highlight ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{label}</span>
    <span className={`text-sm font-semibold tabular-nums ${highlight ? 'text-base text-gray-900 dark:text-white' : negative ? 'text-emerald-600 dark:text-emerald-400' : value > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
      {value > 0 ? '+' : ''}{typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value} SAR
    </span>
  </div>
)

const FuelBar = ({ level }) => {
  const levels = ['empty','quarter','half','three_quarters','full']
  const labels = { empty: 'Empty', quarter: '¼', half: '½', three_quarters: '¾', full: 'Full' }
  const idx = levels.indexOf(level)
  const pct = idx >= 0 ? (idx / (levels.length - 1)) * 100 : 100
  const color = pct > 60 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-400' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-10 text-right">{labels[level] || level}</span>
    </div>
  )
}

export default function ContractDetail() {
  const navigate     = useNavigate()
  const { id }       = useParams()
  const { language } = useSelector(s => s.ui)
  const isAr  = language === 'ar'
  const t     = (en, ar) => isAr ? ar : en

  const [contract,   setContract]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [showQr,     setShowQr]     = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error,      setError]      = useState('')

  const fetchContract = useCallback(async () => {
    try {
      const { data } = await api.get(`/rental/contracts/${id}`)
      setContract(data)
    } catch (_) { setError(t('Contract not found', 'العقد غير موجود')) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchContract() }, [fetchContract])

  const handleCancel = async () => {
    if (!window.confirm(t('Cancel this contract?', 'إلغاء هذا العقد؟'))) return
    try {
      setCancelling(true)
      const reason = window.prompt(t('Reason for cancellation:', 'سبب الإلغاء:')) || ''
      await api.post(`/rental/contracts/${id}/cancel`, { reason })
      fetchContract()
    } catch (e) { setError(e.response?.data?.error || t('Cancel failed', 'فشل الإلغاء')) }
    finally { setCancelling(false) }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
      <div className="h-10 w-64 bg-gray-200 dark:bg-dark-600 rounded-xl" />
      <div className="grid md:grid-cols-2 gap-5">
        <div className="h-64 bg-gray-200 dark:bg-dark-600 rounded-2xl" />
        <div className="h-64 bg-gray-200 dark:bg-dark-600 rounded-2xl" />
      </div>
    </div>
  )

  if (error) return (
    <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
    </div>
  )
  if (!contract) return null

  const { car, customer } = contract
  const isClosed   = contract.status === 'CLOSED'
  const isOpen     = contract.status === 'OPEN'
  const sc         = statusConfig[contract.status] || statusConfig.OPEN
  const daysRented = isClosed ? contract.rentedDays : Math.max(1, Math.ceil((new Date() - new Date(contract.startDateTime)) / 86400000))

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-dark-600 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-dark-700 transition-all mt-0.5 flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">#{contract.contractNumber}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${sc.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {t(sc.label, sc.label)}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {new Date(contract.startDateTime).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}{daysRented} {t('day(s)', 'يوم')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isClosed && contract.zatcaQrCode && (
            <button onClick={() => setShowQr(s => !s)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:block">ZATCA QR</span>
            </button>
          )}
          {isOpen && (
            <>
              <button onClick={() => navigate(`/app/rental/contracts/${id}/checkin`)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all">
                <ClipboardCheck className="w-4 h-4" />
                {t('Check-In', 'إرجاع')}
              </button>
              <button onClick={handleCancel} disabled={cancelling}
                className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                {t('Cancel', 'إلغاء')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── ZATCA QR ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showQr && contract.zatcaQrCode && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t('ZATCA Phase 2 Invoice QR', 'رمز فاتورة ZATCA')}</h3>
            </div>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(contract.zatcaQrCode)}&size=200x200`}
              alt="ZATCA QR" className="w-44 h-44 rounded-xl border border-gray-200 dark:border-dark-700" />
            <p className="text-xs text-gray-400 break-all max-w-sm text-center font-mono">{contract.zatcaQrCode.slice(0, 60)}…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats strip (closed) ────────────────────────────────────────────── */}
      {isClosed && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('Days Rented', 'أيام'), value: contract.rentedDays, unit: 'days' },
            { label: t('KM Driven', 'كيلومتر'), value: (contract.odometerDelta || 0).toLocaleString(), unit: 'km' },
            { label: t('Grand Total', 'الإجمالي'), value: (contract.grandTotal || 0).toLocaleString(), unit: 'SAR' },
            { label: t('Balance', 'الرصيد'), value: Math.abs(contract.finalBalance || 0).toLocaleString(), unit: contract.finalBalance < 0 ? 'SAR refund' : 'SAR due', accent: true },
          ].map(({ label, value, unit, accent }) => (
            <div key={label} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">{label}</p>
              <p className={`text-xl font-black mt-1 ${accent ? (contract.finalBalance < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400') : 'text-gray-900 dark:text-white'}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{unit}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail grid ─────────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-4">

          {/* Vehicle */}
          <Section icon={Car} title={t('Vehicle', 'المركبة')}>
            <DetailRow label={t('Make / Model', 'الماركة')} value={`${car?.make} ${car?.model} ${car?.year || ''}`} />
            <DetailRow label={t('Plate', 'اللوحة')} value={`${car?.plateNumber} ${car?.plateEnglishLetters || ''}`} />
            <DetailRow label={t('Color', 'اللون')} value={car?.color} />
            <DetailRow label={t('Odometer Out', 'العداد خروج')} value={`${contract.outboundCondition?.odometer?.toLocaleString()} km`} />
            <div className="py-2.5 border-b border-gray-50 dark:border-dark-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">{t('Fuel Out', 'وقود خروج')}</p>
              <FuelBar level={contract.outboundCondition?.fuelLevel || 'full'} />
            </div>
            {contract.outboundCondition?.damageNotes && (
              <DetailRow label={t('Pre-existing Damage', 'أضرار مسبقة')} value={contract.outboundCondition.damageNotes} />
            )}
            {isClosed && (
              <>
                <DetailRow label={t('Odometer In', 'العداد دخول')} value={`${contract.inboundCondition?.odometer?.toLocaleString()} km`} />
                <div className="py-2.5">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">{t('Fuel In', 'وقود دخول')}</p>
                  <FuelBar level={contract.inboundCondition?.fuelLevel || 'full'} />
                </div>
              </>
            )}
          </Section>

          {/* Customer */}
          <Section icon={User} title={t('Customer', 'العميل')}>
            <DetailRow label={t('Name', 'الاسم')} value={customer?.fullName} />
            <DetailRow label={t('Mobile', 'الجوال')} value={customer?.mobile} />
            <DetailRow label={t('ID Number', 'الهوية')} value={customer?.idNumber} />
          </Section>
        </div>

        <div className="space-y-4">

          {/* Terms */}
          <Section icon={FileText} title={t('Rental Terms', 'شروط التأجير')}>
            <DetailRow label={t('Start', 'البدء')} value={new Date(contract.startDateTime).toLocaleString()} />
            <DetailRow label={t('Expected Return', 'إرجاع متوقع')} value={new Date(contract.expectedReturnDateTime).toLocaleString()} />
            {contract.actualReturnDateTime && <DetailRow label={t('Actual Return', 'إرجاع فعلي')} value={new Date(contract.actualReturnDateTime).toLocaleString()} />}
            <DetailRow label={t('Daily Rate', 'السعر اليومي')} value={`${contract.dailyRate} SAR`} accent />
            <DetailRow label={t('Allowed KM/Day', 'كم / يوم')} value={`${contract.allowedKmPerDay} km`} />
            <DetailRow label={t('Extra KM Rate', 'كم إضافي')} value={`${contract.perKmOverageRate || 0} SAR`} />
            <DetailRow label={t('Late Fee/Hour', 'تأخير / ساعة')} value={`${contract.hourlyLateRate || 0} SAR`} />
            <DetailRow label={t('Security Deposit', 'الضمان')} value={`${contract.securityDeposit || 0} SAR`} />
          </Section>

          {/* Settlement — only for closed */}
          {isClosed && (
            <Section icon={DollarSign} title={t('Settlement', 'التسوية')}>
              <FinanceRow label={`${t('Base Charge', 'الأساسي')} (${contract.rentedDays}d)`} value={contract.baseCharge} />
              {contract.extraMileageCharge > 0 && <FinanceRow label={`${t('Extra Mileage', 'زيادة مسافة')} (${contract.excessKm} km)`} value={contract.extraMileageCharge} />}
              {contract.latePenalty > 0         && <FinanceRow label={t('Late Penalty', 'غرامة تأخير')} value={contract.latePenalty} />}
              {contract.fuelPenalty > 0          && <FinanceRow label={t('Fuel Penalty', 'غرامة وقود')} value={contract.fuelPenalty} />}
              {contract.damageCharge > 0         && <FinanceRow label={t('Damage Charges', 'رسوم أضرار')} value={contract.damageCharge} />}
              {contract.discountAmount > 0        && <FinanceRow label={t('Discount', 'خصم')} value={-contract.discountAmount} negative />}
              <div className="my-1 h-px bg-gray-100 dark:bg-dark-700" />
              <FinanceRow label={t('Subtotal', 'المجموع قبل الضريبة')} value={contract.subtotal} />
              <FinanceRow label="VAT (15%)" value={contract.totalVat} />
              <FinanceRow label={t('Grand Total', 'الإجمالي')} value={contract.grandTotal} highlight />
              <div className={`mt-3 p-4 rounded-xl border ${contract.finalBalance < 0 ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800' : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'}`}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  {contract.finalBalance < 0 ? t('Refund to Customer', 'استرداد للعميل') : t('Balance Due', 'مبلغ مستحق')}
                </p>
                <p className={`text-3xl font-black mt-1 ${contract.finalBalance < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {Math.abs(contract.finalBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm font-medium">SAR</span>
                </p>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}
