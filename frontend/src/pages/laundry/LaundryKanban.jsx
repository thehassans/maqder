import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import api from '../../../lib/api'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

export default function LaundryKanban() {
  const { language } = useSelector(state => state.ui)
  const isRtl = language === 'ar'
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const STAGES = [
    { id: 'received', labelEn: 'Received', labelAr: 'مستلم', color: 'bg-blue-100 text-blue-800' },
    { id: 'processing', labelEn: 'Processing', labelAr: 'قيد التنفيذ', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'ready', labelEn: 'Ready', labelAr: 'جاهز', color: 'bg-green-100 text-green-800' },
    { id: 'out_for_delivery', labelEn: 'Delivery', labelAr: 'قيد التوصيل', color: 'bg-purple-100 text-purple-800' }
  ]

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/laundry/orders/kanban')
      setOrders(data)
    } catch (error) {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/laundry/orders/${orderId}/status`, { status: newStatus })
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o))
      toast.success('Status updated')
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isRtl ? 'الطلبات النشطة' : 'Active Orders'}
        </h1>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 min-w-max h-full pb-4">
          {STAGES.map(stage => (
            <div key={stage.id} className="w-80 flex flex-col bg-gray-50/50 dark:bg-dark-800/50 rounded-2xl p-4 border border-gray-100 dark:border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold px-3 py-1 rounded-full text-sm ${stage.color}`}>
                  {isRtl ? stage.labelAr : stage.labelEn}
                </h3>
                <span className="text-gray-500 font-medium text-sm">
                  {orders.filter(o => o.status === stage.id).length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {orders.filter(o => o.status === stage.id).map(order => (
                  <div key={order._id} className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-600">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-gray-900 dark:text-white">{order.orderNumber}</span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(order.createdAt), 'HH:mm')}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {order.customer ? order.customer.fullName : 'Walk-in Customer'}
                      <br/>
                      {order.items?.length || 0} items — SAR {order.grandTotal.toFixed(2)}
                    </div>

                    <div className="flex gap-2">
                      {/* Move to next stage logic */}
                      {stage.id === 'received' && (
                        <button onClick={() => updateStatus(order._id, 'processing')} className="flex-1 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 rounded-lg">Start</button>
                      )}
                      {stage.id === 'processing' && (
                        <button onClick={() => updateStatus(order._id, 'ready')} className="flex-1 py-1.5 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded-lg">Mark Ready</button>
                      )}
                      {stage.id === 'ready' && (
                        <button onClick={() => updateStatus(order._id, 'delivered')} className="flex-1 py-1.5 text-xs font-medium bg-teal-600 text-white hover:bg-teal-700 rounded-lg">Deliver/Pickup</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
