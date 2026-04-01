import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Download, Send, CheckCircle, Clock, QrCode, Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import InvoiceLivePreview from '../../components/invoices/InvoiceLivePreview'
import { downloadInvoicePdf } from '../../lib/invoicePdf'

export default function InvoiceView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const { tenant } = useSelector((state) => state.auth)
  const { t } = useTranslation(language)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.get(`/invoices/${id}`).then(res => res.data)
  })

  const templateId = Number(invoice?.pdfTemplateId || tenant?.settings?.invoicePdfTemplate || 4)
  const invoiceTypeLabel = invoice?.transactionType === 'B2B' ? t('b2bInvoice') : t('b2cInvoice')

  const signMutation = useMutation({
    mutationFn: () => api.post(`/invoices/${id}/sign`),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم توقيع الفاتورة بنجاح' : 'Invoice signed successfully')
      queryClient.invalidateQueries(['invoice', id])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to sign invoice')
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{invoice?.invoiceNumber}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {new Date(invoice?.issueDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {invoice?.invoiceSubtype === 'travel_ticket' && (
            <button type="button" onClick={() => window.print()} className="btn btn-secondary">
              <Printer className="w-4 h-4" />
              {language === 'ar' ? 'طباعة' : 'Print'}
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              try {
                setDownloadingPdf(true)
                await downloadInvoicePdf({ invoice, language, tenant })
              } catch (e) {
                toast.error(language === 'ar' ? 'فشل تحميل PDF' : 'Failed to download PDF')
              } finally {
                setDownloadingPdf(false)
              }
            }}
            disabled={!invoice || downloadingPdf}
            className="btn btn-secondary"
          >
            {downloadingPdf ? (
              <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {language === 'ar' ? 'PDF' : 'PDF'}
          </button>
          {invoice?.status === 'draft' && invoice?.flow !== 'purchase' && (
            <button
              onClick={() => signMutation.mutate()}
              disabled={signMutation.isPending}
              className="btn btn-primary"
            >
              {signMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t('signInvoice')}
                </>
              )}
            </button>
          )}
          {invoice?.zatca?.signedXml && (
            <a
              href={`/api/invoices/${id}/xml`}
              target="_blank"
              className="btn btn-secondary"
            >
              <Download className="w-4 h-4" />
              {t('viewXml')}
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                  <FileText className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'نوع الفاتورة' : 'Invoice Type'}</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{invoiceTypeLabel}</p>
                </div>
              </div>
              <span className={`badge ${
                invoice?.zatca?.submissionStatus === 'cleared' ? 'badge-success' :
                invoice?.zatca?.submissionStatus === 'reported' ? 'badge-info' :
                invoice?.zatca?.submissionStatus === 'rejected' ? 'badge-danger' :
                'badge-warning'
              }`}>
                {invoice?.zatca?.submissionStatus === 'cleared' && <CheckCircle className="w-3 h-3 me-1" />}
                {invoice?.zatca?.submissionStatus === 'pending' && <Clock className="w-3 h-3 me-1" />}
                {invoice?.zatca?.submissionStatus || 'Draft'}
              </span>
            </div>

            <InvoiceLivePreview
              invoice={invoice}
              tenant={tenant}
              language={language}
              templateId={templateId}
            />
          </motion.div>

          {(invoice?.restaurantOrderId || invoice?.travelBookingId || invoice?.contractNumber) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <p className="text-sm font-medium text-gray-500 mb-3">{language === 'ar' ? 'المرجع' : 'Reference'}</p>
              <div className="space-y-2 text-sm">
                {invoice?.restaurantOrderId && (
                  <button
                    type="button"
                    onClick={() => navigate(`/app/dashboard/restaurant/orders/${invoice.restaurantOrderId}`)}
                    className="text-primary-600 hover:underline text-start"
                  >
                    {language === 'ar' ? 'طلب مطعم' : 'Restaurant Order'}: {String(invoice.restaurantOrderId).slice(-6)}
                  </button>
                )}
                {invoice?.travelBookingId && (
                  <button
                    type="button"
                    onClick={() => navigate(`/app/dashboard/travel-bookings/${invoice.travelBookingId}`)}
                    className="text-primary-600 hover:underline text-start"
                  >
                    {language === 'ar' ? 'حجز سفر' : 'Travel Booking'}: {String(invoice.travelBookingId).slice(-6)}
                  </button>
                )}
                {invoice?.contractNumber && (
                  <div className="text-gray-700 dark:text-gray-200">
                    {language === 'ar' ? 'رقم العقد/المرجع' : 'Contract/Ref'}: {invoice.contractNumber}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code */}
          {invoice?.zatca?.qrCodeData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                {t('viewQr')}
              </h3>
              <div className="flex justify-center p-4 bg-white rounded-xl">
                <QRCodeSVG value={invoice.zatca.qrCodeData} size={180} />
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">
                {language === 'ar' ? 'رمز QR للفاتورة الإلكترونية' : 'E-Invoice QR Code'}
              </p>
            </motion.div>
          )}

          {/* ZATCA Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {language === 'ar' ? 'معلومات هيئة الزكاة' : 'ZATCA Information'}
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">UUID</p>
                <p className="text-sm font-mono break-all">{invoice?.zatca?.uuid || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{language === 'ar' ? 'رقم التسلسل' : 'Counter'}</p>
                <p className="text-sm">{invoice?.zatca?.invoiceCounter || '-'}</p>
              </div>
              {invoice?.zatca?.submittedAt && (
                <div>
                  <p className="text-xs text-gray-500">{language === 'ar' ? 'تاريخ الإرسال' : 'Submitted At'}</p>
                  <p className="text-sm">{new Date(invoice.zatca.submittedAt).toLocaleString()}</p>
                </div>
              )}
              {invoice?.zatca?.invoiceHash && (
                <div>
                  <p className="text-xs text-gray-500">{language === 'ar' ? 'تجزئة الفاتورة' : 'Invoice Hash'}</p>
                  <p className="text-xs font-mono break-all bg-gray-50 dark:bg-dark-700 p-2 rounded">
                    {invoice.zatca.invoiceHash}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
