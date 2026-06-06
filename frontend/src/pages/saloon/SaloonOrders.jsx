import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Clock, PlayCircle, Scissors } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

export default function SaloonOrders() {
  const { language } = useSelector((state) => state.ui)
  const isRtl = language === 'ar'
  const queryClient = useQueryClient()
  
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['saloon-kanban'],
    queryFn: () => api.get('/saloon/orders/kanban').then(res => res.data),
    refetchInterval: 15000 // refresh every 15s
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/saloon/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['saloon-kanban'])
    }
  })

  const waitingOrders = orders.filter(o => o.status === 'waiting')
  const inProgressOrders = orders.filter(o => o.status === 'in_progress')

  const OrderCard = ({ order }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="card p-4 shadow-sm border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white">
              {order.queueNumber ? `Q-${order.queueNumber}` : `#${order.orderNumber.split('-')[1].slice(-4)}`}
            </h3>
            {order.queueNumber && <span className="text-xs text-gray-400">#{order.orderNumber.split('-')[1].slice(-4)}</span>}
          </div>
          <p className="text-sm text-gray-500">
            {order.customerName || (isRtl ? 'عميل' : 'Walk-in Customer')}
          </p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          order.paymentStatus === 'paid' 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
        }`}>
          {order.paymentStatus === 'paid' ? (isRtl ? 'مدفوع' : 'Paid') : (isRtl ? 'غير مدفوع' : 'Unpaid')}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-dark-700 p-2 rounded">
            <Scissors className="w-3 h-3 text-gray-400" />
            <span className="flex-1 font-medium">{isRtl ? item.nameAr : item.nameEn}</span>
            {item.staff && <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-1.5 rounded">{item.staff}</span>}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-dark-700 pt-3">
        {order.status === 'waiting' && (
          <button
            onClick={() => updateStatusMutation.mutate({ id: order._id, status: 'in_progress' })}
            className="btn btn-primary py-1.5 px-3 text-sm flex items-center gap-1 w-full justify-center"
          >
            <PlayCircle className="w-4 h-4" />
            {isRtl ? 'بدء الخدمة' : 'Start Service'}
          </button>
        )}
        {order.status === 'in_progress' && (
          <button
            onClick={() => updateStatusMutation.mutate({ id: order._id, status: 'completed' })}
            className="btn bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 px-3 text-sm flex items-center gap-1 w-full justify-center"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isRtl ? 'إنهاء الخدمة' : 'Complete'}
          </button>
        )}
      </div>
    </motion.div>
  )

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isRtl ? 'الطلبات النشطة' : 'Active Orders'}</h1>
        <p className="text-gray-500">{isRtl ? 'تتبع العملاء في الانتظار والخدمات الجارية' : 'Track waiting customers and services in progress'}</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
        {/* Waiting Column */}
        <div className="flex flex-col bg-gray-50/50 dark:bg-dark-900/50 rounded-2xl border border-gray-100 dark:border-dark-700 p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-dark-600">
            <Clock className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-lg">{isRtl ? 'قائمة الانتظار' : 'Waiting List'}</h2>
            <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded-full text-sm font-medium ml-auto">
              {waitingOrders.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <AnimatePresence>
              {waitingOrders.map(order => (
                <OrderCard key={order._id} order={order} />
              ))}
              {waitingOrders.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  {isRtl ? 'لا يوجد عملاء في الانتظار' : 'No customers waiting'}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* In Progress Column */}
        <div className="flex flex-col bg-gray-50/50 dark:bg-dark-900/50 rounded-2xl border border-gray-100 dark:border-dark-700 p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-dark-600">
            <PlayCircle className="w-5 h-5 text-blue-500" />
            <h2 className="font-bold text-lg">{isRtl ? 'قيد التنفيذ' : 'In Progress'}</h2>
            <span className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded-full text-sm font-medium ml-auto">
              {inProgressOrders.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <AnimatePresence>
              {inProgressOrders.map(order => (
                <OrderCard key={order._id} order={order} />
              ))}
              {inProgressOrders.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  {isRtl ? 'لا توجد خدمات قيد التنفيذ' : 'No services in progress'}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
