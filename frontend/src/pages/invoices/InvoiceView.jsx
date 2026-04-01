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
import Money from '../../components/ui/Money'
import { downloadInvoicePdf } from '../../lib/invoicePdf'
import { calculateInvoiceSummary, normalizeTravelDetails } from '../../lib/invoiceDocument'

const formatAddress = (address = {}) => {
  return [address?.street, address?.district, address?.city, address?.postalCode, address?.country]
    .filter(Boolean)
    .join(', ')
}

const getPartyDetailLines = (party = {}, language = 'en') => {
  const lines = []

  if (party?.vatNumber) lines.push(`${language === 'ar' ? 'الرقم الضريبي' : 'VAT'}: ${party.vatNumber}`)
  if (party?.crNumber) lines.push(`${language === 'ar' ? 'السجل التجاري' : 'CR'}: ${party.crNumber}`)
  if (party?.contactPhone) lines.push(`${language === 'ar' ? 'الهاتف' : 'Phone'}: ${party.contactPhone}`)
  if (party?.contactEmail) lines.push(`${language === 'ar' ? 'البريد الإلكتروني' : 'Email'}: ${party.contactEmail}`)

  const addressText = formatAddress(party?.address)
  if (addressText) lines.push(`${language === 'ar' ? 'العنوان' : 'Address'}: ${addressText}`)

  return lines.length > 0 ? lines : ['—']
}

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

  const totals = calculateInvoiceSummary(invoice)
  const travelDetails = normalizeTravelDetails(invoice?.travelDetails || {}, invoice?.buyer?.name || '', language)
  const sellerName = language === 'ar' ? (invoice?.seller?.nameAr || invoice?.seller?.name || tenant?.business?.legalNameAr || tenant?.business?.legalNameEn) : (invoice?.seller?.name || invoice?.seller?.nameAr || tenant?.business?.legalNameEn || tenant?.business?.legalNameAr)
  const buyerName = language === 'ar' ? (invoice?.buyer?.nameAr || invoice?.buyer?.name || 'Cash Customer') : (invoice?.buyer?.name || invoice?.buyer?.nameAr || 'Cash Customer')
  const customerLabel = invoice?.flow === 'purchase' ? (language === 'ar' ? 'المشتري' : 'Buyer') : t('customer')
  const sellerDetails = getPartyDetailLines(invoice?.seller || {}, language)
  const buyerDetails = getPartyDetailLines(invoice?.buyer || {}, language)
  const logoSrc = tenant?.branding?.logo || '/maqder-logo.png'

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
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                  <FileText className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'نوع الفاتورة' : 'Invoice Type'}</p>
                  <p className="font-semibold">{invoice?.transactionType === 'B2B' ? t('b2bInvoice') : t('b2cInvoice')}</p>
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

            <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_160px]">
              <div className="rounded-3xl border border-gray-200 bg-gray-50/80 p-4 dark:border-dark-600 dark:bg-dark-700/60">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-dark-500">
                    <img src={logoSrc} alt="" className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-gray-500">{language === 'ar' ? 'هوية الفاتورة' : 'Invoice Identity'}</p>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-gray-200 bg-white px-3 py-3 dark:border-dark-500 dark:bg-dark-800">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{language === 'ar' ? 'البائع' : 'Seller'}</p>
                        <p className="mt-2 truncate font-semibold text-gray-900 dark:text-white">{sellerName || '—'}</p>
                      </div>
                      <div className="rounded-2xl border border-gray-200 bg-white px-3 py-3 dark:border-dark-500 dark:bg-dark-800">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{customerLabel}</p>
                        <p className="mt-2 truncate font-semibold text-gray-900 dark:text-white">{buyerName || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex min-h-[124px] flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white px-4 text-center dark:border-dark-600 dark:bg-dark-800">
                <p className="text-xs uppercase tracking-[0.24em] text-gray-500">{language === 'ar' ? 'فاتورة أعمال' : 'Business Invoice'}</p>
                <h2 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'فاتورة ضريبية' : 'Tax Invoice'}</h2>
                <p className="mt-2 text-sm text-gray-500">{sellerName || '—'}</p>
              </div>
              {invoice?.zatca?.qrCodeData ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white p-4 dark:border-dark-600 dark:bg-dark-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{invoice?.invoiceNumber}</p>
                  <p className="mt-1 text-xs text-gray-500">{new Date(invoice?.issueDate).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                  <div className="mt-3 rounded-2xl bg-white p-2">
                    <QRCodeSVG value={invoice.zatca.qrCodeData} size={104} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white p-4 text-center dark:border-dark-600 dark:bg-dark-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{invoice?.invoiceNumber}</p>
                  <p className="mt-1 text-xs text-gray-500">{new Date(invoice?.issueDate).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">{language === 'ar' ? 'البائع' : 'Seller'}</p>
                <p className="font-semibold text-gray-900 dark:text-white">{sellerName}</p>
                <div className="mt-2 space-y-1">
                  {sellerDetails.map((detail, index) => (
                    <p key={index} className="text-sm text-gray-500">{detail}</p>
                  ))}
                </div>
              </div>
              {invoice?.buyer?.name && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">{customerLabel}</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{buyerName}</p>
                  <div className="mt-2 space-y-1">
                    {buyerDetails.map((detail, index) => (
                      <p key={index} className="text-sm text-gray-500">{detail}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(invoice?.restaurantOrderId || invoice?.travelBookingId || invoice?.contractNumber) && (
              <div className="border-t border-gray-200 dark:border-dark-600 pt-4 mb-6">
                <p className="text-sm font-medium text-gray-500 mb-2">{language === 'ar' ? 'المرجع' : 'Reference'}</p>
                <div className="space-y-1 text-sm">
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
              </div>
            )}

            {invoice?.invoiceSubtype === 'travel_ticket' && (
              <div className="border-t border-gray-200 dark:border-dark-600 pt-4 mb-6">
                <p className="text-sm font-medium text-gray-500 mb-3">{language === 'ar' ? 'بيانات السفر' : 'Travel Details'}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">{language === 'ar' ? 'اسم العميل / الراكب' : 'Customer / Traveler Name'}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{travelDetails?.travelerDisplayName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{language === 'ar' ? 'رقم الجواز' : 'Passport Number'}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{travelDetails?.passportNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{language === 'ar' ? 'رقم التذكرة / PNR' : 'Ticket / PNR'}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{travelDetails?.ticketNumber || travelDetails?.pnr || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{language === 'ar' ? 'شركة الطيران / المورد' : 'Airline / Vendor'}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{travelDetails?.airlineDisplayName || sellerName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{language === 'ar' ? 'المسار' : 'Route'}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{travelDetails?.routeText || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{language === 'ar' ? 'تاريخ الرحلة' : 'Travel Date'}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{travelDetails?.departureDate ? new Date(travelDetails.departureDate).toLocaleDateString() : '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{language === 'ar' ? 'تاريخ العودة' : 'Return Date'}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{travelDetails?.hasReturnDate && travelDetails?.returnDate ? new Date(travelDetails.returnDate).toLocaleDateString() : '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{language === 'ar' ? 'التوقف / الإقامة' : 'Layover / Stay'}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{travelDetails?.layoverStayDisplay || '—'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500">{language === 'ar' ? 'مسافرون إضافيون' : 'Additional Passengers'}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{travelDetails?.additionalPassengersText || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Line Items */}
            <div className="border-t border-gray-200 dark:border-dark-600 pt-6">
              <table className="w-full">
                <thead>
                  <tr className="text-sm text-gray-500">
                    <th className="text-start pb-3">{t('productName')}</th>
                    <th className="text-center pb-3">{t('quantity')}</th>
                    <th className="text-end pb-3">{t('unitPrice')}</th>
                    <th className="text-end pb-3">{t('tax')}</th>
                    <th className="text-end pb-3">{t('total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice?.lineItems?.map((item, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-dark-700">
                      <td className="py-3">
                        <p className="font-medium">{language === 'ar' ? (item.productNameAr || item.productName || '—') : (item.productName || item.productNameAr || '—')}</p>
                        {(item.description || item.descriptionAr) && <p className="text-sm text-gray-500">{language === 'ar' ? (item.descriptionAr || item.description) : (item.description || item.descriptionAr)}</p>}
                      </td>
                      <td className="text-center py-3">{item.quantity}</td>
                      <td className="text-end py-3"><Money value={item.unitPrice} /></td>
                      <td className="text-end py-3"><Money value={item.taxAmount} /></td>
                      <td className="text-end py-3 font-semibold"><Money value={item.lineTotalWithTax} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 dark:border-dark-600 pt-4 mt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('subtotal')}</span>
                    <span><Money value={totals?.subtotal} /></span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('discount')}</span>
                    <span><Money value={totals?.totalDiscount} /></span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{language === 'ar' ? 'المبلغ الخاضع للضريبة' : 'Taxable Amount'}</span>
                    <span><Money value={totals?.taxableAmount} /></span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('tax')}</span>
                    <span><Money value={totals?.totalTax} /></span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-dark-600">
                    <span>{t('total')}</span>
                    <span className="text-primary-600"><Money value={totals?.grandTotal} /></span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
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
