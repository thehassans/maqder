import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, CheckCircle2, XCircle, Loader2, X, RefreshCw } from 'lucide-react'
import api from '../../lib/api'

/**
 * Drives a card payment on the configured POS terminal:
 *  1. POST /api/pos/payments  -> creates the payment on the terminal
 *  2. Poll  /api/pos/payments/:id until a final status is reached
 *  3. On approval, calls onApproved(payment) so the caller can complete the order
 *
 * Props:
 *  - open: boolean
 *  - amount: number
 *  - currency?: string
 *  - source/orderType/orderNumber?: metadata
 *  - onApproved(payment): called when the terminal approves the card
 *  - onClose(): close without completing
 */
export default function CardPaymentModal({
  open,
  amount,
  currency = 'SAR',
  source = 'pos',
  orderType = '',
  orderNumber = '',
  onApproved,
  onClose,
}) {
  const { language } = useSelector((state) => state.ui)
  const isRtl = language === 'ar'
  const [payment, setPayment] = useState(null)
  const [status, setStatus] = useState('idle') // idle | starting | processing | approved | declined | cancelled | failed | expired | error
  const [error, setError] = useState('')
  const [simulation, setSimulation] = useState(false)
  const pollRef = useRef(null)
  const approvedFiredRef = useRef(false)

  const clearPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const startPayment = async () => {
    setError('')
    setStatus('starting')
    approvedFiredRef.current = false
    try {
      const { data } = await api.post('/pos/payments', { amount, currency, source, orderType, orderNumber })
      setPayment(data)
      setSimulation(Boolean(data.simulation))
      setStatus(data.status === 'approved' ? 'approved' : 'processing')
    } catch (err) {
      setStatus('error')
      setError(err.response?.data?.error || (isRtl ? 'تعذر بدء الدفع' : 'Could not start payment'))
    }
  }

  // Initiate when opened.
  useEffect(() => {
    if (open) {
      startPayment()
    } else {
      clearPolling()
      setPayment(null)
      setStatus('idle')
      setError('')
    }
    return clearPolling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Poll while processing.
  useEffect(() => {
    clearPolling()
    if (status !== 'processing' || !payment?._id) return

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/pos/payments/${payment._id}`)
        setPayment(data)
        if (['approved', 'declined', 'cancelled', 'failed', 'expired'].includes(data.status)) {
          setStatus(data.status)
          clearPolling()
        }
      } catch {
        // transient errors ignored; keep polling until timeout
      }
    }, 2000)

    return clearPolling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, payment?._id])

  // Fire approval callback once.
  useEffect(() => {
    if (status === 'approved' && payment && !approvedFiredRef.current) {
      approvedFiredRef.current = true
      const timer = setTimeout(() => onApproved?.(payment), 900)
      return () => clearTimeout(timer)
    }
  }, [status, payment, onApproved])

  const handleCancel = async () => {
    clearPolling()
    try {
      if (payment?._id && ['processing', 'starting'].includes(status)) {
        await api.post(`/pos/payments/${payment._id}/cancel`)
      }
    } catch {
      // ignore
    }
    onClose?.()
  }

  if (!open) return null

  const isWaiting = status === 'starting' || status === 'processing'
  const isFailure = ['declined', 'cancelled', 'failed', 'expired', 'error'].includes(status)

  const statusText = {
    starting: isRtl ? 'جارٍ إرسال المبلغ إلى الجهاز...' : 'Sending amount to terminal...',
    processing: isRtl ? 'في انتظار تمرير البطاقة على الجهاز...' : 'Waiting for card on the terminal...',
    approved: isRtl ? 'تمت الموافقة على الدفع' : 'Payment approved',
    declined: isRtl ? 'تم رفض البطاقة' : 'Card declined',
    cancelled: isRtl ? 'تم إلغاء الدفع' : 'Payment cancelled',
    failed: isRtl ? 'فشل الدفع' : 'Payment failed',
    expired: isRtl ? 'انتهت مهلة الدفع' : 'Payment timed out',
    error: error,
  }[status] || ''

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-white dark:bg-dark-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                <CreditCard className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {isRtl ? 'الدفع بالبطاقة' : 'Card Payment'}
              </h3>
            </div>
            <button onClick={handleCancel} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-8 flex flex-col items-center text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">{isRtl ? 'المبلغ المطلوب' : 'Amount due'}</div>
            <div className="text-4xl font-black text-gray-900 dark:text-white mt-1">
              {currency} {Number(amount).toFixed(2)}
            </div>

            <div className="my-8">
              {isWaiting && (
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-primary-100 dark:border-primary-900/40 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
                  </div>
                </div>
              )}
              {status === 'approved' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle2 className="w-24 h-24 text-green-500" />
                </motion.div>
              )}
              {isFailure && <XCircle className="w-24 h-24 text-red-500" />}
            </div>

            <p className={`text-base font-semibold ${
              status === 'approved' ? 'text-green-600' : isFailure ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'
            }`}>
              {statusText}
            </p>

            {simulation && isWaiting && (
              <p className="mt-2 text-xs text-amber-600">
                {isRtl ? 'وضع المحاكاة: ستتم الموافقة تلقائياً.' : 'Simulation mode: payment will auto-approve.'}
              </p>
            )}

            {payment?.approvalCode && status === 'approved' && (
              <p className="mt-2 text-xs text-gray-500">
                {isRtl ? 'رمز الموافقة' : 'Approval code'}: {payment.approvalCode}
                {payment.cardLast4 ? ` • ${payment.cardScheme} ****${payment.cardLast4}` : ''}
              </p>
            )}
          </div>

          <div className="p-5 border-t border-gray-100 dark:border-dark-700 flex gap-3">
            {isWaiting && (
              <button onClick={handleCancel} className="flex-1 btn btn-secondary">
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
            )}
            {isFailure && (
              <>
                <button onClick={handleCancel} className="flex-1 btn btn-secondary">
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
                <button onClick={startPayment} className="flex-1 btn btn-primary">
                  <RefreshCw className="w-4 h-4" />
                  {isRtl ? 'إعادة المحاولة' : 'Retry'}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
