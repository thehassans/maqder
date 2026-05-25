import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import api from '../../lib/api'
import { toast } from 'react-hot-toast'
import { Box, AlertTriangle, Plus } from 'lucide-react'

export default function LaundryInventory() {
  const { language } = useSelector(state => state.ui)
  const isRtl = language === 'ar'
  
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const { data } = await api.get('/laundry/inventory')
      setInventory(data)
    } catch (error) {
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isRtl ? 'مخزون المستلزمات' : 'Supplies Inventory'}
        </h1>
        <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors">
          <Plus className="w-5 h-5" />
          {isRtl ? 'عنصر جديد' : 'Add Item'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-10 text-gray-500">Loading...</div>
        ) : inventory.map(item => {
          const isLowStock = item.stockLevel <= item.reorderThreshold;
          
          return (
            <div key={item._id} className={`bg-white dark:bg-dark-800 rounded-2xl shadow-sm border p-5 ${isLowStock ? 'border-red-200 dark:border-red-900/50' : 'border-gray-100 dark:border-dark-700'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${isLowStock ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-600'}`}>
                  <Box className="w-6 h-6" />
                </div>
                {isLowStock && (
                  <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    {isRtl ? 'مخزون منخفض' : 'Low Stock'}
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {isRtl ? item.itemNameAr || item.itemNameEn : item.itemNameEn}
              </h3>
              
              <div className="flex items-end gap-2 mb-4">
                <span className={`text-3xl font-black ${isLowStock ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                  {item.stockLevel}
                </span>
                <span className="text-gray-500 font-medium mb-1">{item.unit}</span>
              </div>
              
              <div className="w-full bg-gray-100 dark:bg-dark-700 rounded-full h-2 mb-4 overflow-hidden">
                <div 
                  className={`h-2 rounded-full ${isLowStock ? 'bg-red-500' : 'bg-teal-500'}`}
                  style={{ width: `${Math.min(100, (item.stockLevel / (item.reorderThreshold * 3)) * 100)}%` }}
                ></div>
              </div>
              
              <button className="w-full py-2 border border-gray-200 dark:border-dark-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                {isRtl ? 'تحديث المخزون' : 'Update Stock'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
