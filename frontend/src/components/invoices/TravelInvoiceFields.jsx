export default function TravelInvoiceFields({ language = 'en', register, partyPrefix = 'buyer', partyNameLabel }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div>
        <label className="label">{language === 'ar' ? 'اسم المسافر' : 'Passenger Name'}</label>
        <input {...register('travelDetails.travelerName')} className="input" />
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
        <label className="label">{partyNameLabel || (language === 'ar' ? 'اسم العميل / الراكب' : 'Customer / Traveler Name')}</label>
        <input {...register(`${partyPrefix}.name`)} className="input" />
      </div>
    </div>
  )
}
