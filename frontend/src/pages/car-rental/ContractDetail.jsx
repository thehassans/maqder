import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Car, User, FileText, DollarSign, ArrowLeft, ClipboardCheck, QrCode, AlertTriangle } from 'lucide-react'
import api from '../../lib/api'

const Badge = ({ children, color }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>{children}</span>
)

const DetailRow = ({ label, value }) => (
  <div className="flex items-start justify-between py-2 border-b border-gray-50 dark:border-dark-700 last:border-0">
    <span className="text-sm text-gray-500 dark:text-gray-400 min-w-36">{label}</span>
    <span className="text-sm font-semibold text-gray-900 dark:text-white text-right">{value ?? '—'}</span>
  </div>
)

export default function ContractDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { language } = useSelector(s => s.ui)
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en

  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showQr, setShowQr] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')

  const fetchContract = useCallback(async () => {
    try {
      const { data } = await api.get(`/rental/contracts/${id}`)
      setContract(data)
    } catch (_) { setError(t('Contract not found', 'العقد غير موجود')) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchContract() }, [fetchContract])

  const handleCancel = async () => {
    if (!window.confirm(t('Cancel this contract?', 'هل تريد إلغاء هذا العقد؟'))) return
    try {
      setCancelling(true)
      const reason = window.prompt(t('Reason for cancellation:', 'سبب الإلغاء:')) || ''
      await api.post(`/rental/contracts/${id}/cancel`, { reason })
      fetchContract()
    } catch (e) { setError(e.response?.data?.error || t('Cancel failed', 'فشل الإلغاء')) }
    finally { setCancelling(false) }
  }

  const statusConfig = {
    OPEN: { label: t('Open', 'مفتوح'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    CLOSED: { label: t('Closed', 'مغلق'), color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
    CANCELLED: { label: t('Cancelled', 'ملغي'), color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-gray-200 dark:bg-dark-600 rounded" /><div className="h-96 bg-gray-200 dark:bg-dark-600 rounded-2xl" /></div>
  if (error) return <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">{error}</div>
  if (!contract) return null

  const { car, customer } = contract
  const isClosed = contract.status === 'CLOSED'
  const isOpen = contract.status === 'OPEN'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">#{contract.contractNumber}</h1>
            <Badge color={statusConfig[contract.status]?.color}>{statusConfig[contract.status]?.label}</Badge>
          </div>
          <p className="text-sm text-gray-500">{new Date(contract.startDateTime).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          {isClosed && contract.zatcaQrCode && (
            <button onClick={() => setShowQr(s => !s)} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300">
              <QrCode className="w-4 h-4" /> {t('ZATCA QR', 'رمز ZATCA')}
            </button>
          )}
          {isOpen && (
            <>
              <button onClick={() => navigate(`/app/rental/contracts/${id}/checkin`)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/30">
                <ClipboardCheck className="w-4 h-4" /> {t('Check-In', 'إرجاع')}
              </button>
              <button onClick={handleCancel} disabled={cancelling} className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20">
                {t('Cancel', 'إلغاء')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ZATCA QR */}
      {showQr && contract.zatcaQrCode && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6 flex flex-col items-center gap-4">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><QrCode className="w-5 h-5 text-amber-500" /> {t('ZATCA Phase 2 Invoice QR', 'رمز فاتورة ZATCA المرحلة 2')}</h3>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(contract.zatcaQrCode)}&size=200x200`} alt="ZATCA QR" className="w-48 h-48 rounded-xl border border-gray-200 dark:border-dark-700" />
          <p className="text-xs text-gray-400 break-all max-w-sm text-center font-mono">{contract.zatcaQrCode.slice(0, 60)}...</p>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Car & Customer */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3"><Car className="w-4 h-4 text-amber-500" /> {t('Vehicle', 'المركبة')}</h3>
            <DetailRow label={t('Car', 'السيارة')} value={`${car?.make} ${car?.model} ${car?.year}`} />
            <DetailRow label={t('Plate', 'اللوحة')} value={`${car?.plateNumber} ${car?.plateEnglishLetters || ''}`} />
            <DetailRow label={t('Odometer Out', 'العداد عند الخروج')} value={`${contract.outboundCondition?.odometer?.toLocaleString()} km`} />
            <DetailRow label={t('Fuel Out', 'الوقود عند الخروج')} value={contract.outboundCondition?.fuelLevel?.replace('_', ' ')} />
            {contract.outboundCondition?.damageNotes && <DetailRow label={t('Pre-existing Damage', 'أضرار مسبقة')} value={contract.outboundCondition.damageNotes} />}
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3"><User className="w-4 h-4 text-amber-500" /> {t('Customer', 'العميل')}</h3>
            <DetailRow label={t('Name', 'الاسم')} value={customer?.fullName} />
            <DetailRow label={t('Mobile', 'الجوال')} value={customer?.mobile} />
            <DetailRow label={t('ID Number', 'رقم الهوية')} value={customer?.idNumber} />
          </div>
        </div>

        {/* Terms & Settlement */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-amber-500" /> {t('Terms', 'الشروط')}</h3>
            <DetailRow label={t('Start', 'البدء')} value={new Date(contract.startDateTime).toLocaleString()} />
            <DetailRow label={t('Expected Return', 'الإرجاع المتوقع')} value={new Date(contract.expectedReturnDateTime).toLocaleString()} />
            {contract.actualReturnDateTime && <DetailRow label={t('Actual Return', 'الإرجاع الفعلي')} value={new Date(contract.actualReturnDateTime).toLocaleString()} />}
            <DetailRow label={t('Daily Rate', 'السعر اليومي')} value={`${contract.dailyRate} SAR`} />
            <DetailRow label={t('Allowed KM/Day', 'KM مسموح')} value={`${contract.allowedKmPerDay} km`} />
            <DetailRow label={t('Per Extra KM', 'كم إضافي')} value={`${contract.perKmOverageRate || 0} SAR`} />
            <DetailRow label={t('Late Fee/Hour', 'تأخير/ساعة')} value={`${contract.hourlyLateRate || 0} SAR`} />
            <DetailRow label={t('Security Deposit', 'الضمان')} value={`${contract.securityDeposit || 0} SAR`} />
          </div>

          {isClosed && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3"><DollarSign className="w-4 h-4 text-amber-500" /> {t('Settlement', 'التسوية')}</h3>
              <DetailRow label={t('Rented Days', 'أيام التأجير')} value={contract.rentedDays} />
              <DetailRow label={t('Total KM', 'إجمالي المسافة')} value={`${contract.odometerDelta} km`} />
              <DetailRow label={t('Excess KM', 'كم إضافي')} value={`${contract.excessKm} km`} />
              <DetailRow label={t('Base Charge', 'الأساسي')} value={`${contract.baseCharge?.toLocaleString()} SAR`} />
              {contract.extraMileageCharge > 0 && <DetailRow label={t('Extra Mileage', 'زيادة مسافة')} value={`${contract.extraMileageCharge?.toLocaleString()} SAR`} />}
              {contract.latePenalty > 0 && <DetailRow label={t('Late Penalty', 'غرامة تأخير')} value={`${contract.latePenalty?.toLocaleString()} SAR`} />}
              {contract.fuelPenalty > 0 && <DetailRow label={t('Fuel Penalty', 'غرامة وقود')} value={`${contract.fuelPenalty?.toLocaleString()} SAR`} />}
              {contract.damageCharge > 0 && <DetailRow label={t('Damage', 'أضرار')} value={`${contract.damageCharge?.toLocaleString()} SAR`} />}
              {contract.discountAmount > 0 && <DetailRow label={t('Discount', 'خصم')} value={`-${contract.discountAmount?.toLocaleString()} SAR`} />}
              <div className="border-t border-gray-200 dark:border-dark-600 mt-2 pt-2">
                <DetailRow label={t('Subtotal', 'المجموع')} value={`${contract.subtotal?.toLocaleString()} SAR`} />
                <DetailRow label="VAT (15%)" value={`${contract.totalVat?.toLocaleString()} SAR`} />
                <DetailRow label={t('Grand Total', 'الإجمالي الكلي')} value={`${contract.grandTotal?.toLocaleString()} SAR`} />
              </div>
              <div className={`mt-3 p-4 rounded-xl ${contract.finalBalance < 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'}`}>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{contract.finalBalance < 0 ? t('Refund to Customer', 'استرداد للعميل') : t('Balance Due', 'مبلغ مستحق')}</p>
                <p className={`text-3xl font-black ${contract.finalBalance < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {Math.abs(contract.finalBalance)?.toLocaleString(undefined, { maximumFractionDigits: 2 })} SAR
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
