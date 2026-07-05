import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react'
import api from '../lib/api'
import { useDispatch } from 'react-redux'
import { getMe } from '../store/slices/authSlice'

export default function PaymentResult() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [status, setStatus] = useState('checking')
  const [message, setMessage] = useState('')

  const paymentId = searchParams.get('id')
  const paymentStatus = searchParams.get('status')

  useEffect(() => {
    const checkPayment = async () => {
      if (!paymentId) {
        setStatus('error')
        setMessage('No payment ID provided')
        return
      }

      if (paymentStatus === 'paid' || paymentStatus === 'successful') {
        try {
          await api.get(`/payments/${paymentId}`)
          await dispatch(getMe())
          setStatus('success')
        } catch {
          setStatus('success')
        }
        return
      }

      if (paymentStatus === 'failed' || paymentStatus === 'canceled') {
        setStatus('failed')
        setMessage(paymentStatus === 'failed' ? 'Payment failed. Please try again.' : 'Payment was canceled.')
        return
      }

      try {
        const { data } = await api.get(`/payments/${paymentId}`)
        if (data.status === 'paid') {
          await dispatch(getMe())
          setStatus('success')
        } else if (data.status === 'failed' || data.status === 'canceled') {
          setStatus('failed')
          setMessage('Payment was not completed.')
        } else {
          setStatus('pending')
        }
      } catch {
        setStatus('error')
        setMessage('Could not verify payment status.')
      }
    }

    checkPayment()
  }, [paymentId, paymentStatus, dispatch])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="p-8 text-center">
          {status === 'checking' && (
            <>
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-emerald-500" />
              <h2 className="text-xl font-bold text-slate-800">Verifying Payment...</h2>
              <p className="mt-2 text-sm text-slate-500">Please wait while we confirm your payment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Payment Successful!</h2>
              <p className="mt-2 text-sm text-slate-500">
                Your account has been upgraded. You now have full access to all features.
              </p>
              <button
                onClick={() => navigate('/app/dashboard')}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-600"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Payment Failed</h2>
              <p className="mt-2 text-sm text-slate-500">{message}</p>
              <button
                onClick={() => navigate('/app/dashboard')}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-300"
              >
                Back to Dashboard
              </button>
            </>
          )}

          {(status === 'error' || status === 'pending') && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <XCircle className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                {status === 'error' ? 'Error' : 'Payment Pending'}
              </h2>
              <p className="mt-2 text-sm text-slate-500">{message || 'Your payment is being processed.'}</p>
              <button
                onClick={() => navigate('/app/dashboard')}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-300"
              >
                Back to Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
