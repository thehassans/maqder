import { useEffect } from 'react'
import { useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'

const passengerTitleOptions = [
  { value: 'mr', labelEn: 'Mr.', labelAr: 'السيد' },
  { value: 'mrs', labelEn: 'Mrs.', labelAr: 'السيدة' },
  { value: 'ms', labelEn: 'Ms.', labelAr: 'الآنسة' },
]

export default function TravelInvoiceFields({ language = 'en', register, control, watch, setValue, partyPrefix = 'buyer', partyNameLabel }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'travelDetails.passengers' })
  const { fields: segmentFields, append: appendSegment, remove: removeSegment } = useFieldArray({ control, name: 'travelDetails.segments' })
  const primaryPassengerName = watch(`${partyPrefix}.name`)
  const routeSegments = watch('travelDetails.segments') || []
  const hasReturnDate = Boolean(watch('travelDetails.hasReturnDate'))

  useEffect(() => {
    setValue('travelDetails.travelerName', primaryPassengerName || '')
  }, [primaryPassengerName, setValue])

  useEffect(() => {
    const safeSegments = Array.isArray(routeSegments) ? routeSegments : []
    const firstSegment = safeSegments[0]
    const lastSegment = safeSegments[safeSegments.length - 1]
    setValue('travelDetails.routeFrom', firstSegment?.from || '')
    setValue('travelDetails.routeTo', lastSegment?.to || '')
  }, [routeSegments, setValue])

  useEffect(() => {
    if (!hasReturnDate) {
      setValue('travelDetails.returnDate', '')
    }
  }, [hasReturnDate, setValue])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label">{language === 'ar' ? 'الصفة' : 'Title'}</label>
          <select {...register('travelDetails.passengerTitle')} className="select">
            {passengerTitleOptions.map((option) => (
              <option key={option.value} value={option.value}>{language === 'ar' ? option.labelAr : option.labelEn}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{partyNameLabel || (language === 'ar' ? 'اسم العميل / الراكب' : 'Customer / Traveler Name')}</label>
          <input {...register(`${partyPrefix}.name`)} className="input" />
        </div>
        <div>
          <label className="label">{language === 'ar' ? 'رقم الجواز' : 'Passport Number'}</label>
          <input {...register('travelDetails.passportNumber')} className="input" />
        </div>
        <div>
          <label className="label">{language === 'ar' ? 'رقم التذكرة' : 'Ticket Number'}</label>
          <input {...register('travelDetails.ticketNumber')} className="input" />
        </div>
        <div>
          <label className="label">{language === 'ar' ? 'رقم PNR' : 'PNR'}</label>
          <input {...register('travelDetails.pnr')} className="input" />
        </div>
        <div>
          <label className="label">{language === 'ar' ? 'شركة الطيران / المورد' : 'Airline / Vendor'}</label>
          <input {...register('travelDetails.airlineName')} className="input" />
        </div>
        <div>
          <label className="label">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
          <input {...register(`${partyPrefix}.contactPhone`)} className="input" />
        </div>
        <div>
          <label className="label">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
          <input type="email" {...register(`${partyPrefix}.contactEmail`)} className="input" />
        </div>
        <div>
          <label className="label">{language === 'ar' ? 'تاريخ السفر' : 'Departure Date'}</label>
          <input type="date" {...register('travelDetails.departureDate')} className="input" />
        </div>
        <div>
          <label className="label">{language === 'ar' ? 'خيار العودة' : 'Return Trip'}</label>
          <label className="flex h-11 items-center gap-3 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 dark:border-dark-600 dark:text-gray-200">
            <input type="checkbox" {...register('travelDetails.hasReturnDate')} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span>{language === 'ar' ? 'تضمين تاريخ العودة' : 'Include return date'}</span>
          </label>
        </div>
        <div className={hasReturnDate ? '' : 'opacity-60'}>
          <label className="label">{language === 'ar' ? 'تاريخ العودة' : 'Return Date'}</label>
          <input type="date" {...register('travelDetails.returnDate')} className="input" disabled={!hasReturnDate} />
        </div>
        <div>
          <label className="label">{language === 'ar' ? 'التوقف / الإقامة' : 'Layover / Stay'}</label>
          <input {...register('travelDetails.layoverStay')} className="input" />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-4 dark:border-dark-600">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'مسار الرحلة' : 'Route Segments'}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'أضف أكثر من مقطع مثل الدمام → دبي ثم دبي → لاهور' : 'Add multiple legs like Dammam → Dubai then Dubai → Lahore'}</p>
          </div>
          <button type="button" onClick={() => appendSegment({ from: '', to: '' })} className="btn btn-secondary">
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'إضافة مقطع' : 'Add Segment'}
          </button>
        </div>

        <div className="space-y-3">
          {segmentFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] dark:border-dark-600">
              <div>
                <label className="label">{language === 'ar' ? 'من' : 'From'}</label>
                <input {...register(`travelDetails.segments.${index}.from`)} className="input" />
              </div>
              <div>
                <label className="label">{language === 'ar' ? 'إلى' : 'To'}</label>
                <input {...register(`travelDetails.segments.${index}.to`)} className="input" />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={() => removeSegment(index)} disabled={segmentFields.length === 1} className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-4 dark:border-dark-600">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'مسافرون إضافيون' : 'Additional Passengers'}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'أضف أسماء المسافرين الإضافيين عند الحاجة' : 'Add more passenger names when needed'}</p>
          </div>
          <button type="button" onClick={() => append({ title: 'mr', name: '', passportNumber: '' })} className="btn btn-secondary">
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'إضافة مسافر' : 'Add Passenger'}
          </button>
        </div>

        <div className="space-y-3">
          {fields.length === 0 && <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:bg-dark-700 dark:text-gray-400">{language === 'ar' ? 'لا يوجد مسافرون إضافيون' : 'No additional passengers yet'}</div>}
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-3 md:grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)_auto] dark:border-dark-600">
              <div>
                <label className="label">{language === 'ar' ? 'الصفة' : 'Title'}</label>
                <select {...register(`travelDetails.passengers.${index}.title`)} className="select">
                  {passengerTitleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{language === 'ar' ? option.labelAr : option.labelEn}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{language === 'ar' ? 'اسم المسافر' : 'Passenger Name'}</label>
                <input {...register(`travelDetails.passengers.${index}.name`)} className="input" />
              </div>
              <div>
                <label className="label">{language === 'ar' ? 'رقم الجواز' : 'Passport Number'}</label>
                <input {...register(`travelDetails.passengers.${index}.passportNumber`)} className="input" />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={() => remove(index)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <input type="hidden" {...register('travelDetails.routeFrom')} />
      <input type="hidden" {...register('travelDetails.routeTo')} />
      <input type="hidden" {...register('travelDetails.travelerName')} />
    </div>
  )
}
