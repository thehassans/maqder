import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Plus, Minus, Trash2, ShoppingBag, CreditCard, Search, UserPlus } from 'lucide-react'
import api from '../../lib/api'
import { addItem, updateItemQuantity, removeItem, clearCart, setCustomer } from '../../store/slices/laundryCartSlice'
import { toast } from 'react-hot-toast'
import ThermalReceipt from '../../components/ui/ThermalReceipt'
import { useRef } from 'react'

export default function LaundryPOS() {
  const dispatch = useDispatch()
  const { language } = useSelector(state => state.ui)
  const cart = useSelector(state => state.laundryCart)
  const isRtl = language === 'ar'

  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Checkout states
  const [isProcessing, setIsProcessing] = useState(false)
  const [completedOrder, setCompletedOrder] = useState(null)
  const receiptRef = useRef(null)

  const handlePrint = () => {
    if (receiptRef.current) {
      window.print()
    }
  }

  const handleCloseReceipt = () => {
    setCompletedOrder(null)
    dispatch(clearCart())
  }
  
  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const { data } = await api.get('/laundry/services?isActive=true')
      setServices(data)
    } catch (error) {
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const filteredServices = services.filter(s => 
    (s.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     s.nameAr?.includes(searchQuery))
  )

  const handleCheckout = async () => {
    if (cart.items.length === 0) return toast.error('Cart is empty')
    
    setIsProcessing(true)
    try {
      const payload = {
        customer: cart.customer?._id,
        items: cart.items.map(item => ({
          service: item.service._id,
          nameEn: item.nameEn,
          nameAr: item.nameAr,
          billingType: item.billingType,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.service.taxRate,
          subtotal: item.subtotal,
          taxAmount: item.taxAmount,
          total: item.total
        })),
        deliveryType: cart.deliveryType,
        notes: cart.notes,
        subtotal: cart.items.reduce((s, i) => s + i.subtotal, 0),
        totalVat: cart.items.reduce((s, i) => s + i.taxAmount, 0),
        grandTotal: cart.items.reduce((s, i) => s + i.total, 0),
        amountPaid: cart.items.reduce((s, i) => s + i.total, 0), // Assuming full payment for POS
      }
      
      const { data } = await api.post('/laundry/orders/checkout', payload)
      toast.success(isRtl ? `تم إنشاء الطلب: ${data.orderNumber}` : `Order created: ${data.orderNumber}`)
      setCompletedOrder(data)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Checkout failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-6rem)] gap-6">
      
      {/* Left: Service Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 ${isRtl ? 'right-4' : 'left-4'}`} />
          <input
            type="text"
            placeholder={isRtl ? "البحث عن خدمة..." : "Search services..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-white dark:bg-dark-800 border-none rounded-2xl shadow-sm py-3 focus:ring-2 focus:ring-teal-500 ${isRtl ? 'pr-12' : 'pl-12'}`}
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredServices.map(service => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={service._id}
                  onClick={() => dispatch(addItem({ service, quantity: 1 }))}
                  className="bg-white dark:bg-dark-800 p-4 rounded-2xl shadow-sm border border-transparent hover:border-teal-500 text-left flex flex-col"
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-teal-600 mb-2">
                    {service.category.replace('_', ' ')}
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white mb-1">
                    {isRtl ? service.nameAr : service.nameEn}
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    SAR {service.basePrice.toFixed(2)} / {service.billingType === 'per_kg' ? 'KG' : 'Piece'}
                  </div>
                  <div className="mt-auto w-full py-2 bg-gray-50 dark:bg-dark-700 rounded-xl text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isRtl ? 'إضافة' : 'Add to Cart'}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart Sidebar */}
      <div className="w-full lg:w-96 bg-white dark:bg-dark-800 rounded-2xl shadow-sm flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100 dark:border-dark-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-teal-600" />
            {isRtl ? 'سلة الطلبات' : 'Current Order'}
          </h2>
        </div>

        {/* Customer Selector (Simple version) */}
        <div className="p-4 border-b border-gray-100 dark:border-dark-700">
          <button className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-xl text-gray-500 hover:text-teal-600 hover:border-teal-500 transition-colors">
            <UserPlus className="w-4 h-4" />
            {isRtl ? 'إضافة عميل' : 'Add Customer (Optional)'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.items.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              {isRtl ? 'السلة فارغة' : 'Cart is empty'}
            </div>
          ) : (
            cart.items.map(item => (
              <div key={item.service._id} className="flex gap-3 items-center">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {isRtl ? item.nameAr : item.nameEn}
                  </div>
                  <div className="text-sm text-gray-500">
                    SAR {item.unitPrice.toFixed(2)} x {item.quantity}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-700 rounded-lg p-1">
                  <button 
                    onClick={() => dispatch(updateItemQuantity({ serviceId: item.service._id, quantity: item.quantity - 1 }))}
                    className="p-1 hover:bg-white dark:hover:bg-dark-600 rounded text-gray-600 dark:text-gray-300"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <button 
                    onClick={() => dispatch(updateItemQuantity({ serviceId: item.service._id, quantity: item.quantity + 1 }))}
                    className="p-1 hover:bg-white dark:hover:bg-dark-600 rounded text-gray-600 dark:text-gray-300"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="text-right min-w-[4rem] font-bold text-gray-900 dark:text-white">
                  {item.total.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-dark-900/50 rounded-b-2xl border-t border-gray-100 dark:border-dark-700 space-y-3">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{isRtl ? 'المجموع الفرعي' : 'Subtotal'}</span>
            <span>SAR {cart.items.reduce((s, i) => s + i.subtotal, 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{isRtl ? 'ضريبة القيمة المضافة' : 'VAT (15%)'}</span>
            <span>SAR {cart.items.reduce((s, i) => s + i.taxAmount, 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-dark-600">
            <span>{isRtl ? 'الإجمالي' : 'Total'}</span>
            <span>SAR {cart.items.reduce((s, i) => s + i.total, 0).toFixed(2)}</span>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={cart.items.length === 0 || isProcessing}
            className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (isRtl ? 'جاري المعالجة...' : 'Processing...') : (
              <>
                <CreditCard className="w-5 h-5" />
                {isRtl ? 'الدفع' : 'Checkout'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Print Modal */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 print:bg-white print:static print:inset-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[400px] max-h-[90vh] overflow-y-auto print:shadow-none print:p-0 print:w-auto print:max-h-none print:overflow-visible">
            <div className="flex justify-between items-center mb-4 print:hidden">
              <h3 className="text-lg font-bold">{isRtl ? 'إيصال الطلب' : 'Order Receipt'}</h3>
              <button onClick={handleCloseReceipt} className="text-gray-500 hover:text-gray-700">
                <Minus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-2 print:border-none print:p-0 flex justify-center">
              <ThermalReceipt ref={receiptRef} order={completedOrder} type="laundry" />
            </div>

            <div className="mt-6 flex gap-3 print:hidden">
              <button onClick={handleCloseReceipt} className="btn btn-secondary flex-1">
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
              <button onClick={handlePrint} className="btn btn-primary flex-1">
                {isRtl ? 'طباعة' : 'Print Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
