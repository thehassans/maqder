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
  const primaryPassengerName = watch(`${partyPrefix}.name`)

  useEffect(() => {
    setValue('travelDetails.travelerName', primaryPassengerName || '')
  }, [primaryPassengerName, setValue])

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
          <label className="label">{language === 'ar' ? 'من' : 'From'}</label>
          <input {...register('travelDetails.routeFrom')} className="input" />
        </div>
        <div>
          <label className="label">{language === 'ar' ? 'إلى' : 'To'}</label>
          <input {...register('travelDetails.routeTo')} className="input" />
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
          <label className="label">{language === 'ar' ? 'تاريخ العودة' : 'Return Date'}</label>
          <input type="date" {...register('travelDetails.returnDate')} className="input" />
        </div>
        <div>
          <label className="label">{language === 'ar' ? 'التوقف / الإقامة' : 'Layover / Stay'}</label>
          <input {...register('travelDetails.layoverStay')} className="input" />
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

      <input type="hidden" {...register('travelDetails.travelerName')} />
    </div>
  )
}
