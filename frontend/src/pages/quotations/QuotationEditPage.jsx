import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { ArrowLeft } from 'lucide-react'
import api from '../../lib/api'
import QuotationComposer from '../../components/quotations/QuotationComposer'

const isEditableQuotation = (quotation) => ['draft', 'sent', 'rejected'].includes(String(quotation?.status || '').toLowerCase())

export default function QuotationEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { language } = useSelector((state) => state.ui)

  const { data: quotation, isLoading, error } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => api.get(`/quotations/${id}`).then((res) => res.data),
    enabled: Boolean(id),
  })

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (error || !quotation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app/dashboard/quotations')} className="btn btn-ghost btn-icon">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'تعذر تحميل عرض السعر' : 'Unable to load quotation'}</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">{language === 'ar' ? 'تحقق من عرض السعر ثم حاول مرة أخرى.' : 'Please verify the quotation and try again.'}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isEditableQuotation(quotation)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/app/dashboard/quotations/${id}`)} className="btn btn-ghost btn-icon">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'لا يمكن تعديل عرض السعر' : 'This quotation cannot be edited'}</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">{language === 'ar' ? 'يمكن تعديل العروض بحالة مسودة أو مرسل أو مرفوض فقط.' : 'Only draft, sent, or rejected quotations can be edited.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return <QuotationComposer quotationId={id} initialQuotation={quotation} />
}
