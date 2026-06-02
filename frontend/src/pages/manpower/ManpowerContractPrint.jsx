import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import api from '../../lib/api'
import { formatCurrency } from '../../lib/currency'

export default function ManpowerContractPrint() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { language } = useSelector((state) => state.ui)
  const { tenant } = useSelector((state) => state.auth)
  const [isPrinting, setIsPrinting] = useState(false)

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['manpower-assignment', id],
    queryFn: () => api.get(`/manpower/assignments/${id}`).then(res => res.data),
    enabled: !!id
  })

  useEffect(() => {
    if (assignment && !isPrinting) {
      setIsPrinting(true)
      // Small delay to ensure styles and fonts are loaded
      setTimeout(() => {
        window.print()
        // Optional: auto navigate back after print dialog closes
        // window.onafterprint = () => navigate(-1)
      }, 800)
    }
  }, [assignment, isPrinting, navigate])

  if (isLoading || !assignment) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const isAr = language === 'ar'
  const currency = tenant?.settings?.currency || 'SAR'

  return (
    <div className="min-h-screen bg-white p-8" dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? 'Tajawal, sans-serif' : 'Inter, sans-serif' }}>
      <div className="max-w-4xl mx-auto border border-gray-200 p-12 rounded-xl">
        {/* Header section with branding */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isAr ? 'عقد توريد عمالة' : 'Manpower Supply Contract'}
            </h1>
            <p className="text-gray-500">
              {isAr ? 'رقم العقد:' : 'Contract Ref:'} <span className="font-semibold text-gray-800">{assignment.assignmentNumber || id.slice(-6).toUpperCase()}</span>
            </p>
          </div>
          <div className="text-end">
            <h2 className="text-xl font-bold text-gray-900">{tenant?.nameAr || tenant?.name}</h2>
            <p className="text-sm text-gray-500 max-w-[200px] mt-1">
              {isAr ? 'المورد للعمالة والموارد البشرية' : 'Manpower & HR Supplier'}
            </p>
            {tenant?.vatNumber && (
              <p className="text-sm text-gray-500 mt-1">
                {isAr ? 'الرقم الضريبي:' : 'VAT Number:'} {tenant.vatNumber}
              </p>
            )}
          </div>
        </div>

        <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
            {isAr ? 'الطرف الثاني (العميل)' : 'Second Party (Client)'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">{isAr ? 'اسم العميل' : 'Client Name'}</p>
              <p className="font-semibold text-gray-900">{assignment.clientName}</p>
            </div>
            {assignment.site && (
              <div>
                <p className="text-sm text-gray-500 mb-1">{isAr ? 'موقع العمل' : 'Work Site'}</p>
                <p className="font-semibold text-gray-900">{assignment.site}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 mb-1">{isAr ? 'تاريخ بداية العقد' : 'Start Date'}</p>
              <p className="font-semibold text-gray-900">{new Date(assignment.startDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">{isAr ? 'تاريخ نهاية العقد' : 'End Date'}</p>
              <p className="font-semibold text-gray-900">{assignment.endDate ? new Date(assignment.endDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : (isAr ? 'مفتوح' : 'Open Ended')}</p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {isAr ? 'بيانات العمالة والتكلفة' : 'Workers & Cost Details'}
          </h3>
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-start font-semibold text-gray-700 border border-gray-200">
                  {isAr ? 'العامل' : 'Worker'}
                </th>
                <th className="py-3 px-4 text-start font-semibold text-gray-700 border border-gray-200">
                  {isAr ? 'المهنة' : 'Trade'}
                </th>
                <th className="py-3 px-4 text-start font-semibold text-gray-700 border border-gray-200">
                  {isAr ? 'التكلفة اليومية' : 'Daily Rate'}
                </th>
                <th className="py-3 px-4 text-start font-semibold text-gray-700 border border-gray-200">
                  {isAr ? 'ساعات/يوم' : 'Hours/Day'}
                </th>
              </tr>
            </thead>
            <tbody>
              {(assignment.workers || []).map((w, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-3 px-4 border border-gray-200">{w.workerId?.name || '-'}</td>
                  <td className="py-3 px-4 border border-gray-200">{w.workerId?.trade || '-'}</td>
                  <td className="py-3 px-4 border border-gray-200">{formatCurrency(w.dailyRate || 0, currency)}</td>
                  <td className="py-3 px-4 border border-gray-200">{w.hoursPerDay || 8}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-12 text-gray-700 space-y-4 text-sm leading-relaxed">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
          </h3>
          <ol className={`list-decimal space-y-2 ${isAr ? 'pr-5' : 'pl-5'}`}>
            <li>{isAr ? 'يلتزم الطرف الأول بتوفير العمالة حسب العدد والمهن المتفق عليها في الجدول أعلاه.' : 'The First Party shall provide the workers according to the number and trades agreed upon in the table above.'}</li>
            <li>{isAr ? 'يتم احتساب التكلفة بناءً على التكلفة اليومية الموضحة وتصدر الفواتير بشكل دوري.' : 'The cost is calculated based on the stated daily rate and invoices are issued periodically.'}</li>
            <li>{isAr ? 'أي ساعات عمل إضافية يتفق عليها الطرفان تُحتسب بتكلفة إضافية.' : 'Any additional working hours agreed upon by both parties will be charged additionally.'}</li>
            {assignment.notes && (
              <li><span className="font-semibold">{isAr ? 'ملاحظات إضافية:' : 'Additional Notes:'}</span> {assignment.notes}</li>
            )}
          </ol>
        </div>

        <div className="grid grid-cols-2 gap-12 mt-24">
          <div className="text-center">
            <div className="border-b-2 border-gray-300 w-48 mx-auto mb-2"></div>
            <p className="font-semibold text-gray-800">{isAr ? 'الطرف الأول (المورد)' : 'First Party (Supplier)'}</p>
            <p className="text-sm text-gray-500 mt-1">{tenant?.nameAr || tenant?.name}</p>
          </div>
          <div className="text-center">
            <div className="border-b-2 border-gray-300 w-48 mx-auto mb-2"></div>
            <p className="font-semibold text-gray-800">{isAr ? 'الطرف الثاني (العميل)' : 'Second Party (Client)'}</p>
            <p className="text-sm text-gray-500 mt-1">{assignment.clientName}</p>
          </div>
        </div>

        {/* Print-only CSS helpers */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .min-h-screen { min-height: auto; padding: 0 !important; }
            .max-w-4xl { border: none !important; margin: 0 !important; padding: 0 !important; }
          }
        `}} />
      </div>
    </div>
  )
}
