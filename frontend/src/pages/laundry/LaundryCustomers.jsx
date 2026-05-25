import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import api from '../../lib/api'
import { toast } from 'react-hot-toast'
import { Search, UserPlus, Phone, CreditCard } from 'lucide-react'

export default function LaundryCustomers() {
  const { language } = useSelector(state => state.ui)
  const isRtl = language === 'ar'
  
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/laundry/customers')
      setCustomers(data.customers || [])
    } catch (error) {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.mobile.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isRtl ? 'إدارة العملاء' : 'Customer Management'}
        </h1>
        <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors">
          <UserPlus className="w-5 h-5" />
          {isRtl ? 'إضافة عميل' : 'New Customer'}
        </button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-dark-700">
          <div className="relative max-w-md">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={isRtl ? "البحث بالاسم أو رقم الجوال..." : "Search by name or mobile..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-gray-50 dark:bg-dark-900 border-none rounded-xl py-2 focus:ring-2 focus:ring-teal-500 ${isRtl ? 'pr-10' : 'pl-10'}`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-dark-900/50 border-b border-gray-200 dark:border-dark-700 text-gray-500 text-sm">
                <th className={`px-6 py-4 font-medium ${isRtl ? 'text-right' : ''}`}>{isRtl ? 'العميل' : 'Customer'}</th>
                <th className={`px-6 py-4 font-medium ${isRtl ? 'text-right' : ''}`}>{isRtl ? 'التفضيلات' : 'Preferences'}</th>
                <th className={`px-6 py-4 font-medium ${isRtl ? 'text-right' : ''}`}>{isRtl ? 'الطلبات السابقة' : 'Total Orders'}</th>
                <th className={`px-6 py-4 font-medium ${isRtl ? 'text-right' : ''}`}>{isRtl ? 'الرصيد المعلق' : 'Outstanding Balance'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredCustomers.map(customer => (
                <tr key={customer._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 dark:text-white">{customer.fullName}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" /> {customer.mobile}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <span className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-dark-600">
                        {customer.preferences?.foldingPreference === 'on_hanger' ? 'Hanger' : 'Folded'}
                      </span>
                      {customer.preferences?.starchLevel !== 'none' && (
                        <span className="px-2 py-1 text-xs rounded-lg bg-blue-50 text-blue-700">
                          {customer.preferences?.starchLevel} starch
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {customer.totalOrders}
                  </td>
                  <td className="px-6 py-4">
                    {customer.outstandingBalance > 0 ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-700 font-medium text-sm">
                        <CreditCard className="w-4 h-4" />
                        SAR {customer.outstandingBalance.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-500">SAR 0.00</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
