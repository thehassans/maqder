import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Building2, Mail, Phone, Globe, MapPin, Printer } from 'lucide-react';

export default function Letterhead() {
  const { tenant } = useSelector((state) => state.auth);
  const uiLanguage = useSelector((state) => state.ui.language);
  
  const [outputLang, setOutputLang] = useState('en'); // 'en', 'ar', 'both'
  const [contentEn, setContentEn] = useState('');
  const [contentAr, setContentAr] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  
  const [recipientEn, setRecipientEn] = useState('');
  const [recipientAr, setRecipientAr] = useState('');
  const [recipientTitleEn, setRecipientTitleEn] = useState('');
  const [recipientTitleAr, setRecipientTitleAr] = useState('');
  const [subjectEn, setSubjectEn] = useState('');
  const [subjectAr, setSubjectAr] = useState('');
  const [senderNameEn, setSenderNameEn] = useState('');
  const [senderNameAr, setSenderNameAr] = useState('');
  const [senderTitleEn, setSenderTitleEn] = useState('');
  const [senderTitleAr, setSenderTitleAr] = useState('');

  const companyNameEn = tenant?.business?.legalNameEn || 'Company Name';
  const companyNameAr = tenant?.business?.legalNameAr || 'اسم الشركة';
  const addressObj = tenant?.business?.address || {};
  const addressEn = [addressObj.buildingNumber, addressObj.street, addressObj.district, addressObj.city].filter(Boolean).join(', ') || 'Address not provided';
  const addressAr = [addressObj.buildingNumber, addressObj.street, addressObj.district, addressObj.city].filter(Boolean).join('، ') || 'العنوان غير متوفر';
  const phone = tenant?.business?.contactPhone || '';
  const email = tenant?.business?.contactEmail || '';
  const website = tenant?.business?.website || '';
  const logoUrl = tenant?.branding?.logo || '';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      {/* Controls (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {uiLanguage === 'ar' ? 'منشئ الخطابات' : 'Letterhead Generator'}
          </h1>
          <p className="text-gray-500 mt-1">
            {uiLanguage === 'ar' ? 'إنشاء وطباعة خطابات رسمية' : 'Create and print official company letters'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={outputLang}
            onChange={(e) => setOutputLang(e.target.value)}
            className="select"
          >
            <option value="en">{uiLanguage === 'ar' ? 'إنجليزي فقط' : 'English Only'}</option>
            <option value="ar">{uiLanguage === 'ar' ? 'عربي فقط' : 'Arabic Only'}</option>
            <option value="both">{uiLanguage === 'ar' ? 'عربي وإنجليزي (مزدوج)' : 'Bilingual (Both)'}</option>
          </select>
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer className="w-4 h-4" />
            {uiLanguage === 'ar' ? 'طباعة' : 'Print'}
          </button>
        </div>
      </div>

      {/* The Letter Paper */}
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-white text-gray-900 rounded-xl shadow-lg border border-gray-200 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
        
        {/* Letterhead Header */}
        <div className="border-b-2 border-primary-500/20 bg-gradient-to-r from-white to-gray-50 p-8 print:bg-none print:p-4">
          <div className="flex items-start justify-between gap-6">
            
            {/* Left (English/Logo) */}
            <div className="flex-1">
              {(outputLang === 'en' || outputLang === 'both') && (
                <div className="text-left">
                  <h1 className="text-2xl font-bold mb-3 print:text-black">{companyNameEn}</h1>
                  <div className="space-y-1.5 text-sm text-gray-600 print:text-black">
                    {addressEn && (
                      <div className="flex items-center justify-start gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{addressEn}</span>
                      </div>
                    )}
                    {phone && (
                      <div className="flex items-center justify-start gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Center Logo */}
            <div className="flex-shrink-0 mx-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-32 w-auto object-contain"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary-600" />
                </div>
              )}
            </div>

            {/* Right (Arabic) */}
            <div className="flex-1">
              {(outputLang === 'ar' || outputLang === 'both') && (
                <div className="text-right" dir="rtl">
                  <h1 className="text-2xl font-bold mb-3 print:text-black">{companyNameAr}</h1>
                  <div className="space-y-1.5 text-sm text-gray-600 print:text-black">
                    {addressAr && (
                      <div className="flex items-center justify-end gap-2">
                        <span>{addressAr}</span>
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                    )}
                    {email && (
                      <div className="flex items-center justify-end gap-2">
                        <span>{email}</span>
                        <Mail className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 min-h-[600px] print:min-h-0 print:p-4 bg-white text-black">
          {/* Date */}
          <div className="mb-8 flex justify-between">
            <div className="w-1/3">
              {(outputLang === 'en' || outputLang === 'both') && (
                <div className="print:hidden mb-2">
                  <label className="text-xs text-gray-500 mb-1 block">Date (EN)</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input bg-transparent" />
                </div>
              )}
              <div className="hidden print:block font-medium">Date: {date}</div>
            </div>
            
            <div className="w-1/3 text-right" dir="rtl">
              {(outputLang === 'ar' || outputLang === 'both') && (
                <div className="print:hidden mb-2">
                  <label className="text-xs text-gray-500 mb-1 block">التاريخ</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input bg-transparent" />
                </div>
              )}
              <div className="hidden print:block font-medium">التاريخ: {date}</div>
            </div>
          </div>

          {/* Grid Layout for Body */}
          <div className={`grid gap-8 ${outputLang === 'both' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            
            {/* English Column */}
            {(outputLang === 'en' || outputLang === 'both') && (
              <div className="space-y-6" dir="ltr">
                <div className="space-y-3">
                  <div className="print:hidden">
                    <input type="text" value={recipientEn} onChange={e => setRecipientEn(e.target.value)} placeholder="Recipient Name" className="input bg-transparent font-bold text-lg" />
                    <input type="text" value={recipientTitleEn} onChange={e => setRecipientTitleEn(e.target.value)} placeholder="Recipient Title / Company" className="input bg-transparent" />
                  </div>
                  <div className="hidden print:block">
                    <div className="font-bold text-lg">{recipientEn}</div>
                    <div>{recipientTitleEn}</div>
                  </div>
                </div>

                <div className="print:hidden">
                  <input type="text" value={subjectEn} onChange={e => setSubjectEn(e.target.value)} placeholder="Subject Line" className="input bg-transparent font-bold underline" />
                </div>
                <div className="hidden print:block font-bold underline">
                  {subjectEn ? `Subject: ${subjectEn}` : ''}
                </div>
                
                <div className="print:hidden">
                  <textarea
                    value={contentEn}
                    onChange={e => setContentEn(e.target.value)}
                    placeholder="Type your letter content here..."
                    className="w-full min-h-[300px] p-4 rounded-lg border border-gray-200 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div className="hidden print:block whitespace-pre-wrap min-h-[200px]">
                  {contentEn}
                </div>

                <div className="space-y-3 pt-8">
                  <p className="print:block hidden mb-8">Sincerely,</p>
                  <div className="print:hidden">
                    <input type="text" value={senderNameEn} onChange={e => setSenderNameEn(e.target.value)} placeholder="Your Name" className="input bg-transparent font-bold" />
                    <input type="text" value={senderTitleEn} onChange={e => setSenderTitleEn(e.target.value)} placeholder="Your Title" className="input bg-transparent" />
                  </div>
                  <div className="hidden print:block">
                    <div className="font-bold">{senderNameEn}</div>
                    <div>{senderTitleEn}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Arabic Column */}
            {(outputLang === 'ar' || outputLang === 'both') && (
              <div className="space-y-6" dir="rtl">
                <div className="space-y-3">
                  <div className="print:hidden">
                    <input type="text" value={recipientAr} onChange={e => setRecipientAr(e.target.value)} placeholder="اسم المستلم" className="input bg-transparent font-bold text-lg" />
                    <input type="text" value={recipientTitleAr} onChange={e => setRecipientTitleAr(e.target.value)} placeholder="المنصب / الجهة" className="input bg-transparent" />
                  </div>
                  <div className="hidden print:block">
                    <div className="font-bold text-lg">{recipientAr}</div>
                    <div>{recipientTitleAr}</div>
                  </div>
                </div>

                <div className="print:hidden">
                  <input type="text" value={subjectAr} onChange={e => setSubjectAr(e.target.value)} placeholder="الموضوع" className="input bg-transparent font-bold underline" />
                </div>
                <div className="hidden print:block font-bold underline">
                  {subjectAr ? `الموضوع: ${subjectAr}` : ''}
                </div>
                
                <div className="print:hidden">
                  <textarea
                    value={contentAr}
                    onChange={e => setContentAr(e.target.value)}
                    placeholder="اكتب محتوى الخطاب هنا..."
                    className="w-full min-h-[300px] p-4 rounded-lg border border-gray-200 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div className="hidden print:block whitespace-pre-wrap min-h-[200px]">
                  {contentAr}
                </div>

                <div className="space-y-3 pt-8">
                  <p className="print:block hidden mb-8">وتفضلوا بقبول فائق الاحترام،</p>
                  <div className="print:hidden">
                    <input type="text" value={senderNameAr} onChange={e => setSenderNameAr(e.target.value)} placeholder="الاسم" className="input bg-transparent font-bold" />
                    <input type="text" value={senderTitleAr} onChange={e => setSenderTitleAr(e.target.value)} placeholder="المنصب" className="input bg-transparent" />
                  </div>
                  <div className="hidden print:block">
                    <div className="font-bold">{senderNameAr}</div>
                    <div>{senderTitleAr}</div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Footer Section */}
        <div className="border-t-2 border-primary-500/20 bg-gradient-to-r from-gray-50 to-white p-6 print:bg-none print:p-4 mt-auto">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 print:text-black">
              {phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />
                  <span>{phone}</span>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  <span>{email}</span>
                </div>
              )}
              {website && (
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3 w-3" />
                  <span>{website}</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
