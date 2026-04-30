import { Mail, Phone } from 'lucide-react'

const fallbackImages = [
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=100',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&h=100&auto=format&fit=crop',
]

const getEmployeeName = (employee, language) => {
  const englishName = `${employee?.firstNameEn || ''} ${employee?.lastNameEn || ''}`.trim()
  const arabicName = `${employee?.firstNameAr || employee?.firstNameEn || ''} ${employee?.lastNameAr || employee?.lastNameEn || ''}`.trim()
  return language === 'ar' ? arabicName || englishName || employee?.employeeId : englishName || arabicName || employee?.employeeId
}

const getStatusClassName = (status) => {
  if (status === 'active') return 'bg-green-500/20 text-green-600 border-green-500/30'
  if (status === 'on_leave') return 'bg-amber-500/20 text-amber-600 border-amber-500/30'
  return 'bg-red-500/20 text-red-600 border-red-500/30'
}

export default function EmployeeContactCards({ employees = [], language = 'en' }) {
  if (!employees.length) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      {employees.map((employee, index) => {
        const name = getEmployeeName(employee, language)
        const image = employee?.profileImage || fallbackImages[index % fallbackImages.length]
        const status = employee?.status || 'active'

        return (
          <div key={employee?._id || employee?.employeeId || index} className="text-sm text-gray-500 dark:text-gray-400 w-full sm:w-80 divide-y divide-gray-500/30 border border-gray-500/30 rounded-xl bg-white dark:bg-dark-800 shadow-sm overflow-hidden">
            <div className="flex items-start justify-between p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg text-gray-800 dark:text-white truncate">{name}</h2>
                  <p className={`px-2 py-0.5 rounded-full text-xs border capitalize whitespace-nowrap ${getStatusClassName(status)}`}>{status.replace('_', ' ')}</p>
                </div>
                <p className="truncate">{employee?.department || employee?.position || (language === 'ar' ? 'موظف' : 'Employee')}</p>
              </div>
              <img className="h-10 w-10 rounded-full object-cover shrink-0" src={image} alt={name || 'employee'} />
            </div>
            <div className="flex items-center divide-x divide-gray-500/30 rtl:divide-x-reverse">
              <a href={employee?.email ? `mailto:${employee.email}` : undefined} className={`flex items-center justify-center gap-2 w-1/2 py-3 transition-colors ${employee?.email ? 'hover:bg-gray-50 dark:hover:bg-dark-700' : 'pointer-events-none opacity-50'}`}>
                <Mail className="w-[18px] h-[18px]" />
                {language === 'ar' ? 'إرسال بريد' : 'Send Email'}
              </a>
              <a href={employee?.phone ? `tel:${employee.phone}` : undefined} className={`flex items-center justify-center gap-2 w-1/2 py-3 transition-colors ${employee?.phone ? 'hover:bg-gray-50 dark:hover:bg-dark-700' : 'pointer-events-none opacity-50'}`}>
                <Phone className="w-[18px] h-[18px]" />
                {language === 'ar' ? 'اتصال الآن' : 'Call Now'}
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}
